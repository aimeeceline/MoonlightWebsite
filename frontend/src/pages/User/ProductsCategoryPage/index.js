// src/pages/User/product-category/index.js
import { memo, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, generatePath, Link } from "react-router-dom";
import "./style.scss";
import Breadcrumb from "../theme/breadcrumb";
import { ROUTERS } from "utils/router";
import axios from "axios";
import { formatter } from "utils/fomatter";
import { AiOutlineEye, AiOutlineShoppingCart } from "react-icons/ai";

const PRODUCT_API =
  process.env.REACT_APP_PRODUCT_API || `http://${window.location.hostname}:7007`;

const PAGE_SIZE = 6;

// helper ảnh: nếu BE trả full URL dùng luôn; nếu chỉ tên file → nối PRODUCT_API/images/...
const buildImg = (name) => {
  if (!name) return "";
  if (typeof name === "string" && /^https?:\/\//i.test(name)) return name;
  return `${PRODUCT_API}/images/${encodeURIComponent(name)}`;
};

const ProductCategoryPage = () => {
  const sorts = [
    "Giá cao đến thấp",
    "Giá thấp đến cao",
    "Mới đến cũ",
    "Cũ đến mới",
    "Bán chạy",
    "Đang giảm giá",
  ];

  const { categoryId } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // ---- Đồng bộ trang hiện tại với query ?page=
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number(searchParams.get("page") || 1);
  const [page, setPage] = useState(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);

  // ===== Fetch theo danh mục =====
  useEffect(() => {
    if (!categoryId) return;

    const client = axios.create({ baseURL: PRODUCT_API });
    const ctrl = new AbortController();
    let canceled = false;

    const fetchByCategory = async () => {
      setLoading(true);
      try {
        // ✅ thêm "/" đầu URL
        const res = await client.get(`/api/Category/category/${categoryId}`, { signal: ctrl.signal });

        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.products)
          ? res.data.products
          : [];

        if (!canceled) {
          setProducts(list);
          setError(null);
        }
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error("Lỗi khi lấy sản phẩm theo danh mục:", err);
          if (!canceled) {
            setProducts([]);
            setError("Không thể tải sản phẩm");
          }
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    fetchByCategory();
    return () => {
      canceled = true;
      ctrl.abort();
    };
  }, [categoryId]);

  // Bảo đảm page hợp lệ khi tổng số trang thay đổi
  useEffect(() => {
    const total = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
    if (page > total) {
      setPage(total);
      setSearchParams((prev) => {
        const qp = new URLSearchParams(prev);
        qp.set("page", String(total));
        return qp;
      });
    }
  }, [products, page, setSearchParams]);

  // Cuộn lên nhẹ khi đổi trang
  useEffect(() => {
    window.scrollTo({ top: 200, behavior: "smooth" });
  }, [page]);

  // Cắt trang
  const { pageItems, totalPages } = useMemo(() => {
    const total = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
    const start = (page - 1) * PAGE_SIZE;
    const end   = start + PAGE_SIZE;
    return { pageItems: products.slice(start, end), totalPages: total };
  }, [products, page]);

  // Điều hướng trang
  const goToPage = (p) => {
    const clamped = Math.min(Math.max(1, p), totalPages);
    setPage(clamped);
    setSearchParams((prev) => {
      const qp = new URLSearchParams(prev);
      qp.set("page", String(clamped));
      return qp;
    });
  };

  // Tạo dãy nút trang có "..."
  const pageNumbers = useMemo(() => {
    const all = Array.from({ length: totalPages }, (_, i) => i + 1);
    if (totalPages <= 5) return all;
    return all.filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  }, [totalPages, page]);

  return (
    <>
      <Breadcrumb name="Danh sách sản phẩm" />

      <div className="container">
        <div className="row">
          {/* Cột bên trái */}
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

          {/* Cột bên phải */}
          <div className="col-lg-9 col-md-12 col-sm-12 col-xs-12">
            {loading && <p>Đang tải sản phẩm...</p>}
            {!!error && <p className="error-message">{error}</p>}
            {!loading && !error && products.length === 0 && <p>Chưa có sản phẩm.</p>}

            <div className="row">
              {pageItems.map((item) => {
                const pid =
                  item.productId ?? item.ProductId ?? item.id ?? item.Id ?? null;
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
                        {/* Overlay khi hết hàng */}
                        {item.inventory === 0 && (
                          <div className="out-of-stock-overlay">
                            <span className="title">Hết hàng</span>
                          </div>
                        )}

                        <ul className="featured_item_img_hover">
                          <li>
                            <Link
                              to={generatePath(ROUTERS.USER.PRODUCTS, { productId: pid })}
                            >
                              <AiOutlineEye />
                            </Link>
                          </li>
                          <li>
                            <Link
                              to={generatePath(ROUTERS.USER.PRODUCTS, { productId: pid })}
                            >
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

            {/* Pagination thật (thay vì mẫu) */}
            {products.length > 0 && (
              <div className="product_footer">
                <div className="product_pagination">
                  <div className="product_page-number">
                    <button
                      type="button"
                      className="product_page-btn"
                      onClick={() => goToPage(page - 1)}
                      disabled={page <= 1}
                      aria-label="Trang trước"
                    >
                      ←
                    </button>

                    {pageNumbers.map((p, idx) => {
                      const prev = pageNumbers[idx - 1];
                      const needDots = prev && p - prev > 1;
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
                      onClick={() => goToPage(page + 1)}
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

export default memo(ProductCategoryPage);
