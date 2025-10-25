import { memo, useEffect, useState, useCallback } from "react";
import "./style.scss";
import { AiOutlineEdit, AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { IoIosAddCircleOutline } from "react-icons/io";
import { formatter } from "utils/fomatter";
import { ROUTERS } from "utils/router";
import { useNavigate } from "react-router-dom";
import axios from "axios";

/* ============== BASE URL (ưu tiên .env, khớp protocol) ============== */
const PRODUCT_API =
  process.env.REACT_APP_PRODUCT_API ||
  `${window.location.protocol}//${window.location.hostname}:7007`;
const API_URL = `${PRODUCT_API}/api/Product`;

/* ============== AUTH (nếu API yêu cầu Bearer) ============== */
const normalizeBearer = () => {
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  return raw.startsWith("Bearer ") ? raw : `Bearer ${raw}`;
};
const authAxios = axios.create();
authAxios.interceptors.request.use((config) => {
  const bearer = normalizeBearer();
  if (bearer) config.headers = { ...(config.headers || {}), Authorization: bearer };
  return config;
});

/* ============== HELPERS ============== */
const getImageUrl = (file) =>
  file ? `${PRODUCT_API}/images/${file}`.replace(/(?<!:)\/{2,}/g, "/") : "";

const unwrapProduct = (data) => data?.product ?? data ?? {};
const getActive = (item) =>
  typeof item.isActive === "boolean"
    ? item.isActive
    : typeof item.status === "boolean"
    ? item.status
    : true;

const ProductADPage = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await authAxios.get(API_URL);
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.products)
        ? res.data.products
        : [];
      setProducts(list);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách sản phẩm!");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Đặt hiển thị tường minh (ẩn/hiện)
  const setActive = useCallback(async (productId, value) => {
    try {
      await authAxios.put(`${API_URL}/toggle-active/${productId}?active=${value}`);
      return;
    } catch (e1) {
      const { data } = await authAxios.get(`${API_URL}/${productId}`);
      const p = unwrapProduct(data);
      const payload = {
        productId: p.productId ?? productId,
        categoryId: p.categoryId ?? null,
        name: p.name ?? "",
        description: p.description ?? "",
        descriptionDetails: p.descriptionDetails ?? "",
        image: p.image ?? "",
        image1: p.image1 ?? "",
        image2: p.image2 ?? "",
        image3: p.image3 ?? "",
        price: p.price ?? 0,
        inventory: p.inventory ?? 0,
        viewCount: p.viewCount ?? 0,
        createDate: p.createDate ?? null,
        isActive: value,
        IsActive: value,
        status: typeof p.status === "boolean" ? value : p.status, // nếu BE dùng status bool thì theo value
      };
      await authAxios.put(`${API_URL}/${productId}`, payload, {
        headers: { "Content-Type": "application/json" },
      });
    }
  }, []);

  const handleToggleActive = useCallback(async (item) => {
    const id = item.productId;
    const next = !getActive(item);
    const label = next ? "Hiện" : "Ẩn";
    if (!window.confirm(`${label} sản phẩm #${id}?`)) return;

    try {
      setBusyId(id);
      await setActive(id, next);
      await fetchProducts();
      alert(`${label} thành công!`);
    } catch (err) {
      console.error("Đổi trạng thái hiển thị thất bại:", err);
      alert("Thao tác thất bại!");
    } finally {
      setBusyId(null);
    }
  }, [fetchProducts, setActive]);

  return (
    <div className="container">
      <div className="orders">
        <h2>Quản lý sản phẩm</h2>

        <div className="orders_header">
          <button
            type="button"
            className="orders_header_button-create"
            onClick={() => navigate(ROUTERS.ADMIN.PRODUCTADCREATE)}
          >
            <IoIosAddCircleOutline /> <span>Tạo mới</span>
          </button>
        </div>

        {loading && <p>Đang tải dữ liệu...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && (
          <div className="orders_content">
            {products.length === 0 ? (
              <p>Không có sản phẩm nào!</p>
            ) : (
              <table className="orders_table">
                <thead>
                  <tr>
                    <th>Mã SP</th>
                    <th>Danh mục SP</th>
                    <th>Tên SP</th>
                    <th>Mô tả</th>
                    <th>Ảnh</th>
                    <th>Giá sản phẩm</th>
                    <th>Tồn kho</th>
                    <th>Lượt xem</th>
                    <th>Ngày tạo</th>
                    {/* ĐÃ BỎ cột Trạng thái hiển thị */}
                    <th>Hoạt động</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((item) => {
                    const active = getActive(item);
                    return (
                      <tr
                        key={item.productId}
                        className={active ? "" : "row-inactive"} // <-- tô xám hàng khi inactive
                        title={active ? "" : "Sản phẩm đang bị ẩn"}
                      >
                        <td><span className="id-badge id-badge--lg">{item.productId}</span></td>
                        <td>{item.categoryName}</td>
                        <td>{item.name}</td>
                        <td>
                          {(item.description || "").split(/\s+/).slice(0, 10).join(" ")}
                          {((item.description || "").split(/\s+/).length > 10) && "…"}
                        </td>
                        <td>
                          {item.image ? (
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.name}
                              style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }}
                            />
                          ) : (
                            <em>—</em>
                          )}
                        </td>
                        <td>{formatter(item.price)}</td>
                        <td>{item.inventory}</td>
                        <td>{item.viewCount}</td>
                        <td>{item.createDate ? new Date(item.createDate).toLocaleDateString() : ""}</td>

                        <td>
                          <div className="orders_button">
                            <button
                              type="button"
                              className="orders_button-btn"
                              onClick={() => navigate(`${ROUTERS.ADMIN.PRODUCTADEDIT}/${item.productId}`)}
                              title="Chỉnh sửa"
                            >
                              <AiOutlineEdit />
                            </button>
                            <button
                              type="button"
                              className="orders_button-btn"
                              onClick={() => handleToggleActive(item)}
                              title={active ? "Ẩn sản phẩm" : "Hiện sản phẩm"}
                              disabled={busyId === item.productId}
                            >
                              {active ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="orders_footer">
          <div className="orders_pagination">
            <div className="orders_page-number">
              <button type="button" className="orders_page-btn">→</button>
              <button type="button" className="orders_page-btn orders_page-btn--active">1</button>
              <button type="button" className="orders_page-btn">2</button>
              <button type="button" className="orders_page-btn">3</button>
              <button type="button" className="orders_page-btn">...</button>
              <button type="button" className="orders_page-btn">←</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ProductADPage);
