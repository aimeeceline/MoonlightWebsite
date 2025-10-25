// src/pages/Admin/CategoryCreate/index.jsx
import { memo, useState } from "react";
import { IoChevronBackCircleSharp } from "react-icons/io5";
import "./create.scss";
import { useNavigate } from "react-router-dom";
import { ROUTERS } from "utils/router";
import axios from "axios";

/* ===== BASE URL (ưu tiên .env, khớp protocol/host) ===== */
const CATEGORY_API =
  process.env.REACT_APP_PRODUCT_API ||
  `${window.location.protocol}//${window.location.hostname}:7007`;

/* ===== Auth axios ===== */
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

const CategoryCreatePage = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState({
    categoryId: "",
    name: "",
    description: "", // dùng description trong state, map sang decription khi gửi
  });

  // Xử lý sự kiện thay đổi dữ liệu nhập vào
  const handleChange = (e) => {
    const { name, value } = e.target;
    // textarea đang dùng name="decription" -> map về state.description
    const key = name === "decription" ? "description" : name;
    setCategory((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!category.name.trim()) {
      alert("Tên danh mục không được để trống.");
      return;
    }

    // Payload: BE của bạn dùng key "decription" (typo) -> map đúng
    const payload = {
      name: category.name,
      decription: category.description, // 👈 quan trọng
      ...(category.categoryId
        ? { categoryId: Number(category.categoryId) }
        : {}), // nếu BE tự sinh ID, bỏ trống trường này
    };

    try {
      setSaving(true);
      await authAxios.post(`${CATEGORY_API}/api/Category`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      alert("Thêm mới thành công!");
      navigate(ROUTERS.ADMIN.CATEGORIES);
    } catch (err) {
      console.error("Lỗi khi tạo danh mục", err);
      alert("Thêm mới thất bại!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="container">
        <div className="create_category">
          <div className="create_category_back">
            <button
              type="button"
              className="orders_header_button-create"
              onClick={() => navigate(ROUTERS.ADMIN.CATEGORIES)}
            >
              <IoChevronBackCircleSharp />
            </button>
          </div>
          <div className="create_category_title">
            <h2>Thêm danh mục mới</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12 form">
              <div className="checkout_input">
                <label>Mã danh mục:</label>
                <input
                  type="text"
                  name="categoryId"
                  placeholder="(Để trống nếu hệ thống tự sinh)"
                  value={category.categoryId}
                  onChange={handleChange}
                />
              </div>

              <div className="checkout_input">
                <label>
                  Tên danh mục: <span className="required">(*)</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Nhập tên danh mục"
                  value={category.name}
                  onChange={handleChange}
                />
              </div>

              <div className="checkout_input">
                <label>Mô tả:</label>
                <textarea
                  placeholder="Nhập mô tả..."
                  name="decription"          // giữ nguyên name cũ để không ảnh hưởng style/selector
                  value={category.description}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="create_category_back">
            <button type="submit" className="orders_header_button-create" disabled={saving}>
              <span>{saving ? "Đang lưu..." : "Thêm mới"}</span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default memo(CategoryCreatePage);
