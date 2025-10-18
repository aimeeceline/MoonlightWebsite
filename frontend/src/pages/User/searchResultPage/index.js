// src/pages/User/search-result/index.js
import { useEffect, useState, memo } from "react";
import { useLocation, Link, generatePath } from "react-router-dom";
import { AiOutlineEye, AiOutlineShoppingCart } from "react-icons/ai";
import axios from "axios";
import "./style.scss";
import { ROUTERS } from "utils/router";
import { formatter } from "utils/fomatter";

const PRODUCT_API =
  process.env.REACT_APP_PRODUCT_API || `http://${window.location.hostname}:7007`;

const useQuery = () => new URLSearchParams(useLocation().search);

// helper: nếu BE trả full URL thì dùng luôn, nếu chỉ tên file -> nối PRODUCT_API/images/...
const buildImg = (name) => {
  if (!name) return "";
  if (typeof name === "string" && /^https?:\/\//i.test(name)) return name;
  return `${PRODUCT_API}/images/${name}`;
};

const SearchResultPage = () => {
  const query = useQuery();
  const keyword = (query.get("keyword") || "").trim();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!keyword) {
      setProducts([]);
      setError("");
      return;
    }

    const ctrl = new AbortController();
    const client = axios.create({ baseURL: PRODUCT_API });

    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const { data } = await client.get(
          `/api/Search`,
          { params: { keyword }, signal: ctrl.signal }
        );
        // BE có thể trả mảng trực tiếp hoặc { products: [...] }
        const list = Array.isArray(data) ? data : (data?.products ?? data?.data ?? []);
        setProducts(Array.isArray(list) ? list : []);
        setError("");
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error("Lỗi khi tìm kiếm:", err);
        setProducts([]);
        setError("Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại!");
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
    return () => ctrl.abort();
  }, [keyword]);

  return (
    <div className="search_result container">
      <h2 className="search_result_title">
        Từ khóa: <strong className="text-primary">{keyword || "(trống)"}</strong>
      </h2>

      {loading ? (
        <p>Đang tải kết quả...</p>
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : products.length === 0 ? (
        <p className="text-warning">
          🤣 Tiếc quá! Chắc là sản phẩm bạn tìm... chưa ra đời!
        </p>
      ) : (
        <div className="row">
          {products.map((item) => {
            const pid =
              item.productId ?? item.ProductId ?? item.id ?? item.Id ?? null;
            if (!pid) return null;

            const imgUrl = buildImg(item.image);

            return (
              <div className="col-lg-3 col-md-4 col-sm-6 mb-4" key={pid}>
                <div className="featured_item pl-pr-10">
                  <div
                    className="featured_item_img"
                    style={{
                      backgroundImage: `url(${imgUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      height: "220px",
                    }}
                  >
                    {item.inventory === 0 && (
                      <div className="out-of-stock-overlay">
                        <span className="title">Hết hàng</span>
                      </div>
                    )}

                    <ul className="featured_item_img_hover">
                      <li className="me-2 text-white">
                        <Link
                          to={generatePath(ROUTERS.USER.PRODUCTS, {
                            productId: pid,
                          })}
                          className="text-white"
                          aria-label="Xem chi tiết"
                        >
                          <AiOutlineEye />
                        </Link>
                      </li>
                      <li>
                        {/* Tuỳ logic add-to-cart của bạn, hiện để icon hiển thị */}
                        <span className="text-white" role="button" aria-label="Thêm vào giỏ">
                          <AiOutlineShoppingCart />
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="featured_item_text">
                    <h6>
                      <Link
                        to={generatePath(ROUTERS.USER.PRODUCTS, { productId: pid })}
                        className="text-dark"
                      >
                        {item.name}
                      </Link>
                    </h6>
                    <h5>{formatter(item.price)}</h5>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default memo(SearchResultPage);
