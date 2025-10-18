// src/pages/User/product/index.js
import { memo, useEffect, useMemo, useState } from "react";
import "./style.scss";
import Breadcrumb from "../theme/breadcrumb";
import { generatePath, Link, useSearchParams } from "react-router-dom";
import { ROUTERS } from "utils/router";
import axios from "axios";
import { formatter } from "utils/fomatter";
import { AiOutlineEye, AiOutlineShoppingCart } from "react-icons/ai";

// === API base URL cho Product ===
const PRODUCT_API =
  process.env.REACT_APP_PRODUCT_API || `http://${window.location.hostname}:7007`;

// helper ảnh: nếu BE trả full URL thì dùng luôn; nếu chỉ tên file -> nối PRODUCT_API/images/...
const buildImg = (name) => {
  if (!name) return "";
  if (typeof name === "string" && /^https?:\/\//i.test(name)) return name;
  return `${PRODUCT_API}/images/${encodeURIComponent(name)}`;
};

const PAGE_SIZE = 6;

const ProductPage = () => {
  const sorts = [
    "Giá cao đến thấp",
    "Giá thấp đến cao",
    "Mới đến cũ",
    "Cũ đến mới",
    "Bán chạy",
    "Đang giảm giá",
  ];

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const productApi = axios.create({ baseURL: PRODUCT_API });

  // ---- Đồng bộ trang hiện tại với query param (?page=)
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number(searchParams.get("page") || 1);
  const [page, setPage] = useState(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);

  // Tải dữ liệu
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await productApi.get("/api/Product");
        const list = Array.isArray(res.data) ? res.data : (res.data?.products || []);
        setProducts(list);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Không thể tải sản phẩm!");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nếu tổng số trang thay đổi khiến page hiện tại > totalPages -> đưa page về cuối hợp lệ
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
    if (page > totalPages) {
      setPage(totalPages);
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.set("page", String(totalPages));
        return p;
      });
    }
  }, [products, page, setSearchParams]);

  // Cuộn lên đầu danh sách khi đổi trang
  useEffect(() => {
    window.scrollTo({ top: 200, behavior: "smooth" });
  }, [page]);

  // Tính dữ liệu phân trang
  const { pageItems, totalPages } = useMemo(() => {
    const totalPagesCalc = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return {
      pageItems: products.slice(start, end),
      totalPages: totalPagesCalc,
    };
  }, [products, page]);

  const goToPage = (p) => {
    const clamped = Math.min(Math.max(1, p), totalPages);
    setPage(clamped);
    setSearchParams((prev) => {
      const qp = new URLSearchParams(prev);
      qp.set("page", String(clamped));
      return qp;
    });
  };

  const next = () => goToPage(page + 1);
  const prev = () => goToPage(page - 1);

  return (
    <>
      <Breadcrumb name="Danh sách sản phẩm" />

      <div className="container">
        <div className="row">
          {/* Cột trái: filter/sort (mẫu) */}
          <div className="col-lg-3 col-md-12 col-sm-12 col-xs-12">
            <div className="slidebar">
              <div className="slidebar_item">
                <h2>Tìm kiếm</h2>
                <input type="text" placeholder="Từ khoá..." />
              </div>

              <div className="slidebar_item">
                <h2>Mức giá</h2>
                <div className="price-range-wrap">
                  <div>
                    <p>Từ:</p>
                    <input type="number" min={0} />
                  </div>
                  <div>
                    <p>Đến:</p>
                    <input type="number" min={0} />
                  </div>
                </div>
              </div>

              <div className="slidebar_item">
                <h2>Sắp xếp</h2>
                <div className="tags">
                  {sorts.map((item, key) => (
                    <div className={`tag ${key === 0 ? "active" : ""}`} key={key}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: danh sách */}
          <div className="col-lg-9 col-md-12 col-sm-12 col-xs-12">
            {loading && <p>Đang tải sản phẩm...</p>}
            {!!error && <p className="error-message">{error}</p>}
            {!loading && !error && products.length === 0 && <p>Chưa có sản phẩm.</p>}

            <div className="row">
              {(Array.isArray(pageItems) ? pageItems : []).map((item) => {
                const pid = item.productId ?? item.ProductId ?? item.id ?? item.Id;
                if (!pid) return null;

                return (
                  <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12" key={pid}>
                    <div className="featured_item pl-pr-10">
                      <div
                        className="featured_item_img"
                        style={{
                          backgroundImage: `url(${buildImg(item?.image || "")})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          height: "240px",
                        }}
                      >
                        {item.inventory === 0 && (
                          <div className="out-of-stock-overlay">
                            <span className="title">Hết hàng</span>
                          </div>
                        )}
                        <ul className="featured_item_img_hover">
                          <li>
                            <Link to={generatePath(ROUTERS.USER.PRODUCTS, { productId: pid })}>
                              <AiOutlineEye />
                            </Link>
                          </li>
                          <li>
                            <Link to={generatePath(ROUTERS.USER.PRODUCTS, { productId: pid })}>
                              <AiOutlineShoppingCart />
                            </Link>
                          </li>
                        </ul>
                      </div>

                      <div className="featured_item_text">
                        <h6>
                          <Link to={generatePath(ROUTERS.USER.PRODUCTS, { productId: pid })}>
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

            {/* Pagination */}
            {products.length > 0 && (
              <div className="product_footer">
                <div className="product_pagination">
                  <div className="product_page-number">
                    <button
                      type="button"
                      className="product_page-btn"
                      onClick={prev}
                      disabled={page <= 1}
                      aria-label="Trang trước"
                    >
                      ←
                    </button>

                    {/* Hiển thị tối đa 5 nút trang (… nếu dài) */}
                    {Array.from({ length: totalPages }).map((_, i) => i + 1)
                      .filter((p) => {
                        // cửa sổ trượt quanh trang hiện tại
                        if (totalPages <= 5) return true;
                        if (p === 1 || p === totalPages) return true;
                        return Math.abs(p - page) <= 1;
                      })
                      .map((p, idx, arr) => {
                        // chèn "..." khi bị cắt
                        const prevPage = arr[idx - 1];
                        const needDots = prevPage && p - prevPage > 1;
                        return (
                          <span key={p}>
                            {needDots && <span className="product_page-ellipsis">...</span>}
                            <button
                              type="button"
                              className={`product_page-btn ${p === page ? "product_page-btn--active" : ""}`}
                              onClick={() => goToPage(p)}
                            >
                              {p}
                            </button>
                          </span>
                        );
                      })}

                    <button
                      type="button"
                      className="product_page-btn"
                      onClick={next}
                      disabled={page >= totalPages}
                      aria-label="Trang sau"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
};

export default memo(ProductPage);
