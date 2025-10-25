// src/pages/Admin/OrderPage/index.jsx
import { memo, useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./style.scss";
import { formatter } from "utils/fomatter";
import { TbDetails } from "react-icons/tb";
import { IoCheckmarkCircleOutline, IoCloseCircleOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { ROUTERS } from "utils/router";

/* ===== BASE URL (ưu tiên .env, khớp protocol) ===== */
const ORDER_API = process.env.REACT_APP_ORDER_API || `http://${window.location.hostname}:7101`;

const API_ALL_ORDERS = `${ORDER_API}/api/Order/all`;
const API_UPDATE_STATUS = (id, status) =>
  `${ORDER_API}/api/Order/update-status/${id}?status=${encodeURIComponent(status)}`;

/* ===== Auth helper (JWT) ===== */
const normalizeBearer = () => {
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  return raw.startsWith("Bearer ") ? raw : `Bearer ${raw}`;
};
const authAxios = axios.create();
authAxios.interceptors.request.use((config) => {
  const bearer = normalizeBearer();
  if (bearer) config.headers = { ...(config.headers || {}), Authorization: bearer };
  return config;
});

/* ===== UI helpers ===== */
const normStatus = (status = "") => {
  const s = status.toLowerCase();
  if (s.includes("chờ")) return "pending";
  if (s.includes("đang giao") || s.includes("shipping")) return "shipping";
  if (s.includes("hủy") || s.includes("cancel")) return "canceled";
  if (s.includes("hoàn thành") || s.includes("completed")) return "completed";
  return "other";
};
const statusClass = (status) => {
  switch (normStatus(status)) {
    case "pending": return "status-pending";
    case "shipping": return "status-shipping";
    case "canceled": return "status-canceled";
    case "completed": return "status-completed";
    default: return "";
  }
};

const OrderPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [checkedAll, setCheckedAll] = useState(false);
  const [checkedItems, setCheckedItems] = useState([]); // orderId[]

  const fetchOrders = useCallback(async () => {
    try {
      const res = await authAxios.get(API_ALL_ORDERS);
      setOrders(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      console.error("Không thể tải danh sách đơn hàng", err);
      setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ---- Cập nhật trạng thái
  const updateStatus = useCallback(async (orderId, nextStatus, toastMsg) => {
    try {
      await authAxios.post(API_UPDATE_STATUS(orderId, nextStatus)); // dùng POST
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, status: nextStatus } : o))
      );
      alert(toastMsg || "Cập nhật trạng thái thành công!");
    } catch (err) {
      console.error(err);
      alert("Cập nhật trạng thái thất bại!");
    }
  }, []);

  const handleConfirm = useCallback((order) => {
    if (normStatus(order.status) !== "pending") return;
    updateStatus(order.orderId, "Đang giao", "Đã xác nhận đơn và chuyển sang 'Đang giao'.");
  }, [updateStatus]);

  const handleCancel = useCallback((order) => {
    const kind = normStatus(order.status);
    // Chỉ cho hủy khi: pending hoặc shipping
    if (!(kind === "pending" || kind === "shipping")) {
      alert("Trạng thái hiện tại không thể hủy.");
      return;
    }
    if (!window.confirm(`Hủy đơn #${order.orderId}?`)) return;
    updateStatus(order.orderId, "Đã hủy", "Đã hủy đơn hàng.");
  }, [updateStatus]);

  // ---- Chọn checkbox
  const handleSelectAll = useCallback((e) => {
    const checked = e.target.checked;
    setCheckedAll(checked);
    setCheckedItems(checked ? orders.map((o) => o.orderId) : []);
  }, [orders]);

  const handleSelectItem = useCallback((id) => {
    setCheckedItems((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, []);

  useEffect(() => {
    setCheckedAll(orders.length > 0 && checkedItems.length === orders.length);
  }, [checkedItems, orders]);

  return (
    <div className="container">
      <div className="orders">
        <h2>Quản lý đơn hàng</h2>

        {loading && <p>Đang tải dữ liệu...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && (
          <div className="orders_content">
            {orders.length === 0 ? (
              <p>Không có đơn hàng nào!</p>
            ) : (
              <table className="orders_table">
                <thead>
                  <tr>
                    <th>Mã đơn hàng</th>
                    <th>Người đặt hàng</th>
                    <th>Tổng tiền</th>
                    <th>Ngày đặt hàng</th>
                    <th>Giảm giá</th>
                    <th>Phí ship</th>
                    <th>Trạng thái</th>
                    <th>Thanh toán</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((item) => {
                    const id = item.orderId;
                    const kind = normStatus(item.status);
                    const showDetail  = true;
                    const showConfirm = kind === "pending";
                    const showCancel  = kind === "pending" || kind === "shipping"; // đúng yêu cầu

                    return (
                      <tr key={id}>
                        <td><span className="OrderID">#{id}</span></td>
                        <td>{item.userId ?? "—"}</td>
                        <td>{formatter(item.totalCost || 0)}</td>
                        <td>{item.createdDate ? new Date(item.createdDate).toLocaleDateString() : "—"}</td>
                        <td>{formatter(item.discount || 0)}</td>
                        <td>{formatter(item.ship || 0)}</td>
                        <td className={`status-badge ${statusClass(item.status)}`}>{item.status || "—"}</td>
                        <td>
                          {item.paymentStatus || "—"}
                          {item.paymentMethod ? ` (${item.paymentMethod})` : ""}
                        </td>
                        <td>
                          <div className="orders_button">
                            {showDetail && (
                              <button
                                type="button"
                                className="orders_button-btn"
                                onClick={() => navigate(`${ROUTERS.ADMIN.DETAILORDERS}/${id}`)}
                                title="Chi tiết"
                              >
                                <TbDetails />
                              </button>
                            )}

                            {showConfirm && (
                              <button
                                type="button"
                                className="orders_button-btn"
                                onClick={() => handleConfirm(item)}
                                title="Xác nhận đơn"
                              >
                                <IoCheckmarkCircleOutline />
                              </button>
                            )}

                            {showCancel && (
                              <button
                                type="button"
                                className="orders_button-btn"
                                onClick={() => handleCancel(item)}
                                title="Hủy đơn"
                              >
                                <IoCloseCircleOutline />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Phân trang placeholder */}
        <div className="orders_footer">
          <div className="orders_pagination">
            <div className="orders_page-number">
              <button type="button" className="orders_page-btn">→</button>
              <button type="button" className="orders_page-btn orders_page-btn--active">1</button>
              <button type="button" className="orders_page-btn">2</button>
              <button type="button" className="orders_page-btn">3</button>
              <button type="button" className="orders_page-btn">...</button>
              <button type="button" className="orders_page-btn">←</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(OrderPage);
