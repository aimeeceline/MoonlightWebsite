import { memo, useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as echarts from "echarts";
import axios from "axios";
import "./style.scss";
import { formatter } from "utils/fomatter";

/* ================== BASE URLs (đổi nếu cần) ================== */
const ORDER_API   = process.env.REACT_APP_ORDER_API   || `http://${window.location.hostname}:7101`;
const PRODUCT_API = process.env.REACT_APP_PRODUCT_API || `http://${window.location.hostname}:7007`;
const USER_API    = process.env.REACT_APP_USER_API    || `http://${window.location.hostname}:7200`;

/* ================== AUTH HELPERS (tự gắn Bearer + x-user-id) ================== */
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

const apiOrder   = axios.create({ baseURL: ORDER_API,   timeout: 15000 });
const apiProduct = axios.create({ baseURL: PRODUCT_API, timeout: 15000 });
const apiUser    = axios.create({ baseURL: USER_API,    timeout: 15000 });
apiOrder.interceptors.request.use(attachAuth);
apiProduct.interceptors.request.use(attachAuth);
apiUser.interceptors.request.use(attachAuth);

/* ================== Utils ================== */
const thisMonthRange = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth(); // 0..11
  const from = new Date(y, m, 1);
  const to   = new Date(y, m + 1, 0, 23, 59, 59, 999);
  const toISO = (x) => x.toISOString();
  return { from, to, fromISO: toISO(from), toISO: toISO(to) };
};
const inMonth = (dt) => {
  if (!dt) return false;
  const { from, to } = thisMonthRange();
  const t = new Date(dt).getTime();
  return t >= from.getTime() && t <= to.getTime();
};
const isSuccessOrder = (o) => {
  const s1 = String(o.status ?? o.Status ?? "").toLowerCase();
  const s2 = String(o.paymentStatus ?? o.PaymentStatus ?? "").toLowerCase();
  const keywords = ["completed", "success", "successful", "paid", "hoàn thành", "thành công", "đã thanh toán"];
  return keywords.some(k => s1.includes(k) || s2.includes(k));
};

/* Gom OrderItems theo sản phẩm */
const foldItems = (items) => {
  const map = new Map(); // key: productId or name
  items.forEach((it) => {
    const pid = it.productId ?? it.productID ?? it.ProductId ?? it.ProductID;
    const name = it.productName ?? it.name ?? it.Name ?? (pid ? `SP #${pid}` : "SP");
    const key = pid ?? name;
    const qty = Number(it.quantity ?? it.qty ?? it.count ?? it.Quantity ?? 0) || 0;
    if (!map.has(key)) map.set(key, { productId: pid, name, qty: 0 });
    map.get(key).qty += qty;
  });
  return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
};

