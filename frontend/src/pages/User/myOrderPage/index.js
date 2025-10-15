import { memo, useEffect, useState, useCallback } from "react";
import "./style.scss";
import Breadcrumb from "../theme/breadcrumb";

import call1ing from "assets/User/images/about/account.jpg";
import axios from "axios";
import { formatter } from "utils/fomatter";

const PRODUCT_API = process.env.REACT_APP_PRODUCT_API || `http://${window.location.hostname}:7007`;
const USER_API    = process.env.REACT_APP_USER_API    || `http://${window.location.hostname}:7200`;
const CART_API    = process.env.REACT_APP_CART_API    || `http://${window.location.hostname}:7099`;

// ---- axios instances (auto gắn Bearer) ----
const withToken = (config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
};
const apiUser = axios.create({ baseURL: USER_API  });
const apiCart = axios.create({ baseURL: CART_API });
apiUser.interceptors.request.use(withToken);
apiCart.interceptors.request.use(withToken);

const MyOrderPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userInfo, setUserInfo] = useState({ username: "", email: "", phone: "" });

  // --- lấy thông tin user ---
  const getUserInfo = useCallback(async () => {
    try {
      const res = await apiUser.get(`/api/Auth/me`);
      setUserInfo({
        username: res.data?.username ?? "",
        email:    res.data?.email ?? "",
        phone:    res.data?.phone ?? ""
      });
    } catch (e) {
      console.error("Error fetching user info", e?.response ?? e);
    }
  }, []);

  // --- lấy giỏ hàng hiện tại ---
  const getCart = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { setCart(null); setLoading(false); return; }

      const res = await apiCart.get(`/api/Cart/user-cartItem`);
      // CartService trả object { cartId, quantity, originalTotal, totalCartPrice, discount, discountCode, items: [...] }
      setCart(res.data ?? null);
      setError("");
    } catch (e) {
      console.error("Lỗi lấy giỏ hàng:", e?.response ?? e);
      setError("Không thể lấy giỏ hàng. Vui lòng thử lại.");
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { getUserInfo(); }, [getUserInfo]);
  useEffect(() => { getCart(); }, [getCart]);

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
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!loading && !error && items.length === 0 && <p>Giỏ hàng của bạn trống.</p>}

            {items.length > 0 && (
              <div className="order">
                <div className="order-items">
                  {items.map((it, idx) => {
                    const name = it.productName ?? it.name ?? "(Không rõ tên)";
                    const qty  = it.quantity ?? it.soLuong ?? 0;
                    const imgRaw = it.productImage ?? it.imageProduct ?? it.image ?? it.imageUrl ?? "";
                    const img = !imgRaw
                      ? "/images/placeholder.png"
                      : (imgRaw.startsWith("http") ? imgRaw : `${PRODUCT_API}/images/${imgRaw}`);
                    const price = it.price ?? 0;
                    const total = it.totalCost ?? (price * qty);

                    return (
                      <div className="order-item" key={`${it.productId ?? idx}-${idx}`}>
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
