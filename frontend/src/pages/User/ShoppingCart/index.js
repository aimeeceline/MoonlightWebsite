import { memo, useEffect, useState, useCallback } from "react";
import Breadcrumb from "../theme/breadcrumb";
import "./style.scss";
import { formatter } from "utils/fomatter";
import { Quantity } from "component";
import { AiOutlineClose } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { ROUTERS } from "utils/router";
import axios from "axios";

const CART_API = process.env.REACT_APP_CART_API || `http://${window.location.hostname}:7099`;
const PRODUCT_API = process.env.REACT_APP_PRODUCT_API || `http://${window.location.hostname}:7007`;

// ---- Axios instance cho Cart (tự gắn Bearer token) ----
const apiCart = axios.create({ baseURL: CART_API });
apiCart.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

const ShoppingCart = () => {
  const navigate = useNavigate();
  const [cartDetails, setCartDetails] = useState(null);
  const [discountCode, setDiscountCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ---- fetch giỏ hàng (có items) ----
  const fetchCartDetails = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { setCartDetails(null); return; }
    try {
      const res = await apiCart.get(`/api/Cart/user-cartItem`);
      setCartDetails(res.status === 200 ? res.data : null);
    } catch (e) {
      console.error("user-cartItem error:", e?.response ?? e);
      setCartDetails(null);
    }
  }, []);

  useEffect(() => { fetchCartDetails(); }, [fetchCartDetails]);

  // ---- xóa sản phẩm ----
  const handleRemoveFromCart = async (cartItemId) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Vui lòng đăng nhập!");
    try {
      const res = await apiCart.delete(`/api/Cart/delete-item/${cartItemId}`);
      if (res.status === 200) {
        await fetchCartDetails();
        alert("Sản phẩm đã được xóa khỏi giỏ hàng.");
      } else {
        alert("Không thể xóa sản phẩm. Vui lòng thử lại!");
      }
    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
      alert(error?.response?.data?.message || "Có lỗi xảy ra.");
    }
  };

  // ---- áp mã giảm giá ----
  const handleApplyDiscount = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Vui lòng đăng nhập!");
    if (!discountCode) return alert("Vui lòng nhập mã giảm giá!");

    setLoading(true);
    try {
      const res = await apiCart.post(`/api/Cart/apply-discount`, { discountCode });
      if (res.status === 200) {
        setMessage("Áp mã giảm giá thành công!");
        await fetchCartDetails();
      } else {
        setMessage("Không thể áp mã giảm giá.");
      }
    } catch (error) {
      console.error("Lỗi khi áp mã:", error);
      if (error.response?.status === 400) setMessage("Mã giảm giá không hợp lệ, vui lòng nhập mã khác!");
      else setMessage("Hệ thống không cho phép dùng nhiều mã giảm giá cho cùng 1 đơn hàng!");
    } finally {
      setLoading(false);
    }
  };

  // ---- hủy mã giảm giá ----
  const handleRemoveDiscount = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Vui lòng đăng nhập!");
    setLoading(true);
    try {
      const res = await apiCart.delete(`/api/Cart/remove-discount`);
      if (res.status === 200) {
        await fetchCartDetails();
        setDiscountCode("");
        setMessage("Mã giảm giá đã được hủy.");
      }
    } catch (error) {
      console.error("Lỗi hủy mã:", error);
      setMessage("Lỗi khi hủy mã giảm giá.");
    } finally {
      setLoading(false);
    }
  };

  // ---- cập nhật số lượng ----
  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Vui lòng đăng nhập!");
    try {
      const res = await apiCart.put(`/api/Cart/update-item-quantity/${cartItemId}`, { quantity: newQuantity });
      if (res.status === 200) await fetchCartDetails();
      else alert("Cập nhật số lượng không thành công.");
    } catch (error) {
      console.error("Lỗi cập nhật số lượng:", error);
      alert("Lỗi khi cập nhật số lượng. Thử lại sau nhé!");
    }
  };

  return (
    <>
      <Breadcrumb name="Giỏ hàng" />
      <div className="container">
        <div className="table_cart">
          <table>
            <thead>
              <tr>
                <th>Tên sản phẩm</th>
                <th>Giá</th>
                <th>Số lượng</th>
                <th>Thành tiền</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cartDetails?.items?.length ? (
                cartDetails.items.map((item) => {
                  const img = item.productImage?.startsWith("http")
                    ? item.productImage
                    : item.productImage
                      ? `${PRODUCT_API}/images/${item.productImage}`
                      : "/images/placeholder.png";
                  return (
                    <tr key={item.cartItemId}>
                      <td className="shopping_cart_item">
                        <img src={img} alt="product-pic" />
                        <h4>{item.productName}</h4>
                      </td>
                      <td>{formatter(item.price || 0)}</td>
                      <td>
                        <Quantity
                          product={item}
                          initialQuantity={item.quantity}
                          hasAddToCart={false}
                          onQuantityChange={(newQty) =>
                            handleUpdateQuantity(item.cartItemId, newQty)
                          }
                        />
                      </td>
                      <td>{formatter(item.totalCost || 0)}</td>
                      <td
                        className="icon_close"
                        onClick={() => handleRemoveFromCart(item.cartItemId)}
                      >
                        <AiOutlineClose />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">Giỏ hàng của bạn trống</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="row">
          <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12">
            <div className="shopping_continue">
              <h3>Mã giảm giá</h3>
              <div className="shopping_discount">
                <input
                  type="text"
                  placeholder="Nhập mã giảm giá"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  disabled={!!cartDetails?.discountCode}
                />
                <button
                  className="button-submit"
                  onClick={handleApplyDiscount}
                  disabled={loading || !!cartDetails?.discountCode}
                >
                  {loading ? "Đang áp dụng..." : "Áp dụng"}
                </button>
                {cartDetails?.discount > 0 && (
                  <button
                    className="button-submit"
                    style={{ marginLeft: 10, backgroundColor: "#FF6347" }}
                    onClick={handleRemoveDiscount}
                    disabled={loading}
                  >
                    Huỷ mã
                  </button>
                )}
              </div>
              {message && <p className="discount-message">{message}</p>}
            </div>
          </div>

          <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12">
            <div className="shopping_checkout">
              <h2>Tổng đơn</h2>
              <ul>
                <li>Số lượng: <span>{cartDetails?.quantity ?? 0}</span></li>
                <li>Tổng tiền: <span>{formatter(cartDetails?.originalTotal ?? 0)}</span></li>
                <li>Mã giảm giá: <span>{cartDetails?.discountCode ?? "Không có"}</span></li>
                <li>Tiết kiệm: <span>-{formatter(cartDetails?.discount ?? 0)}</span></li>
                <li>Thành tiền: <span>{formatter(cartDetails?.totalCartPrice ?? 0)}</span></li>
              </ul>
              <button
                type="submit"
                className="button-submit"
                onClick={() => navigate(ROUTERS.USER.CHECKOUT)}
                disabled={!cartDetails?.items || cartDetails.items.length === 0}
              >
                Tiến hành đặt hàng
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(ShoppingCart);
