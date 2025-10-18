import { memo, useEffect, useMemo, useState } from "react";
import "./style.scss";
import { generatePath, Link, useNavigate } from "react-router-dom";
import { formatter } from "utils/fomatter";
import { ROUTERS } from "utils/router";
import { AiOutlineEye, AiOutlineShoppingCart } from "react-icons/ai";
import axios from "axios";

// ===== Base URLs (ưu tiên .env, fallback theo hostname + đúng cổng Docker) =====
const PRODUCT_API =
  process.env.REACT_APP_PRODUCT_API || `http://${window.location.hostname}:7007`;

// Tạo axios instance riêng cho trang này
const api = axios.create({
  baseURL: PRODUCT_API,
  timeout: 15000,
});

// Helper: chuẩn hoá url ảnh (hỗ trợ cả full URL & relative path)
const buildImageUrl = (img) => {
  if (!img) return "";
  // Nếu BE đã trả full URL (http/https) thì dùng luôn
  if (/^https?:\/\//i.test(img)) return img;

  // Chuẩn hoá backslash -> slash
  const clean = String(img).replace(/\\/g, "/").replace(/^\/+/, "");
  // Ảnh của bạn đang ở /images/..., giữ nguyên theo API bạn đang dùng
  return `${PRODUCT_API}/images/${clean}`;
};

const MessagePage = () => {
  const navigate = useNavigate();

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

      // Log để nhìn rõ backend trả gì
      console.log("[Featured RAW]", res?.data);

      const raw = res?.data;

      // Hỗ trợ nhiều kiểu bọc dữ liệu khác nhau
      const candidate =
        (Array.isArray(raw) && raw) ||
        raw?.data ||
        raw?.items ||
        raw?.products ||
        raw?.result ||
        raw?.content ||
        [];

      const list = Array.isArray(candidate) ? candidate : [];

      console.log("[Featured length]", list.length);
      setItems(list);
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


  // Tránh compute lại nhiều lần
  const productCards = useMemo(() => Array.isArray(items) ? items : [], [items]);

  return (
    <>
      <div className="message_page">
        <h2>Bạn đã đặt hàng thành công</h2>
        <p>
          Cảm ơn bạn đã mua hàng. Chúng tôi sẽ liên hệ để xác nhận và giao hàng sớm nhất có thể.
        </p>
        <div className="button-group">
          <button
            type="button"
            className="button-submit"
            onClick={() => navigate(ROUTERS.USER.HOMEPAGE)}
          >
            Về trang chủ
          </button>
          <button
            type="button"
            className="button-submit"
            onClick={() => navigate(ROUTERS.USER.ORDERHISTORY)}
          >
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
            <div className="col-12"><p>Đang tải gợi ý…</p></div>
          </div>
        )}

        {!loading && errText && (
          <div className="row">
            <div className="col-12"><p style={{ color: "#d32f2f" }}>{errText}</p></div>
          </div>
        )}

        {!loading && !errText && (
          <div className="row">
            {productCards.length > 0 ? (
              productCards.map((item, idx) => {
                const imageUrl = buildImageUrl(item.image || item.thumbnail || item.imageUrl);
                const name = item.name || item.productName || `Sản phẩm #${item.productId || idx}`;
                const price = item.price ?? item.unitPrice ?? 0;
                const pid = item.productId ?? item.id;

                return (
                  <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12" key={idx}>
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
                          <li><AiOutlineEye /></li>
                          <li><AiOutlineShoppingCart /></li>
                        </ul>
                      </div>
                      <div className="featured_item_text">
                        <h6>
                          <Link to={generatePath(ROUTERS.USER.PRODUCTS, { productId: pid })}>
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
