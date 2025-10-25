// src/pages/Admin/OrderDetail/index.jsx
import React, { memo, useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./orderdetail.scss";
import { ROUTERS } from "utils/router";
import { useNavigate, useParams } from "react-router-dom";
import { IoChevronBackCircleSharp } from "react-icons/io5";
import { AiOutlineEdit } from "react-icons/ai";
import { formatter } from "utils/fomatter";

/* ===== BASE URLs ===== */
const ORDER_API =
  process.env.REACT_APP_ORDER_API ||
  `${window.location.protocol}//${window.location.hostname}:7101`;

const PRODUCT_API =
  process.env.REACT_APP_PRODUCT_API ||
  `${window.location.protocol}//${window.location.hostname}:7007`;

/* ===== AUTH AXIOS ===== */
const normalizeBearer = () => {
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  return raw.startsWith("Bearer ") ? raw : `Bearer ${raw}`;
};
const authAxios = axios.create();
authAxios.interceptors.request.use((config) => {
  const b = normalizeBearer();
  if (b) config.headers = { ...(config.headers || {}), Authorization: b };
  return config;
});

/* ===== IMAGE HELPER (giống trang OrderHistory) ===== */
const getImageUrl = (p) =>
  p
    ? /^https?:\/\//i.test(p)
      ? p
      : `${PRODUCT_API}/images/${String(p)
          .replace(/\\/g, "/")                 // \ -> /
          .replace(/^~?\/*images\/*/i, "")     // bỏ prefix images/
          .replace(/^\/+/, "")}`               // bỏ / đầu
    : "/images/placeholder.png";

/* ===== STATUS HELPER ===== */
const getStatusClass = (status) => {
  const s = (status || "").toLowerCase();
  if (s.includes("chờ") || s.includes("pending")) return "status-pending";
  if (s.includes("đang giao") || s.includes("shipping")) return "status-shipping";
  if (s.includes("hoàn thành") || s.includes("completed")) return "status-completed";
  if (s.includes("hủy") || s.includes("cancel")) return "status-canceled";
  return "";
};

const OrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ---- Fetch detail ---- */
  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authAxios.get(`${ORDER_API}/api/Order/detail/${orderId}`);
      const data = res?.data || {};
      setOrder(data);
      setItems(Array.isArray(data.items) ? data.items : []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Không thể tải chi tiết đơn hàng!");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  /* ---- Update status (điều chỉnh URL nếu BE khác) ---- */
  const updateStatus = useCallback(
    async (newStatus) => {
      const url = `${ORDER_API}/api/Order/update-status/${orderId}`;
      try {
        await authAxios.patch(url, { status: newStatus });
        setOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
        alert(`Đã cập nhật trạng thái: ${newStatus}`);
      } catch (err) {
        console.error(err);
        alert("Cập nhật trạng thái thất bại!");
      }
    },
    [orderId]
  );

  const handleConfirm = () => updateStatus("Đang giao");
  const handleCancel  = () => {
    if (window.confirm("Bạn chắc chắn muốn hủy đơn này?")) updateStatus("Đã hủy");
  };
  const handlePrint   = () => window.print();

  const createdAt =
    order?.createdDate || order?.createDate || order?.orderDate || null;

  // receiver info (fallback items[0])
  const first = items[0] || {};
  const receiver = {
    name: order?.nameReceive ?? first.nameReceive ?? "—",
    phone: order?.phone ?? first.phone ?? "—",
    email: order?.email ?? first.email ?? "—",
    address: order?.address ?? first.address ?? "—",
    note: order?.note ?? first.note ?? "—",
  };

  // totals: BE đang trả totalCost + ship -> tổng thanh toán = totalCost + ship
  const totals = {
    discountCode: order?.discountCode ?? null,
    discount: Number(order?.discount ?? 0),
    ship: Number(order?.ship ?? 0),
    subTotal: Number(order?.totalCost ?? 0),
  };
  const grandTotal = totals.subTotal + totals.ship;

  const canConfirm = (order?.status || "").toLowerCase().includes("chờ");
  const canPrint   = (order?.status || "").toLowerCase().includes("đang giao");

  return (
    <div className="order-detail-container">
      <div className="order-header">
        <button
          type="button"
          className="orders_header_button-create"
          onClick={() => navigate(ROUTERS.ADMIN.ORDERS)}
          title="Quay lại"
        >
          <IoChevronBackCircleSharp />
        </button>
        <button
          type="button"
          className="orders_header_button-create"
          onClick={() => navigate(`${ROUTERS.ADMIN.EDITORDERS}/${orderId}`)}
          title="Chỉnh sửa"
        >
          <AiOutlineEdit />
        </button>

        {/* Hành động trạng thái */}
        <div className="order-actions">
          {canConfirm && (
            <>
              <button className="btn btn-confirm" onClick={handleConfirm}>
                Xác nhận
              </button>
              <button className="btn btn-cancel" onClick={handleCancel}>
                Hủy
              </button>
            </>
          )}
          {canPrint && (
            <button className="btn btn-print no-print" onClick={handlePrint}>
              In đơn
            </button>
          )}
        </div>
      </div>

      {loading && <p>Đang tải dữ liệu...</p>}
      {error && <p className="error-message">{error}</p>}

      {order && (
        <>
          <div className="order-title">
            <h2>Chi tiết đơn hàng</h2>
          </div>

          <div className="row">
            {/* Khách hàng */}
            <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12">
              <div className="section">
                <h3>Thông tin khách hàng</h3>
                <p><b>Tên:</b> {receiver.name}</p>
                <p><b>Phone:</b> {receiver.phone}</p>
                <p><b>Email:</b> {receiver.email}</p>
                <p><b>Address:</b> {receiver.address}</p>
              </div>
            </div>

            {/* Đơn hàng */}
            <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12">
              <div className="order_details">
                <h3>Thông tin đơn hàng</h3>
                <ul>
                  <li>
                    <span>Mã đơn hàng:</span>
                    <b style={{ color: "#3b82f6" }}>#{order.orderId}</b>
                  </li>
                  <li>
                    <span>Ngày tạo:</span>
                    <b>{createdAt ? new Date(createdAt).toLocaleDateString() : "—"}</b>
                  </li>
                  <li>
                    <span>Trạng thái đơn hàng:</span>
                    <b className={`status-badge ${getStatusClass(order.status)}`}>
                      {order.status || "—"}
                    </b>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bảng sản phẩm */}
          <div className="order_details">
            <h3>Sản phẩm đã mua</h3>
            <div className="table-wrap">
              <table className="order-items-table">
                <thead>
                  <tr>
                    <th>Ảnh</th>
                    <th>Mã SP</th>
                    <th>Tên SP</th>
                    <th>Đơn giá</th>
                    <th>SL</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length ? items.map((it) => {
                    const pid   = it.productId ?? it.sku ?? "-";
                    const name  = it.name ?? it.productName ?? `SP #${pid}`;
                    const img   = getImageUrl(it.imageProduct || it.image || it.imageUrl);
                    const price = Number(it.price ?? it.unitPrice ?? 0);
                    const qty   = Number(it.soLuong ?? it.quantity ?? 1);
                    const line  = Number(it.totalCost ?? it.total ?? price * qty);

                    return (
                      <tr key={it.orderItemId ?? `${pid}-${Math.random()}`}>
                        <td className="img-cell">
                          {img ? <img src={img} alt={name} /> : <span className="no-img">—</span>}
                        </td>
                        <td>{pid}</td>
                        <td>{name}</td>
                        <td>{formatter(price)}</td>
                        <td>{qty}</td>
                        <td>{formatter(line)}</td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={6} className="empty">Không có dòng hàng</td></tr>
                  )}
                </tbody>
                <tfoot>                  
                  <tr>
                    <td colSpan={4}></td>
                    <td className="label">Giảm giá:</td>
                    <td className="value">{formatter(totals.discount)}</td>
                  </tr>
                  <tr className="bold">
                    <td colSpan={4}></td>
                    <td className="label">Phí Ship:</td>
                    <td className="value">{formatter(totals.ship)}</td>
                  </tr>
                  <tr className="bold">
                    <td colSpan={4}></td>
                    <td className="label">Tổng tiền:</td>
                    <td className="value" style={{ color: '#dc2626', fontWeight: 800 }}>{formatter(totals.subTotal)}</td>
                  </tr>
                  <tr className="bold">
                    <td colSpan={4}></td>
                    <td className="label">Phương thức thanh toán:</td>
                    <td className="value">{order.paymentMethod || items[0]?.paymentMethod || "—"}</td>
                  </tr>
                  <tr className="bold">
                    <td colSpan={4}></td>
                    <td className="label">Trạng thái thanh toán:</td>
                    <td className="value">{order.paymentStatus || items[0]?.paymentStatus || "—"}</td>
                  </tr>
                  <tr>
                    <td colSpan={4}></td>
                    <td className="label">Ghi chú (Nếu có):</td>
                    <td className="value">{receiver.note || "—"}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          
        </>
      )}
    </div>
  );
};

export default memo(OrderDetail);
