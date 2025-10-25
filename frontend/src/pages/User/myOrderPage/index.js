import { memo, useEffect, useState, useCallback } from "react";
import "./style.scss";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../theme/breadcrumb";

import call1ing from "assets/User/images/about/account.jpg";
import axios from "axios";
import { formatter } from "utils/fomatter";

const PRODUCT_API = process.env.REACT_APP_PRODUCT_API || `http://${window.location.hostname}:7007`;
const USER_API    = process.env.REACT_APP_USER_API    || `http://${window.location.hostname}:7200`;
const ORDER_API   = process.env.REACT_APP_ORDER_API   || `http://${window.location.hostname}:7101`;

/* ================== Axios (Bearer + x-user-id) ================== */
const normalizeBearer = () => {
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  return raw.startsWith("Bearer ") ? raw : `Bearer ${raw}`;
};
const getUserHeaders = () => {
  const uid = localStorage.getItem("userId");
  return uid ? { "x-user-id": uid } : {};
};
const attachAuth = (config) => {
  const bearer = normalizeBearer();
  if (bearer) config.headers.Authorization = bearer;
  config.headers = { ...config.headers, ...getUserHeaders() };
  return config;
};
const apiUser  = axios.create({ baseURL: USER_API,  timeout: 15000 });
const apiOrder = axios.create({ baseURL: ORDER_API, timeout: 15000 });
apiUser.interceptors.request.use(attachAuth);
apiOrder.interceptors.request.use(attachAuth);

