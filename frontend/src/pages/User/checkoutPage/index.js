// src/pages/User/checkout/index.jsx
import { memo, useEffect, useState } from "react";
import Breadcrumb from "../theme/breadcrumb";
import "./style.scss";
import { formatter } from "utils/fomatter";
import { AiOutlineCreditCard, AiOutlineGift } from "react-icons/ai";
import { RiErrorWarningLine } from "react-icons/ri";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ROUTERS } from "utils/router";

// ===== Base URLs (ưu tiên .env, fallback theo hostname hiện tại) =====
const USER_API = process.env.REACT_APP_USER_API || `http://${window.location.hostname}:7200`;
const CART_API = process.env.REACT_APP_CART_API || `http://${window.location.hostname}:7099`;
const ORDER_API = process.env.REACT_APP_ORDER_API || `http://${window.location.hostname}:7101`;
const PAYMENT_API = process.env.REACT_APP_PAYMENT_API || `http://${window.location.hostname}:7103`;

// ===== Axios có sẵn Authorization nếu có token =====
const authAxios = axios.create();
authAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ===== Helpers =====
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

// 👉 Convert mọi loại QR URL (HTML hoặc ảnh) -> link ảnh PNG để <img> hiển thị
const toQrImageSrc = (qrCodeUrl) => {
  if (!qrCodeUrl) return "";
  try {
    const u = new URL(qrCodeUrl);
    // nếu đã là ảnh (vd. sepay /img, png, svg...) thì dùng luôn
    if (/\.(png|jpg|jpeg|svg)$/i.test(u.pathname) || u.pathname.endsWith("/img")) {
      return qrCodeUrl;
    }
    // còn lại coi như là 1 URL cần encode vào QR -> render ảnh PNG qua dịch vụ tạo mã QR
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeUrl)}`;
  } catch {
    // nếu không phải URL hợp lệ, encode nguyên chuỗi
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeUrl)}`;
  }
};

