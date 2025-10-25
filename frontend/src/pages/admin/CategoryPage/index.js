// src/pages/Admin/CategoryPage/index.jsx
import { memo, useEffect, useState, useCallback } from "react";
import "./style.scss";
import { AiOutlineDelete } from "react-icons/ai";
import { IoIosAddCircleOutline } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { ROUTERS } from "utils/router";
import axios from "axios";

/* ================== BASE URL (ưu tiên .env) ================== */
const PRODUCT_API =
  process.env.REACT_APP_PRODUCT_API ||
  `${window.location.protocol}//${window.location.hostname}:7007`;
const API_URL = `${PRODUCT_API}/api/Category`;

/* ================== AUTH (Bearer JWT từ localStorage) ================== */
const normalizeBearer = () => {
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  return raw.startsWith("Bearer ") ? raw : `Bearer ${raw}`;
};
const authAxios = axios.create();
authAxios.interceptors.request.use((config) => {
  const bearer = normalizeBearer();
  if (bearer) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: bearer,
    };
  }
  return config;
});

/* ================== COMPONENT ================== */
const CategoryPage = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true); // Trạng thái loading
  const [error, setError] = useState(null); // Lỗi (nếu có)
  const [busyId, setBusyId] = useState(null); // chống bấm xoá liên tục

  // fetch: bóc đúng trường
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await authAxios.get(API_URL);
        // Chuẩn hoá dữ liệu về mảng
        const list =
          Array.isArray(res.data) ? res.data :
          Array.isArray(res.data?.categories) ? res.data.categories :
          Array.isArray(res.data?.data) ? res.data.data :
          Array.isArray(res.data?.items) ? res.data.items : [];
        if (!ignore) {
          setCategories(list);
          setError(null);
        }
      } catch (err) {
        console.error(err);
        if (!ignore) setError("Không thể tải danh sách danh mục!");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  // Xoá 1 danh mục
  const handleDelete = useCallback(async (categoryId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này hay không?")) return;
    try {
      setBusyId(categoryId);
      await authAxios.delete(`${API_URL}/${categoryId}`);
      // Cập nhật UI tại chỗ, không reload trang
      setCategories((prev) => prev.filter((c) => c.categoryId !== categoryId));
      alert("Xóa thành công!");
    } catch (err) {
      console.error("Lỗi khi xóa danh mục:", err);
      alert("Xóa thất bại!");
    } finally {
      setBusyId(null);
    }
  }, []);

  return (
    <div className="container">
      <div className="orders">
        <h2>Quản lý danh mục sản phẩm</h2>

        {/* Nút tạo mới */}
        <div className="orders_header">
          <button
            type="button"
            className="orders_header_button-create"
            onClick={() => navigate(ROUTERS.ADMIN.CREATECATEGORY)}
          >
            <IoIosAddCircleOutline /> <span>Tạo mới</span>
          </button>
        </div>

        {/* Trạng thái tải */}
        {loading && <p>Đang tải dữ liệu...</p>}
        {error && <p className="error-message">{error}</p>}

        {/* Bảng danh mục */}
        {!loading && !error && (
          <div className="orders_content">
            {categories.length === 0 ? (
              <p>Không tìm thấy danh mục nào!</p>
            ) : (
              <table className="orders_table">
                <thead>
                  <tr>
                    <th>Mã danh mục</th>
                    <th>Tên danh mục</th>
                    <th>Mô tả</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((item) => {
                    const id = item.categoryId;
                    return (
                      <tr key={id}>
                        <td>
                          <span
                            style={{
                              fontWeight: "bold",
                              color: "#007bff",
                              backgroundColor: "#f0f8ff",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "14px",
                            }}
                          >
                            {id}
                          </span>
                        </td>
                        <td>{item.name}</td>
                        <td>{item.description || item.decription || ""}</td>
                        <td>
                          <div className="orders_button">
                            {/* ĐÃ BỎ NÚT SỬA */}
                            <button
                              type="button"
                              className="orders_button-btn"
                              onClick={() => handleDelete(id)}
                              title="Xoá"
                              disabled={busyId === id}
                            >
                              <AiOutlineDelete />
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

        {/* Phân trang (placeholder) */}
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

export default memo(CategoryPage);
