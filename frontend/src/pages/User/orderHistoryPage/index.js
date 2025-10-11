import { memo, useState, useEffect } from "react";
import axios from "axios";
import "./style.scss";
import Breadcrumb from "../theme/breadcrumb";
import { formatter } from "utils/fomatter";
import { RiErrorWarningLine } from "react-icons/ri";
import { ROUTERS } from "utils/router";
import { useNavigate } from "react-router-dom";

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

const OrderHistoryPage = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State cho popup QR
  const [showQrPopup, setShowQrPopup] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");
  const [countdown, setCountdown] = useState(0);

  // State lưu paymentId để check trạng thái thanh toán
  const [paymentId, setPaymentId] = useState(null);

  // Lấy danh sách đơn hàng
  const fetchOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get("https://localhost:7033/api/Order/get-orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (err) {
      setError("Không thể lấy danh sách đơn hàng. Vui lòng thử lại.");
      console.error("Lỗi khi lấy đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Hàm gọi API tạo lại mã QR khi bấm "Thanh toán" cho đơn Pending
  const handleRetryPayment = async (order) => {
    setQrLoading(true);
    setQrError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setQrError("Bạn cần đăng nhập để tiếp tục thanh toán.");
        setQrLoading(false);
        return;
      }

      // Gọi API payment, giả sử trả về paymentId + qrCodeUrl
      const response = await axios.post(
        "https://localhost:7100/api/Payment/process-payment",
        {
          BankCode: "VCB", // giả sử bank cố định
          AccountNumber: "123456789", // giả sử cố định
          AccountName: "Nguyen Van A",
          TotalPrice: order.totalCost,
          Note: `Thanh toán đơn hàng #${order.orderId}`,
          OrderId: order.orderId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        // Giả sử response.data có 2 trường paymentId và qrCodeUrl
        const { paymentId, qrCodeUrl } = response.data;

        if (!paymentId || !qrCodeUrl) {
          setQrError("Dữ liệu thanh toán không hợp lệ, vui lòng thử lại.");
          setQrLoading(false);
          return;
        }

        setPaymentId(paymentId); // Lưu paymentId để check trạng thái
        setQrCodeUrl(qrCodeUrl);
        setShowQrPopup(true);
        setCountdown(360); // 6 phút đếm ngược
      } else {
        setQrError("Không thể tạo mã QR. Vui lòng thử lại sau.");
      }
    } catch (error) {
      console.error("Lỗi khi tạo mã QR:", error);
      setQrError("Có lỗi xảy ra khi tạo mã QR. Vui lòng thử lại.");
    } finally {
      setQrLoading(false);
    }
  };

  // Countdown tự động đóng popup sau 6 phút
  useEffect(() => {
    if (!showQrPopup || countdown <= 0) return;

    const timerId = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [showQrPopup, countdown]);

  // Poll trạng thái thanh toán theo paymentId và showQrPopup
  useEffect(() => {
    if (!paymentId || !showQrPopup) return;

    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem("token");

        // Gọi kiểm tra trạng thái thanh toán
        const res = await axios.get(
          `https://localhost:7100/api/Payment/check-payment?paymentId=${paymentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.status === 200 && res.data.status === "Completed") {
          clearInterval(interval);

          // Đồng bộ trạng thái đơn hàng lên backend (có thể gọi api sync riêng)
          try {
            await axios.get("https://localhost:7033/api/Order/sync-order-payment-status", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            console.log("Đã cập nhật trạng thái đơn hàng.");
          } catch (orderSyncError) {
            console.error("Lỗi khi cập nhật trạng thái đơn hàng:", orderSyncError);
          }

          setShowQrPopup(false);
          setPaymentId(null);

          // Refresh lại danh sách đơn hàng để cập nhật trạng thái mới
          fetchOrders();

          // Thông báo thành công và chuyển hướng hoặc cuộn lên đầu trang
          alert("Thanh toán thành công!");
          navigate(ROUTERS.USER.MESSAGE);
          window.scrollTo(0, 0);
        }
      } catch (error) {
        console.error("Lỗi kiểm tra trạng thái thanh toán:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentId, showQrPopup]);

  if (loading) {
    return (
      <>
        <Breadcrumb name="Lịch sử đơn hàng" />
        <div className="order-history-page">
          <h2>Danh sách đơn hàng</h2>
          <p>Đang tải đơn hàng...</p>
        </div>
      </>
    );
  }

    // Thêm hàm handleDelete để gọi API hủy (update status) hoặc xóa đơn
    const handleCancel = async (orderId) => {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Bạn cần đăng nhập để thực hiện thao tác này.");
        return;
    }

    try {
        // Gọi API cập nhật trạng thái thành Cancelled
        const res = await axios.patch(
        `https://localhost:7033/api/Order/update-status/${orderId}`,
        { status: "Cancelled" },
        {
            headers: {
            Authorization: `Bearer ${token}`,
            },
        }
        );

        if (res.status === 200) {
        // Cập nhật lại trạng thái trong local state orders
        setOrders((prevOrders) =>
            prevOrders.map((order) =>
            order.orderId === orderId ? { ...order, status: "Cancelled" } : order
            )
        );
        alert("Đã hủy đơn thành công!");
        } else {
        alert("Hủy đơn không thành công, thử lại sau.");
        }
    } catch (error) {
        console.error("Lỗi khi hủy đơn:", error);
        alert("Có lỗi xảy ra khi hủy đơn.");
    }
    };

    // Thực hiện xóa đơn hàng 
    const handleDelete = async (orderId) => {
        const confirmDelete = window.confirm(`Bạn có chắc muốn xóa đơn hàng #${orderId}?`);
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem("token");
            await axios.delete(`https://localhost:7033/api/Order/delete/${orderId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            alert("Xóa đơn hàng thành công!");
            // Gọi lại API để load danh sách đơn hàng mới
            fetchOrders();
        } catch (err) {
            alert("Không thể xóa đơn hàng!");
            console.error(err);
        }
    };


  if (error) {
    return (
      <>
        <Breadcrumb name="Lịch sử đơn hàng" />
        <div className="order-history-page">
          <h2>Danh sách đơn hàng</h2>
          <p style={{ color: "red" }}>{error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb name="Lịch sử đơn hàng" />
      <div className="container">
        <div className="order-history-page">
          <h2>Danh sách đơn hàng</h2>
          <table className="order-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Sản phẩm</th>
                <th>Ngày đặt</th>
                <th>Thành tiền</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.orderId}>
                    <td>#{order.orderId}</td>
                    <td>
                      {Array.isArray(order.items) && order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                          <div className="product-info" key={idx}>
                            <img
                              src={`https://localhost:7007/images/${item.imageProduct}`}
                              alt={item.name}
                            />
                            <div>
                              <p className="product-name">{item.name}</p>
                              <p className="product-qty">x{item.soLuong}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>Không có sản phẩm</p>
                      )}
                    </td>
                    <td>{new Date(order.createdDate).toLocaleDateString()}</td>
                    <td>{formatter(order.totalCost)}</td>
                    <td>
                      {order.status === "Pending"
                        ? "Chờ thanh toán"
                        : order.status === "Completed"
                        ? "Đã thanh toán"
                        : order.status === "Cancelled"
                        ? "Đã hủy"
                        : order.status}
                    </td>
                    <td>
                        <div className="order-actions">
                            {order.status === "Pending" && (
                            <button
                                className="btn-primary"
                                onClick={() => handleRetryPayment(order)}
                                disabled={qrLoading}
                            >
                                {qrLoading ? "Đang xử lý..." : "Thanh toán"}
                            </button>
                            )}
                            {(order.status === "Pending" || order.status === "Chờ xác nhận") && (
                            <button className="btn-outline ml-2" onClick={() => handleCancel(order.orderId)}>
                                Hủy
                            </button>
                            )}
                            {order.status === "Cancelled" && (
                            <button className="btn-outline ml-2" onClick={() => handleDelete(order.orderId)}>
                                Xóa
                            </button>
                            )}
                        </div>
                        </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center" }}>
                    Chưa có đơn hàng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popup mã QR */}
      {showQrPopup && (
        <div className="qr-popup">
          <div className="qr-popup-content">
            <h3>Quét mã QR để thanh toán</h3>
            <img src={qrCodeUrl} alt="QR Code Thanh Toán" className="qr-image" />
            <p className="qr-expire">
              <RiErrorWarningLine size={24} color="#FFC107" /> Hết hạn sau: {formatTime(countdown)}
            </p>
            <div className="qr-popup-actions">
              <button className="btn-outline" onClick={() => setShowQrPopup(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default memo(OrderHistoryPage);