const CheckoutPage = () => {
  const navigate = useNavigate();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [productCart, setProductCart] = useState(null);

  const [qrCodeUrl, setQrCodeUrl] = useState(""); // có thể là URL mock-bank (HTML) hoặc ảnh
  const [countdown, setCountdown] = useState(0);
  const [paymentId, setPaymentId] = useState("");
  const [orderId, setOrderId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [showQrPopup, setShowQrPopup] = useState(false);
  const [pendingOrderPopup, setPendingOrderPopup] = useState(null);

  // ===== Form người nhận (thêm email) =====
  const [customerInfo, setCustomerInfo] = useState({
    fullName: "",
    address: "",
    phone: "",
    email: "",
    note: "",
  });

  // ===== Quản lý địa chỉ =====
  const [addressList, setAddressList] = useState([]);
  const [defaultAddressId, setDefaultAddressId] = useState(null);
  const [currentAddressId, setCurrentAddressId] = useState(null);

  // ------------------------------------------------------------------
  // 1) Lấy chi tiết giỏ hàng
  // ------------------------------------------------------------------
  useEffect(() => {
    const fetchCartDetails = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("Không có token -> không thể lấy giỏ hàng /me");
        setProductCart(null);
        return;
      }
      try {
        const res = await authAxios.get(`${CART_API}/api/Cart/me`);
        const data = res.data || {};
        const normalized = {
          items: Array.isArray(data.items)
            ? data.items
            : Array.isArray(data.cartItems)
              ? data.cartItems
              : [],
          originalTotal: data.originalTotal ?? data.totalBeforeDiscount ?? 0,
          discountCode: data.discountCode ?? "",
          discount: data.discount ?? 0,
          totalCartPrice: data.totalCartPrice ?? data.total ?? 0,
        };
        setProductCart(normalized);
      } catch (err) {
        console.error("Lỗi lấy giỏ hàng:", err?.response?.status, err?.response?.data || err.message);
        setProductCart(null);
      }
    };
    fetchCartDetails();
  }, []);

  // ------------------------------------------------------------------
  // 2) Lấy danh sách địa chỉ + địa chỉ mặc định
  // ------------------------------------------------------------------
  const loadAddresses = async () => {
    try {
      const [defRes, listRes] = await Promise.all([
        authAxios.get(`${USER_API}/api/Address/default`),
        authAxios.get(`${USER_API}/api/Address/list`),
      ]);
      const def = defRes?.data || null;
      const list = listRes?.data?.addresses || [];
      setAddressList(list);
      setDefaultAddressId(def?.addressId ?? null);
    } catch (e) {
      console.warn("Không lấy được địa chỉ:", e?.response?.data || e.message);
      setAddressList([]);
      setDefaultAddressId(null);
    }
  };
  useEffect(() => { loadAddresses(); }, []);

  // ------------------------------------------------------------------
  // 3) Handlers form
  // ------------------------------------------------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  };
  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
    setQrCodeUrl("");
    setShowQrPopup(false);
  };

  const handleUseDefaultAddress = () => {
    if (!defaultAddressId) return;
    const def = addressList.find(a => a.addressId === defaultAddressId);
    if (!def) return;
    setCustomerInfo(ci => ({
      ...ci,
      fullName: def.fullName || "",
      address: def.address || "",
      phone: def.phone || "",
      email: def.email || ci.email || "",
      note: def.note || ci.note || ""
    }));
    setCurrentAddressId(def.addressId);
  };

  // Lưu địa chỉ MỚI (không set default)
  const handleSaveAddress = async () => {
    if (currentAddressId) return; // đang chọn địa chỉ đã lưu thì không tạo mới
    const { fullName, address, phone, email, note } = customerInfo;
    if (!fullName || !address || !phone) {
      alert("Vui lòng nhập Họ tên, Địa chỉ, Điện thoại trước khi lưu.");
      return;
    }
    try {
      const createRes = await authAxios.post(
        `${USER_API}/api/Address/create`,
        { fullName, phone, address, email, note, isDefault: false },
        { headers: { "Content-Type": "application/json" } }
      );
      const newId = createRes?.data?.addressId;
      if (!newId) { alert("Không nhận được addressId sau khi tạo địa chỉ."); return; }
      setCurrentAddressId(newId);
      await loadAddresses();
      alert("Đã lưu địa chỉ.");
    } catch (e) {
      console.error("Lỗi lưu địa chỉ:", e?.response?.data || e.message);
      alert(e?.response?.data?.message || "Không lưu được địa chỉ. Kiểm tra backend.");
    }
  };

  // Đặt làm địa chỉ mặc định
  const handleSetDefaultAddress = async () => {
    const { fullName, address, phone, email, note } = customerInfo;
    try {
      let id = currentAddressId;
      if (!id) {
        if (!fullName || !address || !phone) {
          alert("Vui lòng nhập Họ tên, Địa chỉ, Điện thoại trước khi đặt mặc định.");
          return;
        }
        const createRes = await authAxios.post(
          `${USER_API}/api/Address/create`,
          { fullName, phone, address, email, note, isDefault: false },
          { headers: { "Content-Type": "application/json" } }
        );
        id = createRes?.data?.addressId;
        if (!id) { alert("Không tạo được địa chỉ mới để đặt mặc định."); return; }
        setCurrentAddressId(id);
      }
      await authAxios.put(`${USER_API}/api/Address/set-default/${id}`);
      await loadAddresses();
      alert("Đã đặt làm địa chỉ mặc định.");
    } catch (e) {
      console.error("Lỗi set default:", e?.response?.data || e.message);
      alert(e?.response?.data?.message || "Không đặt mặc định được. Kiểm tra backend.");
    }
  };

  const handleDeleteAddress = async () => {
    if (!currentAddressId) return;
    if (!window.confirm("Bạn có chắc muốn xoá địa chỉ này?")) return;
    try {
      await authAxios.delete(`${USER_API}/api/Address/delete/${currentAddressId}`);
      setCurrentAddressId(null);
      await loadAddresses();
    } catch (e) {
      console.error("Lỗi xoá địa chỉ:", e?.response?.data || e.message);
      alert(e?.response?.data?.message || "Không xoá được địa chỉ.");
    }
  };

  // ------------------------------------------------------------------
  // 4) Kiểm tra đơn hàng Pending
  // ------------------------------------------------------------------
  const checkPendingOrder = async () => {
    try {
      const res = await authAxios.get(`${ORDER_API}/api/Order/my`);
      const list = Array.isArray(res?.data) ? res.data : (res?.data?.orders || []);
      const pending = list.find(o =>
        String(o?.status).toLowerCase() === "pending" ||
        (o?.paymentStatus && String(o.paymentStatus).toLowerCase().includes("chờ"))
      );
      if (pending) {
        setPendingOrderPopup({
          show: true,
          orderId: pending.orderId ?? pending.id,
          totalCost: pending.totalCost ?? pending.total,
        });
        return false;
      }
      return true;
    } catch (err) {
      console.warn("Không kiểm tra được đơn pending, cho phép tiếp tục:", err);
      return true;
    }
  };

  // Xoá toàn bộ giỏ
  const clearCart = async () => {
    try {
      await authAxios.delete(`${CART_API}/api/Cart/clear`);
    } catch (e) {
      if (e?.response?.status !== 404) {
        console.warn("Xoá giỏ không thành công:", e?.response?.data || e.message);
      }
    } finally {
      window.dispatchEvent(new Event("cart:changed"));
    }
  };

  // ------------------------------------------------------------------
  // 5) Tạo đơn & thanh toán
  // ------------------------------------------------------------------
  const handleCheckout = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Vui lòng đăng nhập!");

    const { fullName, address, phone, email } = customerInfo;
    if (!fullName || !address || !phone) return alert("Vui lòng nhập đầy đủ thông tin đơn hàng!");
    if (!selectedPaymentMethod) return alert("Vui lòng chọn phương thức thanh toán!");
    if (!productCart || !Array.isArray(productCart.items) || productCart.items.length === 0)
      return alert("Giỏ hàng rỗng, vui lòng thêm sản phẩm!");

    const ok = await checkPendingOrder();
    if (!ok) {
      if (!window.confirm("Bạn đang có đơn chờ thanh toán. Vẫn tiếp tục tạo đơn mới?")) return;
      setPendingOrderPopup(null);
    }

    setLoading(true);
    setMessage("");
    try {
      const orderPayload = {
        NameReceive: fullName,
        Phone: phone,
        Address: address,
        Email: email || null,
        AddressId: currentAddressId,
        Note: customerInfo.note,
        PaymentMethod: selectedPaymentMethod,
        PaymentStatus: selectedPaymentMethod === "VietQR" ? "Chờ Thanh Toán" : "Chưa Thanh Toán",
        Status: selectedPaymentMethod === "COD" ? "Chờ xác nhận" : "Pending",
        Discount: productCart?.discount || 0,
        Ship: 20000,
        DiscountCode: productCart?.discountCode || "",
        Items: productCart.items.map((item) => ({
          ProductId: item.productId,
          CategoryName: item.categoryName ?? item.category ?? "",
          Name: item.productName ?? item.name ?? `SP #${item.productId}`,
          ImageProduct: item.productImage ?? item.imageProduct ?? item.imageUrl ?? item.image ?? "",
          Quantity: item.quantity,
          Price: Number(item.price ?? item.unitPrice ?? 0),
          Note: item.note ?? ""
        })),
      };

      // 5.1. Tạo đơn mới
      const orderRes = await authAxios.post(`${ORDER_API}/api/Order/create`, orderPayload, {
        headers: { "Content-Type": "application/json" },
      });
      if (orderRes.status !== 200 && orderRes.status !== 201) {
        alert("Tạo đơn hàng thất bại.");
        return;
      }

      const newOrderId = orderRes.data?.orderId ?? orderRes.data?.id;
      const newOrderTotal = orderRes.data?.totalCost ?? productCart?.totalCartPrice ?? 0;
      setOrderId(newOrderId);
      if (newOrderId) localStorage.setItem("lastOrderId", String(newOrderId));

      if (selectedPaymentMethod !== "VietQR") {
        alert(`Đơn hàng đã được tạo! Mã đơn hàng: ${newOrderId}`);
        await clearCart();
        navigate(ROUTERS.USER.MESSAGE, { state: { orderId: newOrderId } });
        return;
      }

      // 5.2 Tạo QR
      try {
        const qrRes = await authAxios.post(`${PAYMENT_API}/api/Payment/process-payment`, {
          TotalPrice: Math.round(newOrderTotal),
          Note: `Thanh toán đơn hàng #${newOrderId}`,
        });

        if (qrRes.status === 200 || qrRes.status === 201) {
          setMessage("Đã tạo mã QR cho thanh toán!");
          const rawUrl = qrRes.data?.qrCodeUrl || qrRes.data?.qr || "";
          setQrCodeUrl(rawUrl); // giữ URL gốc (có thể là confirm HTML hoặc ảnh)
          setPaymentId(qrRes.data?.paymentId || qrRes.data?.id || "");
          setCountdown(360);
          setShowQrPopup(true);
        } else {
          alert("Tạo đơn thành công nhưng không tạo được mã QR.");
        }
      } catch (e) {
        console.error("Payment error:", e?.response?.status, e?.response?.data || e.message);
        alert(
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Tạo đơn thành công nhưng tạo mã QR thất bại."
        );
      }

    } catch (error) {
      console.error("Lỗi xử lý đơn hàng:", error?.response?.status, error?.response?.data || error.message);
      alert(error?.response?.data?.message || "Đã xảy ra lỗi khi xử lý đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  // Nút Đặt hàng → gọi handleCheckout
  const handleCheckStatus = () => { handleCheckout(); };

  // ------------------------------------------------------------------
  // 6) Countdown QR
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!countdown) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // ------------------------------------------------------------------
  // 7) Polling thanh toán & (tuỳ chọn) sync trạng thái đơn
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!paymentId || !showQrPopup) return;
    const interval = setInterval(async () => {
      try {
        const res = await authAxios.get(`${PAYMENT_API}/api/Payment/check-payment`, { params: { paymentId } });
        if ((res.status === 200 || res.status === 201) && String(res.data?.status).toLowerCase() === "completed") {
          clearInterval(interval);
          // Nếu có API cập nhật đơn, bật dòng dưới:
          // await authAxios.patch(`${ORDER_API}/api/Order/update-status/${orderId}`, null, { params: { status: "Paid" } });
          setShowQrPopup(false);
          await clearCart();
          navigate(ROUTERS.USER.MESSAGE, { state: { orderId } });
          window.scrollTo(0, 0);
        }
      } catch (error) {
        console.error("Lỗi kiểm tra trạng thái thanh toán:", error);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [paymentId, showQrPopup, orderId, navigate]);

  // ------------------------------------------------------------------
  // 8) Tính toán hiển thị nút theo lựa chọn địa chỉ
  // ------------------------------------------------------------------
  const selectedAddress = currentAddressId
    ? addressList.find((a) => a.addressId === currentAddressId)
    : null;
  const isSelectingSaved = !!selectedAddress;
  const selectedIsDefault = !!selectedAddress?.isDefault;

  // Ảnh QR để hiển thị trong <img>
  const qrImageSrc = toQrImageSrc(qrCodeUrl);

  return (
    <>
      <Breadcrumb name="Thanh toán" />
      <div className="container">
        <div className="row">
          {/* Thông tin nhận hàng */}
          <div className="col-lg-6">
            <div className="checkout_input_header">
              <h3>Thông tin nhận hàng</h3>
              <div className="addr_actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={handleUseDefaultAddress}
                  disabled={!defaultAddressId}
                  title={defaultAddressId ? "Đổ địa chỉ mặc định vào form" : "Bạn chưa có địa chỉ mặc định"}
                >
                  
                </button>

                {addressList?.length > 0 && (
                  <select
                    className="addr_select"
                    value={currentAddressId || ""}
                    onChange={(e) => {
                      const id = e.target.value ? Number(e.target.value) : null;
                      setCurrentAddressId(id);
                      const picked = addressList.find(a => String(a.addressId) === e.target.value);
                      if (picked) {
                        setCustomerInfo(ci => ({
                          ...ci,
                          fullName: picked.fullName || "",
                          address: picked.address || "",
                          phone: picked.phone || "",
                          email: picked.email || ci.email || "",
                          note: picked.note || ci.note || ""
                        }));
                      }
                    }}
                  >
                    <option value="">-- Nhập địa chỉ mới --</option>
                    {addressList.map(a => (
                      <option key={a.addressId} value={a.addressId}>
                        {a.isDefault ? "★ " : ""}{a.fullName} — {a.address}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="checkout_input">
              <label>Họ và tên: <span className="required">*</span></label>
              <input type="text" name="fullName" value={customerInfo.fullName} onChange={handleInputChange} />
            </div>

            <div className="checkout_input">
              <label>Địa chỉ: <span className="required">*</span></label>
              <input type="text" name="address" value={customerInfo.address} onChange={handleInputChange} />
            </div>

            <div className="checkout_input_group">
              <div className="checkout_input">
                <label>Điện thoại: <span className="required">*</span></label>
                <input type="tel" name="phone" value={customerInfo.phone} onChange={handleInputChange} />
              </div>
              <div className="checkout_input">
                <label>Email:</label>
                <input type="email" name="email" value={customerInfo.email} onChange={handleInputChange} placeholder="email@domain.com" />
              </div>
            </div>

            <div className="checkout_input">
              <label>Ghi chú:</label>
              <textarea name="note" value={customerInfo.note} onChange={handleInputChange} />
            </div>

            <div className="checkout_input_row">
              <div className="addr_buttons">
                {!selectedIsDefault && (
                  <button type="button" className="btn-primary" onClick={handleSetDefaultAddress}>
                    Đặt làm địa chỉ mặc định
                  </button>
                )}
                {!isSelectingSaved && (
                  <button type="button" className="btn-secondary" onClick={handleSaveAddress}>
                    Lưu địa chỉ
                  </button>
                )}
                {!!currentAddressId && (
                  <button type="button" className="btn-danger" onClick={handleDeleteAddress}>
                    Xoá địa chỉ
                  </button>
                )}
              </div>
            </div>

            {defaultAddressId && (
              <p className="hint">
                Địa chỉ mặc định hiện tại:&nbsp;
                <strong>
                  {(() => {
                    const d = addressList.find(a => a.addressId === defaultAddressId);
                    return d ? `${d.fullName} — ${d.address}` : `#${defaultAddressId}`;
                  })()}
                </strong>
              </p>
            )}
          </div>

          {/* Chi tiết đơn + thanh toán */}
          <div className="col-lg-6">
            <div className="checkout_order">
              <h3>Sản phẩm</h3>
              <ul>
                {(productCart?.items?.length || 0) > 0 ? (
                  productCart.items.map((item, i) => (
                    <li key={i}>
                      <span>{item.productName ?? item.name ?? `SP #${item.productId}`}</span>
                      <b>{formatter(item.price ?? item.unitPrice ?? 0)} ({item.quantity})</b>
                    </li>
                  ))
                ) : (
                  <li><em>Không có sản phẩm trong giỏ hàng.</em></li>
                )}
                <li><h4>Tổng tiền:</h4> <b>{formatter(productCart?.originalTotal ?? 0)}</b></li>
                <li><h4>Mã giảm giá:</h4> <b>{productCart?.discountCode || "Không có"}</b></li>
                <li><h4>Tiết kiệm:</h4> <b>{formatter(productCart?.discount ?? 0)}</b></li>
                <li className="checkout_order_subtotal"><h3>Thành tiền:</h3> <b>{formatter(productCart?.totalCartPrice ?? 0)}</b></li>
              </ul>

              <div className="checkout_payment">
                <h2>Chọn phương thức thanh toán</h2>
                <div className="payment-methods">
                  <div className={`payment-option ${selectedPaymentMethod === "VietQR" ? "selected" : ""}`} onClick={() => handlePaymentMethodChange("VietQR")}>
                    <AiOutlineCreditCard /><span>Thanh toán qua VietQR</span>
                  </div>
                  <div className={`payment-option ${selectedPaymentMethod === "COD" ? "selected" : ""}`} onClick={() => handlePaymentMethodChange("COD")}>
                    <AiOutlineGift /><span>Thanh toán khi nhận hàng</span>
                  </div>
                </div>
                <div className="selected-payment">
                  {selectedPaymentMethod && <p>Phương thức thanh toán đã chọn: <strong>{selectedPaymentMethod}</strong></p>}
                </div>
              </div>

              <button type="button" className="button-submit" onClick={handleCheckStatus} disabled={loading}>
                {loading ? "Đang xử lý..." : "Đặt hàng"}
              </button>
              {message && <p className="info-text">{message}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Popup QR */}
      {showQrPopup && (
        <div className="qr-popup">
          <div className="qr-popup-content">
            <h3>Quét mã QR để thanh toán</h3>

            {!!qrImageSrc && (
              <img src={qrImageSrc} alt="QR Code Thanh Toán" className="qr-image" />
            )}

            {/* Tuỳ chọn: link mở trang confirm trực tiếp để bấm "Xác nhận" */}
            {!!qrCodeUrl && (
              <p style={{ marginTop: 8 }}>
                <a href={qrCodeUrl} target="_blank" rel="noreferrer">
                  Mở trang xác nhận (nếu cần)
                </a>
              </p>
            )}

            <p className="qr-expire">
              <RiErrorWarningLine size={24} color="#FFC107" /> Hết hạn sau: {formatTime(countdown)}
            </p>
            <div className="qr-popup-actions">
              <button className="btn-outline" onClick={() => setShowQrPopup(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Popup đơn hàng pending */}
      {pendingOrderPopup?.show && (
        <div className="order-popup">
          <div className="order-popup-content">
            <h3>Đơn hàng đang chờ thanh toán</h3>
            <p>Bạn có đơn hàng <strong>#{pendingOrderPopup.orderId}</strong> đang chờ thanh toán.</p>
            <p>Thành tiền: <strong>{formatter(pendingOrderPopup.totalCost)}</strong></p>
            <div className="order-popup-actions">
              <button className="btn-outline" onClick={() => setPendingOrderPopup(null)}>Đóng</button>
              <button
                className="btn-primary"
                onClick={() => navigate(`${ROUTERS.USER.ORDERHISTORY}?id=${pendingOrderPopup.orderId}`)}
              >
                Xem đơn hàng
              </button>            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default memo(CheckoutPage);