const DashboardPage = () => {
  /* ======= state ======= */
  const [kpis, setKpis] = useState({
    revenue: 0,            // doanh thu tháng (tổng của order)
    orders: 0,             // số đơn thành công trong tháng
    revenueGrowth: 0,      // để 0 nếu BE chưa cung cấp
  });
  const [topProducts, setTopProducts] = useState([]);   // [{name, qty}]
  const [newCustomers, setNewCustomers] = useState([]); // [{name, email, initials, desc}]

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const chartRef = useRef(null);
  const chartInst = useRef(null);

  /* ====== Fetch & aggregate theo yêu cầu ====== */

  // Lấy tất cả đơn trong tháng hiện tại (ưu tiên endpoint by-range, fallback all + lọc FE)
  const fetchOrdersInMonth = useCallback(async () => {
    const { fromISO, toISO } = thisMonthRange();
    const candidates = [
      { url: `/api/Order/admin/by-range`, params: { from: fromISO, to: toISO } },
      { url: `/api/Order/by-range`,       params: { from: fromISO, to: toISO } },
      { url: `/api/Order/all`,            params: {} },
      { url: `/api/Orders`,               params: {} },
    ];
    for (const c of candidates) {
      try {
        const r = await apiOrder.get(c.url, { params: c.params });
        let list = Array.isArray(r.data) ? r.data : (r.data?.orders ?? r.data?.items ?? []);
        if (!list) continue;
        // nếu gọi all: lọc theo tháng tại FE
        if (!c.params?.from && !c.params?.to) list = list.filter(o => inMonth(o.createdDate ?? o.createDate));
        return list;
      } catch (_) {}
    }
    return [];
  }, []);

  // Lấy OrderItems của tháng: ưu tiên endpoint chuyên dụng, fallback từ đơn
  const fetchOrderItemsInMonth = useCallback(async (ordersInMonth) => {
    const { fromISO, toISO } = thisMonthRange();
    // 1) thử các endpoint items-by-range
    const candidates = [
      { client: apiOrder, url: `/api/Order/admin/items-by-range`, params: { from: fromISO, to: toISO } },
      { client: apiOrder, url: `/api/OrderItem/by-range`, params: { from: fromISO, to: toISO } },
      { client: apiOrder, url: `/api/OrderItem/all`, params: {} },
    ];
    for (const c of candidates) {
      try {
        const r = await c.client.get(c.url, { params: c.params });
        let arr = Array.isArray(r.data) ? r.data : (r.data?.items ?? r.data?.data ?? []);
        if (!arr) continue;
        // nếu lấy all items: cố gắng lọc trong tháng theo orderDate nếu có
        if (!c.params?.from && !c.params?.to) {
          arr = arr.filter(it => inMonth(it.orderDate ?? it.createdDate ?? it.CreateDate));
        }
        if (arr.length) return arr;
      } catch (_) {}
    }

    // 2) fallback: rút items ngay từ danh sách order
    //    BE phổ biến: mỗi order có orderDetails/items
    const items = [];
    for (const o of ordersInMonth) {
      const children = Array.isArray(o.items) ? o.items
                    : Array.isArray(o.orderDetails) ? o.orderDetails
                    : Array.isArray(o.details) ? o.details
                    : null;
      if (children) {
        items.push(...children);
      } else {
        // fallback cuối: gọi detail từng đơn (cẩn thận performance)
        try {
          const r = await apiOrder.get(`/api/Order/detail/${o.orderId ?? o.id ?? o.OrderId ?? o.ID}`);
          const d = r.data?.items ?? r.data?.orderDetails ?? r.data?.details ?? [];
          if (Array.isArray(d)) items.push(...d);
        } catch (_) {}
      }
    }
    return items;
  }, []);

  // Tính KPI + Top products từ đơn & items của tháng
  const buildDashboard = useCallback(async () => {
    const orders = await fetchOrdersInMonth();

    // Doanh thu trong tháng = tổng totalCost mọi đơn trong tháng
    const revenue = orders.reduce((sum, o) => {
      const val = Number(o.totalCost ?? o.TotalCost ?? o.amount ?? 0) || 0;
      return sum + val;
    }, 0);

    // Số đơn thành công trong tháng
    const successCount = orders.reduce((cnt, o) => cnt + (isSuccessOrder(o) ? 1 : 0), 0);

    // Lấy OrderItems và gom TOP
    const orderItems = await fetchOrderItemsInMonth(orders);
    const topFolded = foldItems(orderItems);
    setTopProducts(topFolded.slice(0, 5));

    // New customers: lấy tất cả user, sort theo createDate desc, top 6
    // Ưu tiên các endpoint phổ biến
    const userCandidates = [
      { url: `/api/User/all`, params: {} },
      { url: `/api/User`,     params: {} },
      { url: `/api/Users`,    params: {} },
    ];
    let users = [];
    for (const c of userCandidates) {
      try {
        const r = await apiUser.get(c.url, { params: c.params });
        users = Array.isArray(r.data) ? r.data : (r.data?.users ?? r.data?.items ?? []);
        if (users?.length) break;
      } catch (_) {}
    }
    const mappedUsers = (users || [])
      .map((u, i) => ({
        name: u.fullName || u.name || u.username || `Người dùng #${i + 1}`,
        email: u.email || "",
        initials: ((u.fullName || u.name || u.username || "U").split(" ").map(p => p[0]).join("").slice(0, 2) || "U").toUpperCase(),
        desc: u.note || u.role || "Khách hàng mới",
        createDate: u.createDate || u.createdDate || u.CreatedDate || u.CreateDate || null,
      }))
      .sort((a, b) => {
        const ta = a.createDate ? new Date(a.createDate).getTime() : 0;
        const tb = b.createDate ? new Date(b.createDate).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 6);

    setNewCustomers(mappedUsers);
    setKpis({
      revenue,
      orders: successCount,
      revenueGrowth: 0, // chưa có so sánh tháng trước -> để 0
    });
  }, [fetchOrdersInMonth, fetchOrderItemsInMonth]);

  /* ======= load all ======= */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setErr("");
      try {
        await buildDashboard();
      } catch (e) {
        if (!cancelled) setErr("Không lấy được dữ liệu dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [buildDashboard]);

  /* ======= chart ======= */
  const chartData = useMemo(() => {
    const labels = topProducts.map(x => x.name);
    const qtys   = topProducts.map(x => x.qty);
    return { labels, qtys };
  }, [topProducts]);

  useEffect(() => {
    const el = document.getElementById("main-chart");
    if (!el) return;
    chartRef.current = el;

    if (!chartInst.current) chartInst.current = echarts.init(el);
    const inst = chartInst.current;

    const option = {
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: "3%", right: "3%", bottom: "3%", containLabel: true },
      xAxis: { type: "category", data: chartData.labels, axisTick: { alignWithLabel: true } },
      yAxis: { type: "value" },
      series: [{
        name: "Số lượng bán",
        type: "bar",
        barWidth: "55%",
        data: chartData.qtys,
        itemStyle: { color: "#414c62" },
      }],
    };
    inst.setOption(option, true);
    const onResize = () => inst.resize();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); inst.dispose(); chartInst.current = null; };
  }, [chartData]);

  /* ======= UI ======= */
  const growthBadge = (v) => {
    const val = Number(v) || 0;
    const up = val >= 0;
    return (
      <span className={`badge badge-pill fs--2 ${up ? "badge-soft-success" : "badge-soft-danger"}`}>
        {up ? "+" : ""}{val.toFixed(1)}%
      </span>
    );
  };

  return (
    <>
      <div className="container">
        {err && <p style={{ color: "red" }}>{err}</p>}

        {/* KPI cards */}
        <div className="container_admin">
          <div className="card h-md-100">
            <div className="card-header pb-0">
              <h6 className="mb-0 mt-2 d-flex align-items-center">
                Doanh thu trong tháng
              </h6>
            </div>
            <div className="card-body d-flex align-items-end">
              <div className="row flex-grow-1">
                <div className="col">
                  <div className="fs-4 font-weight-normal text-sans-serif text-700 line-height-1 mb-1">
                    {loading ? "…" : formatter(kpis.revenue)}
                  </div>
                  {growthBadge(kpis.revenueGrowth)}
                </div>
                <div className="col-auto pl-0">
                  <div className="echart-bar-weekly-sales h-100" />
                </div>
              </div>
            </div>
          </div>

          <div className="card h-md-100">
            <div className="card-header pb-0">
              <h6 className="mb-0 mt-2 d-flex align-items-center">Tổng số đơn hàng</h6>
            </div>
            <div className="card-body d-flex align-items-end">
              <div className="row flex-grow-1">
                <div className="col">
                  <div className="fs-4 font-weight-normal text-sans-serif text-700 line-height-1 mb-1">
                    {loading ? "…" : kpis.orders.toLocaleString("vi-VN")}
                  </div>
                  <span className="badge badge-pill fs--2 badge-soft-success">đơn thành công (tháng này)</span>
                </div>
                <div className="col-auto pl-0">
                  <div className="echart-bar-weekly-sales h-100" />
                </div>
              </div>
            </div>
          </div>

          <div className="card h-md-100">
            <div className="card-header pb-0">
              <h6 className="mb-0 mt-2 d-flex align-items-center">Sản phẩm bán chạy</h6>
            </div>
            <div className="card-body d-flex align-items-end">
              <div className="row flex-grow-1">
                <div className="col">
                  <div className="fs-4 font-weight-normal text-sans-serif text-700 line-height-1 mb-1">
                    {loading ? "…" : (topProducts[0]?.name || "—")}
                  </div>
                  <span className="badge badge-pill fs--2 badge-soft-success">
                    {loading ? "" : `${topProducts[0]?.qty ?? 0} sp / tháng`}
                  </span>
                </div>
                <div className="col-auto pl-0">
                  <div className="echart-bar-weekly-sales h-100" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart + new customers */}
        <div className="chart-row">
          <div className="chart-container">
            <h6 className="mb-3">Top 5 sản phẩm bán chạy nhất</h6>
            <div className="echart-full-width" id="main-chart" />
          </div>

          <div className="new-customers">
            <h6 className="mb-3">Khách hàng mới</h6>
            <ul className="customer-list">
              {(newCustomers || []).map((u, idx) => (
                <li key={idx} className="customer-item">
                  <div className="avatar">{u.initials}</div>
                  <div className="info">
                    <div className="name">{u.name}</div>
                    <div className="desc">{u.desc || u.email || ""}</div>
                  </div>
                  <div className="actions">
                    <span className="email" title={u.email || ""}>✉️</span>
                    <span className="block">🚫</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(DashboardPage);
