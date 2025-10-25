import { memo, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import "./style.scss";
import Breadcrumb from "../theme/breadcrumb";
import { ROUTERS } from "utils/router";
import { formatter } from "utils/fomatter";

/* ================== BASE URLs ================== */
const PRODUCT_API = process.env.REACT_APP_PRODUCT_API || `http://${window.location.hostname}:7007`;
const ORDER_API   = process.env.REACT_APP_ORDER_API   || `http://${window.location.hostname}:7101`;
const PAYMENT_API = process.env.REACT_APP_PAYMENT_API || `http://${window.location.hostname}:7103`;

/* ================== AUTH HELPERS ================== */
const normalizeBearer = () => {
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  return raw.startsWith("Bearer ") ? raw : `Bearer ${raw}`;
};
const attachAuth = (config) => {
  config.headers = config.headers ?? {};
  const bearer = normalizeBearer();
  if (bearer) config.headers.Authorization = bearer;
  return config;
};

/* ================== AXIOS INSTANCES ================== */
const apiOrder   = axios.create({ baseURL: ORDER_API,   timeout: 15000 });
const apiPayment = axios.create({ baseURL: PAYMENT_API, timeout: 15000 });
apiOrder.interceptors.request.use(attachAuth);
apiPayment.interceptors.request.use(attachAuth);

/* ================== STATUS & HELPERS ================== */
const ORDER_STATUS = {
  PENDING:    "Chờ xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPING:   "Đang giao",
  SUCCESS:    "Thành công",
  CANCELLED:  "Đã hủy",
};
const FLOW = [ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPING, ORDER_STATUS.SUCCESS];

const normalizeStatus = (raw) => {
  const s = String(raw ?? "").trim().toLowerCase();
  if (/(cancel|đã hủy|da huy)/i.test(s)) return ORDER_STATUS.CANCELLED;
  if (/(ship|đang giao|in_transit)/i.test(s)) return ORDER_STATUS.SHIPPING;
  if (/(process|xử lý|processing|confirmed)/i.test(s)) return ORDER_STATUS.PROCESSING;
  if (/(success|completed|delivered|thành công)/i.test(s)) return ORDER_STATUS.SUCCESS;
  return ORDER_STATUS.PENDING;
};

const imgFrom = (p) =>
  p ? (/^https?:\/\//i.test(p) ? p : `${PRODUCT_API}/images/${String(p).replace(/\\/g, "/").replace(/^\/+/, "")}`) : "/images/placeholder.png";

const toPaidString = (s) => {
  const low = String(s || "").toLowerCase();
  if (["paid", "success", "completed", "đã thanh toán", "da thanh toan"].some(k => low.includes(k))) return "Đã thanh toán";
  if (!s) return "";
  return s;
};

/* ================== PAGE ================== */
const OrderHistoryPage = () => {
  const { orderId: orderIdParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const orderIdQS    = new URLSearchParams(location.search).get("id");
  const orderIdState = location.state?.orderId;
  const orderId      = orderIdParam || orderIdQS || orderIdState;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // QR modal
  const [qrOpen, setQrOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const pollRef = useRef(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setErr("");

    if (!orderId) {
      setErr("Thiếu orderId trên URL. Mở /don-hang/:orderId hoặc /don-hang?id=...");
      setLoading(false);
      return;
    }

    try {
      let res;
      try {
        res = await apiOrder.get(`/api/Order/${orderId}`);
      } catch {
        try {
          res = await apiOrder.get(`/api/Order/detail/${orderId}`);
        } catch {
          res = await apiOrder.get(`/api/Order/get-order`, { params: { orderId } });
        }
      }
      const data = res?.data?.order ?? res?.data ?? null;
      setOrder(data);
    } catch (e) {
      console.error("Fetch detail error:", e?.response?.status, e?.response?.data || e.message);
      setErr("Không lấy được chi tiết đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  /* ===== Derived fields ===== */
  const normStatus = useMemo(() => normalizeStatus(order?.status), [order]);

  const timelineSteps = useMemo(() => ([
    { step: 1, title: ORDER_STATUS.PENDING,    at: order?.createDate || order?.createdDate || order?.createdAt || order?.orderDate },
    { step: 2, title: ORDER_STATUS.PROCESSING, at: order?.confirmedAt || null },
    { step: 3, title: ORDER_STATUS.SHIPPING,   at: order?.shippedAt || null },
    { step: 4, title: ORDER_STATUS.SUCCESS,    at: order?.deliveredAt || order?.completedAt || null },
  ]), [order]);

  const currentIdx = useMemo(
    () => (normStatus === ORDER_STATUS.CANCELLED ? -1 : Math.max(0, FLOW.indexOf(normStatus))),
    [normStatus]
  );

  // thời điểm hủy
  const canceledAt = useMemo(() => {
  const when =
    order?.cancelledAt ||
    order?.canceledAt ||
    order?.cancelAt ||
    order?.cancelDate ||
    (normStatus === ORDER_STATUS.CANCELLED
      ? (order?.statusUpdatedAt || order?.updatedAt || order?.lastModifiedAt)
      : null);
  return when || null;
}, [order, normStatus]);

  // logs chuẩn hóa + sort theo thời gian
  const logs = useMemo(() => {
  const createdAt = order?.createDate || order?.createdDate || order?.createdAt || order?.orderDate || null;
  const updatedAt = order?.statusUpdatedAt || order?.updatedAt || order?.lastModifiedAt || null;

  const arr = [];
  if (createdAt) arr.push({ t: createdAt, m: ORDER_STATUS.PENDING });

  if (normStatus === ORDER_STATUS.CANCELLED) {
    arr.push({ t: canceledAt || updatedAt, m: ORDER_STATUS.CANCELLED });
  } else if (normStatus !== ORDER_STATUS.PENDING) {
    arr.push({ t: updatedAt, m: normStatus });  // PROCESSING / SHIPPING / SUCCESS
  }

  // sort tăng dần theo thời gian; mục nào không có t thì đẩy xuống cuối
  arr.sort((a, b) => {
    if (!a.t && !b.t) return 0;
    if (!a.t) return 1;
    if (!b.t) return -1;
    return new Date(a.t).getTime() - new Date(b.t).getTime();
  });

  return arr;
}, [order, normStatus, canceledAt]);

  const addr = useMemo(() => {
    const a = order?.shippingAddress || order?.address || {};
    return {
      name:  a.fullName || a.name || order?.nameReceive || order?.receiverName || "",
      phone: a.phone || order?.phone || order?.receiverPhone || "",
      line:  a.addressLine || a.line || order?.address || [a.street, a.ward, a.district, a.city].filter(Boolean).join(", "),
      email: a.email || order?.email || ""
    };
  }, [order]);

  // số liệu
  const _n = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;
  const shipFee   = _n(order?.ship ?? order?.shippingFee);
  const discount  = _n(order?.discount);
  const total     = _n(order?.totalCost ?? order?.total);
  const subTotal  = total > 0 ? Math.max(0, total - shipFee + discount) : _n(order?.subTotal ?? order?.totalItems ?? order?.totalBeforeDiscount);
  const payMethod = String(order?.paymentMethod || order?.paymentType || (order?.method || (order?.isCod ? "COD" : "Online"))).toUpperCase();
  const payStatus = toPaidString(order?.paymentStatus || "");

  /* ===== Actions ===== */
  const tryPatch = async (url, body) => { try { return await apiOrder.patch(url, body); } catch { return null; } };
  const tryPost  = async (url, body) => { try { return await apiOrder.post(url, body); } catch { return null; } };

  const handleCancel = async () => {
    if (!order) return;
    if (!window.confirm("Bạn muốn hủy đơn này?")) return;

    const oid = order.orderId || order.id;
    let res =
      await tryPatch(`/api/Order/update-status/${oid}`, { status: "Cancelled" }) ||
      await tryPost (`/api/Order/update-status/${oid}`, { status: "Cancelled" }) ||
      await tryPatch(`/api/Order/${oid}/status`,        { status: "Cancelled" }) ||
      await tryPost (`/api/Order/${oid}/cancel`,        {}) ;

    if (res && (res.status === 200 || res.status === 204)) {
      await fetchDetail();
      alert("Đã hủy đơn hàng.");
    } else {
      alert("Hủy đơn không thành công.");
    }
  };

  // Đã nhận hàng → Success; nếu COD → mark paid
  const handleReceive = async () => {
    if (!order) return;
    const oid = order.orderId || order.id;

    let res =
      await tryPatch(`/api/Order/update-status/${oid}`, { status: "Success" }) ||
      await tryPost (`/api/Order/update-status/${oid}`, { status: "Success" }) ||
      await tryPatch(`/api/Order/${oid}/status`,        { status: "Success" }) ||
      await tryPost (`/api/Order/${oid}/complete`,      {}) ||
      await tryPost (`/api/Order/${oid}/delivered`,     {}) ;

    if (!res || (res.status !== 200 && res.status !== 204)) {
      alert("Cập nhật trạng thái không thành công.");
      return;
    }

    if (payMethod === "COD") {
      const tryPayPatch = async (url, body) => { try { return await apiPayment.patch(url, body); } catch { return null; } };
      const tryPayPost  = async (url, body) => { try { return await apiPayment.post(url, body); } catch { return null; } };

      await (
        await tryPayPost ("/api/Payment/mark-paid",            { orderId: oid }) ||
        await tryPayPatch(`/api/Payment/${oid}/status`,        { status: "Paid" }) ||
        await tryPayPost ("/api/Order/update-payment-status",  { orderId: oid, status: "Paid" }) ||
        await tryPayPost ("/api/Payment/complete",             { orderId: oid })
      );
    }

    await fetchDetail();
    alert("Đã xác nhận đã nhận hàng.");
  };

  // QR & polling
  const clearPoll = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  const openQrAndPoll = (qrLink, paymentId) => {
    setQrUrl(qrLink);
    setQrOpen(true);
    clearPoll();
    pollRef.current = setInterval(async () => {
      try {
        const r = await apiPayment.get("/api/Payment/check-payment-by-user");
        const status = String(r?.data?.status || r?.data?.transactionStatus || "").toLowerCase();
        if (status === "completed" || status === "paid" || status === "success") {
          clearPoll();
          setQrOpen(false);
          alert("Thanh toán thành công!");
          await fetchDetail();
        }
      } catch {}
    }, 3000);
  };
  const handlePay = async () => {
    try {
      const resp = await apiPayment.post(`/api/Payment/process-payment`, {
        TotalPrice: Math.round(total || 0),
        Note: `Thanh toán đơn hàng #${order?.orderId || order?.id}`,
      });
      const url = resp?.data?.qrCodeUrl || resp?.data?.payUrl || resp?.data?.qr || "";
      const paymentId = resp?.data?.paymentId;
      if (url) openQrAndPoll(url, paymentId);
      else alert("Không tạo được thanh toán.");
    } catch (e) {
      console.error(e?.response?.data || e.message);
      alert("Thanh toán lỗi.");
    }
  };
  useEffect(() => () => clearPoll(), []);

  /* ================== UI ================== */
  if (loading) {
    return (
      <>
        <Breadcrumb name="Chi tiết đơn hàng" />
        <div className="order-detail container full"><p>Đang tải...</p></div>
      </>
    );
  }
  if (err || !order) {
    return (
      <>
        <Breadcrumb name="Chi tiết đơn hàng" />
        <div className="order-detail container full">
          <p className="error">{err || "Không tìm thấy đơn hàng."}</p>
          <button className="btn-outline" onClick={() => navigate(ROUTERS.USER.MY_ORDERS)}>Về danh sách đơn</button>
        </div>
      </>
    );
  }

  const showPayBtn     = payMethod !== "COD" && !["đã thanh toán","paid"].includes(String(payStatus).toLowerCase()) && normStatus !== ORDER_STATUS.CANCELLED;
  const showCancelBtn  = normStatus === ORDER_STATUS.PENDING;
  const showReceiveBtn = normStatus === ORDER_STATUS.SHIPPING;
  const showTimeline   = normStatus !== ORDER_STATUS.CANCELLED;
  const displayPayStt  = payStatus;

  return (
    <>
      <Breadcrumb name="Chi tiết đơn hàng" />
      <div className="order-detail container full">
  {/* Header */}
  <div className="od-header">
    <h2>Mã đơn hàng: <span>#{order.orderId || order.id}</span></h2>

    {normStatus === ORDER_STATUS.CANCELLED && (
      <div className="od-head-badges">
        <span className="cancel-badge" role="status" aria-label="Đơn đã hủy">
          Đã hủy
        </span>
        {canceledAt ? (
          <span className="cancel-time">{new Date(canceledAt).toLocaleString()}</span>
        ) : null}
      </div>
    )}
  </div>

  {/* Timeline: ẩn nếu đã hủy */}
  {normStatus !== ORDER_STATUS.CANCELLED && (
    <div className="od-steps">
      {timelineSteps.map((t, i) => {
        const active = i <= currentIdx;
        return (
          <div key={t.step} className={`step ${active ? "active" : ""}`}>
            <div className="dot">{t.step}</div>
            <div className="label">{t.title}</div>
            <div className="time">{t.at ? new Date(t.at).toLocaleString() : ""}</div>
            {i < timelineSteps.length - 1 && <div className="bar" />}
          </div>
        );
      })}
    </div>
  )}


        {/* Address + Log */}
        <div className="od-grid">
          <div className="card">
            <h3>ĐỊA CHỈ GIAO HÀNG</h3>
            <p className="addr-name">{addr.name || "-"}</p>
            <p>{addr.phone || "-"}</p>
            <p>{addr.email || ""}</p>
            <p>{addr.line || "-"}</p>
          </div>

          
        </div>

        {/* Items + totals */}
        <div className="card items-card">
          <h3>THÔNG TIN ĐƠN HÀNG</h3>

          <div className="items-table-wrap">
            <table className="items-table">
              <thead>
                <tr>
                  <th className="col-product">Tên sản phẩm</th>
                  <th className="col-price">Giá</th>
                  <th className="col-qty">Số lượng</th>
                  <th className="col-total">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {(order?.items ?? []).map((it, i) => {
                  const name  = it.name || it.productName || `SP#${it.productId}`;
                  const img   = imgFrom(it.imageProduct || it.image || it.imageUrl);
                  const price = _n(it.price ?? it.unitPrice);
                  const qty   = _n(it.soLuong ?? it.quantity) || 1;
                  const line  = _n(it.totalCost ?? it.total ?? (price * qty));

                  return (
                    <tr key={i}>
                      <td className="col-product">
                        <div className="pi">
                          <img src={img} alt={name} />
                          <div className="meta">
                            <div className="name">{name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="col-price">{formatter(price)}</td>
                      <td className="col-qty">x{qty}</td>
                      <td className="col-total">{formatter(line)}</td>
                    </tr>
                  );
                })}
                {(!order?.items || order.items.length === 0) && (
                  <tr><td colSpan={4} style={{textAlign:"center", padding:"16px"}}>Không có sản phẩm.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tổng tiền */}
          <div className="totals">
            <div><span>Tổng tiền hàng:</span><b>{formatter(subTotal)}</b></div>
            <div><span>Phí vận chuyển:</span><b>{formatter(shipFee)}</b></div>
            {discount ? <div><span>Giảm giá:</span><b>- {formatter(discount)}</b></div> : null}
            <div className="grand"><span>Thành tiền:</span><b>{formatter(total)}</b></div>
            <div><span>Phương thức thanh toán:</span><b>{String(payMethod || "").toUpperCase()}</b></div>
            {displayPayStt ? <div><span>Trạng thái thanh toán:</span><b>{displayPayStt}</b></div> : null}
          </div>
        </div>

        {/* Actions */}
        <div className="od-actions">
          {showPayBtn     && <button className="btn-primary" onClick={handlePay}>Thanh toán</button>}
          {showCancelBtn  && <button className="btn-outline" onClick={handleCancel}>Hủy đơn</button>}
          {showReceiveBtn && <button className="btn-success" onClick={handleReceive}>Đã nhận hàng</button>}
        </div>

        {/* QR MODAL */}
        {qrOpen && (
          <div className="qr-overlay" onClick={() => { setQrOpen(false); clearPoll(); }}>
            <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Quét mã để thanh toán</h3>
              <img src={qrUrl} alt="QR" />
              <p className="qr-note">Hệ thống sẽ tự cập nhật sau khi thanh toán thành công.</p>
              <button className="btn-outline" onClick={() => { setQrOpen(false); clearPoll(); }}>Đóng</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default memo(OrderHistoryPage);
