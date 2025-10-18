import { memo, useEffect, useState, useCallback } from "react";
import "./style.scss";
import Breadcrumb from "../theme/breadcrumb";

import call1ing from "assets/User/images/about/account.jpg";
import axios from "axios";
import { formatter } from "utils/fomatter";

const PRODUCT_API = process.env.REACT_APP_PRODUCT_API || `http://${window.location.hostname}:7007`;
const USER_API    = process.env.REACT_APP_USER_API    || `http://${window.location.hostname}:7200`;
const ORDER_API   = process.env.REACT_APP_ORDER_API   || `http://${window.location.hostname}:7101`;

// ===== axios instances (auto gắn Bearer đúng chuẩn + x-user-id nếu có) =====
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

const apiUser = axios.create({ baseURL: USER_API,  timeout: 15000 });
const apiOrder = axios.create({ baseURL: ORDER_API, timeout: 15000 });
apiUser.interceptors.request.use(attachAuth);
apiOrder.interceptors.request.use(attachAuth);

// ===== helper ảnh sản phẩm =====
const toImageUrl = (img) => {
  if (!img) return "/images/placeholder.png";
  if (/^https?:\/\//i.test(img)) return img;
  const clean = String(img).replace(/\\/g, "/").replace(/^\/+/, "");
  return `${PRODUCT_API}/images/${clean}`;
};

const MyOrderPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userInfo, setUserInfo] = useState({ username: "", email: "", phone: "" });

  // --- lấy thông tin user ---
  const getUserInfo = useCallback(async (signal) => {
    try {
      // Nếu BE của bạn không có /api/Auth/me, đổi sang endpoint hiện có (vd: /api/User/me)
      const res = await apiUser.get(`/api/Auth/me`, { signal });
      setUserInfo({
        username: res.data?.username ?? "",
        email:    res.data?.email ?? "",
        phone:    res.data?.phone ?? ""
      });
    } catch (e) {
      if (axios.isCancel(e)) return;
      console.error("Error fetching user info", e?.response?.data || e.message);
    }
  }, []);

  // --- lấy giỏ hàng hiện tại ---
  const getCart = useCallback(async (signal) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setCart(null);
        setError("Bạn chưa đăng nhập.");
        return;
      }

      const res = await apiOrder.get(`/api/Cart/user-cartItem`, { signal });

      // Chuẩn hoá dữ liệu phòng backend đổi tên field
      const data = res?.data || {};
      const normalized = {
        items: Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.cartItems)
          ? data.cartItems
          : [],
        originalTotal: data.originalTotal ?? data.totalBeforeDiscount ?? 0,
        totalCartPrice: data.totalCartPrice ?? data.total ?? 0,
        discount: data.discount ?? 0,
        discountCode: data.discountCode ?? "",
      };

      setCart(normalized);
      setError("");
    } catch (e) {
      if (axios.isCancel(e)) return;
      console.error("Lỗi lấy giỏ hàng:", e?.response?.data || e.message);
      setError("Không thể lấy giỏ hàng. Vui lòng thử lại.");
      setCart(null);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    Promise.all([getUserInfo(controller.signal), getCart(controller.signal)])
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [getUserInfo, getCart]);

  const items = cart?.items ?? [];

  return (
    <>
      <Breadcrumb name="Tài khoản của tôi" />
      <div className="container">
        <div className="row">
          {/* Sidebar user */}
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

          {/* Giỏ hàng hiện tại (từ CartService) */}
          <div className="col-lg-9 col-md-12 col-sm-12 col-xs-12 ">
            <h2>Giỏ hàng của tôi</h2>

            {loading && <p>Đang tải giỏ hàng...</p>}
            {!loading && error && <p style={{ color: "red" }}>{error}</p>}
            {!loading && !error && items.length === 0 && <p>Giỏ hàng của bạn trống.</p>}

            {!loading && !error && items.length > 0 && (
              <div className="order">
                <div className="order-items">
                  {items.map((it, idx) => {
                    const name  = it.productName ?? it.name ?? "(Không rõ tên)";
                    const qty   = it.quantity ?? it.soLuong ?? 0;
                    const img   = toImageUrl(it.productImage ?? it.imageProduct ?? it.image ?? it.imageUrl);
                    const price = it.price ?? it.unitPrice ?? 0;
                    const total = it.totalCost ?? (price * qty);

                    return (
                      <div className="order-item" key={`${it.productId ?? it.id ?? idx}-${idx}`}>
                        <img src={img} alt={name} className="order-item_img" />
                        <div className="order-item_details">
                          <h3>{name}</h3>
                          <p>x{qty}</p>
                          <p>Đơn giá: {formatter(price)}</p>
                          <p>Thành tiền: {formatter(total)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="order_discount">
                  Mã giảm giá: <span>{cart?.discountCode ?? "Không có"}</span>
                </div>
                <div className="order_discount">
                  Tiết kiệm: <span>{formatter(cart?.discount ?? 0)}</span>
                </div>
                <div className="order_total">
                  Tổng tiền: <span>{formatter(cart?.originalTotal ?? 0)}</span>
                </div>
                <div className="order_total">
                  Thành tiền: <span>{formatter(cart?.totalCartPrice ?? 0)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(MyOrderPage);
