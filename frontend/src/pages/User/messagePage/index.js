import { memo, useEffect, useState } from "react";
import "aos/dist/aos.css";
import "./style.scss";
import { generatePath, Link, useNavigate } from "react-router-dom";
import { formatter } from "utils/fomatter";
import { ROUTERS } from "utils/router";
import { AiOutlineEye, AiOutlineShoppingCart } from "react-icons/ai";
import axios from "axios";

const MessagePage = () => {
  const navigate = useNavigate();
  const [productnoibat, setProductNoiBat] = useState([]);
  const [, setLoading] = useState(true);
  const [, setError] = useState(null);

  useEffect(() => {
    const fetchProductNoiBat = async () => {
      try {
        const res = await axios.get("https://localhost:7007/api/Product/san-pham-noi-bat");

        // Chuẩn hoá dữ liệu về mảng
        const raw = res?.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : [];

        setProductNoiBat(list);
      } catch (err) {
        setError("Không thể tải sản phẩm!");
        console.error("Fetch nổi bật lỗi:", err);
        setProductNoiBat([]); // để UI không crash
      } finally {
        setLoading(false);
      }
    };
    fetchProductNoiBat();
  }, []);

  const items = Array.isArray(productnoibat) ? productnoibat : [];

  return (
    <>
      <div className="message_page">
        <h2>Bạn đã đặt hàng thành công</h2>
        <p>Cảm ơn bạn đã mua hàng. Chúng tôi sẽ liên hệ để xác nhận và giao hàng sớm nhất có thể.</p>
        <div className="button-group">
          <button type="button" className="button-submit" onClick={() => navigate(ROUTERS.USER.HOMEPAGE)}>
            Về trang chủ
          </button>
          <button type="button" className="button-submit" onClick={() => navigate(ROUTERS.USER.ORDERHISTORY)}>
            Xem đơn hàng
          </button>
        </div>
      </div>

      <div className="container">
        <div className="section_title">
          <h2>Sản phẩm tương tự</h2>
        </div>
        <div className="row">
          {items.map((item, idx) => (
            <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12" key={idx}>
              <div className="featured_item pl-pr-10">
                <div
                  className="featured_item_img"
                  style={{
                    backgroundImage: `url(https://localhost:7007/images/${item.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <ul className="featured_item_img_hover">
                    <li><AiOutlineEye /></li>
                    <li><AiOutlineShoppingCart /></li>
                  </ul>
                </div>
                <div className="featured_item_text">
                  <h6>
                    <Link to={generatePath(ROUTERS.USER.PRODUCTS, { productId: item.productId })}>
                      {item.name}
                    </Link>
                  </h6>
                  <h5>{formatter(item.price)}</h5>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-12">
              <p>Không có sản phẩm gợi ý.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default memo(MessagePage);