/* ================== Helpers ================== */
const toImageUrl = (img) => {
  if (!img) return "/images/placeholder.png";
  if (/^https?:\/\//i.test(img)) return img;
  const clean = String(img).replace(/\\/g, "/").replace(/^\/+/, "");
  return `${PRODUCT_API}/images/${clean}`;
};

// bỏ dấu + toLower
const noAccentLower = (s) =>
  (s || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

// Badge trạng thái + rule ẩn payment
const getStatusView = (rawStatus) => {
  const s = noAccentLower(rawStatus);

  // Đã hủy → đỏ & ẩn payment
  if (/(huy|cancel|cancelled|canceled)/i.test(s)) {
    return { className: "status-badge status--red", hidePayment: true };
  }
  // Đang giao → xanh & ẩn payment
  if (/(ship|shipping|giao|delivering|on the way|in transit)/i.test(s)) {
    return { className: "status-badge status--green", hidePayment: true };
  }
  // ✅ Thành công → cũng xanh & ẩn payment (giống Đang giao)
  if (/(success|thanh cong|delivered|completed)/i.test(s)) {
    return { className: "status-badge status--green", hidePayment: true };
  }
  // Chờ xác nhận → vàng & ẩn payment
  if (/(cho xac nhan|cho duyet|pending|awaiting|awaiting confirmation|waiting confirm)/i.test(s)) {
    return { className: "status-badge status--yellow", hidePayment: true };
  }
  // Mặc định
  return { className: "status-badge", hidePayment: true };
};

// Chuẩn hoá payment “đã thanh toán”
const parsePayment = (raw) => {
  const s = noAccentLower(raw);
  const paid = /(paid|success|completed|da thanh toan|đã thanh toán)/i.test(s);
  return { label: raw || "", paid };
};

const MyOrderPage = () => {
  // sidebar user
  const [userInfo, setUserInfo] = useState({ username: "", email: "", phone: "" });
  const navigate = useNavigate();

  // list orders
  const [orders, setOrders] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  // previews: orderId -> { firstItem, itemCount }
  const [previews, setPreviews] = useState({});

  // detail expand
  const [details, setDetails] = useState({});
  const [expanded, setExpanded] = useState(new Set());

  /* ===== user info ===== */
  const getUserInfo = useCallback(async (signal) => {
    try {
      const res = await apiUser.get(`/api/Auth/me`, { signal });
      setUserInfo({
        username: res.data?.username ?? "",
        email: res.data?.email ?? "",
        phone: res.data?.phone ?? ""
      });
    } catch (e) { if (!axios.isCancel(e)) console.error(e); }
  }, []);

  /* ===== orders ===== */
  const getOrders = useCallback(async (signal) => {
    try {
      setLoadingList(true);
      setListError("");
      const res = await apiOrder.get(`/api/Order/my`, { signal });
      const data = Array.isArray(res.data) ? res.data : [];
      const sorted = [...data].sort((a, b) => {
        const da = new Date(a.createdDate || a.CreatedDate || 0).getTime();
        const db = new Date(b.createdDate || b.CreatedDate || 0).getTime();
        return db - da;
      });
      setOrders(sorted);

      // preview items
      const tasks = sorted.map(async (o) => {
        const id = o.orderId ?? o.OrderId;
        try {
          const r = await apiOrder.get(`/api/Order/detail/${id}`, { signal });
          const od = r.data || {};
          const items = Array.isArray(od.items) ? od.items : [];
          const it0 = items[0] || null;

          const firstItem = it0 ? {
            img: toImageUrl(it0.imageProduct ?? it0.productImage ?? it0.image ?? it0.imageUrl),
            name: it0.name ?? it0.productName ?? "(Không rõ tên)",
            qty: it0.quantity ?? it0.soLuong ?? 0,
            price: it0.price ?? it0.unitPrice ?? 0,
            total: (it0.totalCost ?? ((it0.price ?? 0) * (it0.quantity ?? 0)))
          } : null;

          return { id, preview: { firstItem, itemCount: items.length } };
        } catch {
          return { id, preview: { firstItem: null, itemCount: 0 } };
        }
      });

      const results = await Promise.all(tasks);
      setPreviews(results.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.preview }), {}));
    } catch (e) {
      if (!axios.isCancel(e)) {
        console.error("Lỗi lấy danh sách đơn:", e?.response?.data || e.message);
        setListError("Không thể tải danh sách đơn hàng.");
      }
    } finally {
      setLoadingList(false);
    }
  }, []);

  const fetchDetail = useCallback(async (orderId) => {
    try {
      const res = await apiOrder.get(`/api/Order/detail/${orderId}`);
      const o = res.data || {};
      const items = Array.isArray(o.items) ? o.items : [];
      const normalizedItems = items.map((it, idx) => ({
        key: `${it.productId ?? it.orderItemId ?? idx}-${idx}`,
        name: it.name ?? it.productName ?? "(Không rõ tên)",
        qty: it.quantity ?? it.soLuong ?? 0,
        price: it.price ?? it.unitPrice ?? 0,
        total: (it.totalCost ?? ((it.price ?? 0) * (it.quantity ?? 0))),
        img: toImageUrl(it.imageProduct ?? it.productImage ?? it.image ?? it.imageUrl)
      }));

      setDetails(prev => ({
        ...prev,
        [o.orderId]: {
          orderId: o.orderId,
          items: normalizedItems
        }
      }));
    } catch (e) { console.error(e?.response?.data || e.message); }
  }, []);

  const toggleExpand = (orderId) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([getUserInfo(controller.signal), getOrders(controller.signal)]);
    return () => controller.abort();
  }, [getUserInfo, getOrders]);

  return (
    <>
      <Breadcrumb name="Lịch sử đơn hàng" />
      <div className="container">
        <div className="row">
          {/* Sidebar */}
          <div className="col-lg-3 col-md-12 col-sm-12 col-xs-12">
            <div className="myaccount">
              <div className="myaccount_about">
                <img src={call1ing} alt="Account" className="myaccount_about_img" />
                <h3 className="myaccount_abount_title">{userInfo.username || "Người dùng"}</h3>
              </div>
              <div className="myaccount_phone">Số điện thoại: {userInfo.phone || "Không có số điện thoại"}</div>
              <div className="myaccount_email">Email: {userInfo.email || "Không có email"}</div>
            </div>
          </div>

          {/* Danh sách đơn */}
          <div className="col-lg-9 col-md-12 col-sm-12 col-xs-12">
            {loadingList && <p>Đang tải…</p>}
            {!loadingList && listError && <p style={{ color: "red" }}>{listError}</p>}
            {!loadingList && !listError && orders.length === 0 && <p>Chưa có đơn hàng nào.</p>}

            {!loadingList && !listError && orders.map((o) => {
              const id = o.orderId ?? o.OrderId;
              const created = new Date(o.createdDate || o.CreatedDate).toLocaleString();
              const total = o.totalCost ?? o.TotalCost ?? 0;
              const rawStatus = o.status ?? o.Status ?? "";
              const rawPayment = o.paymentStatus ?? o.PaymentStatus ?? "";

              const { className, hidePayment } = getStatusView(rawStatus);
              const { label: paymentLabel, paid: isPaid } = parsePayment(rawPayment);

              const pv = previews[id];
              const first = pv?.firstItem || null;
              const count = pv?.itemCount ?? 0;

              const dt = details[id];
              const expandedOne = expanded.has(id);

              return (
                <div className="order" key={id} style={{ marginBottom: 16 }}>
                  {/* Header */}
                  <div className="order_total" style={{ display: "flex", justifyContent: "space-between" }}>
                    <div><strong>Đơn #{id}</strong> • {created}</div>
                    <div className="order-statuses">
                      <span className={className} style={{ marginRight: 8 }}>
                        {rawStatus || "—"}
                      </span>

                      {!hidePayment && !!paymentLabel && (
                        <span className={`payment-badge ${isPaid ? "payment--paid" : "payment--unpaid"}`}>
                          {paymentLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* PREVIEW */}
                  <div className="order-items">
                    {first ? (
                      <div className="order-item">
                        <img src={first.img} alt={first.name} className="order-item_img" />
                        <div className="order-item_details">
                          <h3>{first.name}</h3>
                          <p>x{first.qty}</p>
                          <p>Đơn giá: {formatter(first.price)}</p>
                          <p>Thành tiền: {formatter(first.total)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="order_discount">Đang tải sản phẩm…</div>
                    )}

                    {count > 1 && (
                      <div
                        className="order_discount"
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() => {
                          toggleExpand(id);
                          if (!dt) fetchDetail(id);
                        }}
                      >
                        {expandedOne ? "Ẩn bớt ▲" : `Xem thêm (${count - 1}) ▼`}
                      </div>
                    )}

                    {expandedOne && dt?.items?.slice(1).map((it) => (
                      <div className="order-item" key={it.key}>
                        <img src={it.img} alt={it.name} className="order-item_img" />
                        <div className="order-item_details">
                          <h3>{it.name}</h3>
                          <p>x{it.qty}</p>
                          <p>Đơn giá: {formatter(it.price)}</p>
                          <p>Thành tiền: {formatter(it.total)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tổng tiền */}
                  <div className="order_total">
                    Tổng số tiền ({count > 0 ? `${count} sản phẩm` : "—"}): <span>{formatter(total)}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button
                      className="btn btn--primary"
                      onClick={() => navigate(`/don-hang?id=${id}`)}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(MyOrderPage);
