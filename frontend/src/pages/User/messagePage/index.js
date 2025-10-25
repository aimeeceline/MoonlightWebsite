// src/pages/User/message/index.jsx (hoặc nơi bạn đang đặt MessagePage)
import { memo, useEffect, useMemo, useState } from "react";
import { generatePath, Link, useNavigate, useLocation } from "react-router-dom";
import "./style.scss";
import { formatter } from "utils/fomatter";
import { ROUTERS } from "utils/router";
import { AiOutlineEye, AiOutlineShoppingCart } from "react-icons/ai";
import axios from "axios";

// ===== Base URLs =====
const PRODUCT_API =
  process.env.REACT_APP_PRODUCT_API || `http://${window.location.hostname}:7007`;

const api = axios.create({ baseURL: PRODUCT_API, timeout: 15000 });

const buildImageUrl = (img) => {
  if (!img) return "";
  if (/^https?:\/\//i.test(img)) return img;
  const clean = String(img).replace(/\\/g, "/").replace(/^\/+/, "");
  return `${PRODUCT_API}/images/${clean}`;
};

const MessagePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy orderId từ state hoặc localStorage (được set ở CheckoutPage)
  const lastOrderId =
    location.state?.orderId || localStorage.getItem("lastOrderId");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errText, setErrText] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await api.get("/api/Product/san-pham-noi-bat", {
          signal: controller.signal,
        });
        const raw = res?.data;
        const candidate =
          (Array.isArray(raw) && raw) ||
          raw?.data ||
          raw?.items ||
          raw?.products ||
          raw?.result ||
          raw?.content ||
          [];
        setItems(Array.isArray(candidate) ? candidate : []);
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error("[MessagePage] Fetch nổi bật lỗi:", err);
        setErrText("Không thể tải sản phẩm gợi ý. Vui lòng thử lại sau!");
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  const productCards = useMemo(
    () => (Array.isArray(items) ? items : []),
    [items]
  );

  const handleViewOrder = () => {
    if (lastOrderId) {
      // Trang chi tiết đã hỗ trợ ?id=...
      navigate(`${ROUTERS.USER.ORDERHISTORY}?id=${lastOrderId}`);
      // hoặc: navigate(`/don-hang/${lastOrderId}`);
      // hoặc: navigate(ROUTERS.USER.ORDERHISTORY, { state: { orderId: lastOrderId } });
    } else {
      navigate(ROUTERS.USER.MY_ORDERS);
    }
  };

  return (
    <>
      <div className="message_page">
        <h2>Bạn đã đặt hàng thành công</h2>
        <p>
          Cảm ơn bạn đã mua hàng. Chúng tôi sẽ liên hệ để xác nhận và giao hàng
          sớm nhất có thể.
        </p>
        <div className="button-group">
          <button
            type="button"
            className="button-submit"
            onClick={() => navigate(ROUTERS.USER.HOMEPAGE)}
          >
            Về trang chủ
          </button>
          <button type="button" className="button-submit" onClick={handleViewOrder}>
            Xem đơn hàng
          </button>
        </div>
      </div>

      <div className="container">
        <div className="section_title">
          <h2>Sản phẩm tương tự</h2>
        </div>

        {loading && (
          <div className="row">
            <div className="col-12">
              <p>Đang tải gợi ý…</p>
            </div>
          </div>
        )}

        {!loading && errText && (
          <div className="row">
            <div className="col-12">
              <p style={{ color: "#d32f2f" }}>{errText}</p>
            </div>
          </div>
        )}

        {!loading && !errText && (
          <div className="row">
            {productCards.length > 0 ? (
              productCards.map((item, idx) => {
                const imageUrl = buildImageUrl(
                  item.image || item.thumbnail || item.imageUrl
                );
                const name =
                  item.name ||
                  item.productName ||
                  `Sản phẩm #${item.productId || idx}`;
                const price = item.price ?? item.unitPrice ?? 0;
                const pid = item.productId ?? item.id;

                return (
                  <div
                    className="col-lg-3 col-md-4 col-sm-6 col-xs-12"
                    key={idx}
                  >
                    <div className="featured_item pl-pr-10">
                      <div
                        className="featured_item_img"
                        style={{
                          backgroundImage: `url(${imageUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                        title={name}
                      >
                        <ul className="featured_item_img_hover">
                          <li>
                            <AiOutlineEye />
                          </li>
                          <li>
                            <AiOutlineShoppingCart />
                          </li>
                        </ul>
                      </div>
                      <div className="featured_item_text">
                        <h6>
                          <Link
                            to={generatePath(ROUTERS.USER.PRODUCTS, {
                              productId: pid,
                            })}
                          >
                            {name}
                          </Link>
                        </h6>
                        <h5>{formatter(price)}</h5>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-12">
                <p>Không có sản phẩm gợi ý.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default memo(MessagePage);
