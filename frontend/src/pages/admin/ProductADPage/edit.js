import { memo, useEffect, useState } from "react";
import { IoChevronBackCircleSharp } from "react-icons/io5";
import "./create.scss";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTERS } from "utils/router";
import axios from "axios";

/* ===== BASE URL (ưu tiên .env, khớp protocol/host) ===== */
const PRODUCT_API =
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

const OrderADEditPage = () => {
  const navigate = useNavigate();
  const { productId } = useParams();

  const [products, setProducts] = useState({
    productId: "",
    categoryId: "",
    categoryName: "",
    name: "",
    description: "",
    descriptionDetails: "",
    image: "",
    image1: "",
    image2: "",
    image3: "",
    price: "",
    inventory: "",
    viewCount: "",
    createDate: "",
    trang_thai: "", // map từ status (bool) của BE
  });

  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toISOString().split("T")[0] : "";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await authAxios.get(`${PRODUCT_API}/api/Product/${productId}`);
        // ⚠️ BE trả wrapper: { product: { ... } }
        const p = res?.data?.product ?? res?.data ?? {};

        setProducts({
          productId: p.productId ?? "",
          categoryId: p.categoryId ?? "",
          categoryName: p.categoryName ?? "",
          name: p.name ?? "",
          description: p.description ?? "",
          descriptionDetails: p.descriptionDetails ?? "",
          image: p.image ?? "",
          image1: p.image1 ?? "",
          image2: p.image2 ?? "",
          image3: p.image3 ?? "",
          price: p.price ?? "",
          inventory: p.inventory ?? "",
          viewCount: p.viewCount ?? "",
          createDate: p.createDate ?? "",
          // BE: status (boolean) → UI đang dùng text trang_thai
          trang_thai: typeof p.status === "boolean" ? String(p.status) : (p.trang_thai ?? ""),
        });
      } catch (err) {
        console.error("Lỗi khi lấy thông tin sản phẩm", err);
        alert("Không thể tải sản phẩm.");
      }
    };
    fetchProducts();
  }, [productId]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setProducts((prev) => ({ ...prev, [name]: files?.[0] ?? null }));
    } else {
      setProducts((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Chuẩn hóa payload đúng kiểu BE
      const payload = {
        categoryId: Number(products.categoryId),
        name: products.name,
        description: products.description,
        descriptionDetails: products.descriptionDetails,
        image: products.image,
        image1: products.image1,
        image2: products.image2,
        image3: products.image3,
        price: Number(products.price),
        inventory: Number(products.inventory),
        viewCount: Number(products.viewCount || 0),
        createDate: products.createDate || null,
        status:
          products.trang_thai === "true" ||
          products.trang_thai === true ||
          products.trang_thai === "Active", // map ngược về boolean nếu BE cần
      };

      await authAxios.put(`${PRODUCT_API}/api/Product/${Number(productId)}`, payload);
      alert("Cập nhật thành công!");
      navigate(ROUTERS.ADMIN.PRODUCTAD);
    } catch (err) {
      console.error("Lỗi khi cập nhật sản phẩm", err);
      alert("Cập nhật thất bại!");
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
              onClick={() => navigate(ROUTERS.ADMIN.PRODUCTAD)}
            >
              <IoChevronBackCircleSharp />
            </button>
          </div>
          <div className="create_category_title">
            <h2>Cập nhật Sản phẩm</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12 form">
              <div className="checkout_input">
                <label>Mã sản phẩm:</label>
                <input type="text" name="productId" value={products.productId} readOnly />
              </div>

              <div className="checkout_input">
                <label>Mã danh mục sản phẩm: <span className="required">(*)</span></label>
                <input type="text" name="categoryId" value={products.categoryId} readOnly />
              </div>

              <div className="checkout_input">
                <label>Tên sản phẩm: <span className="required">(*)</span></label>
                <input type="text" name="name" value={products.name} onChange={handleChange} />
              </div>

              <div className="checkout_input">
                <label>Mô tả:</label>
                <textarea name="description" value={products.description} onChange={handleChange} />
              </div>

              <div className="checkout_input">
                <label>Mô tả chi tiết:</label>
                <textarea
                  name="descriptionDetails"
                  value={products.descriptionDetails}
                  onChange={handleChange}
                />
              </div>

              <div className="checkout_input">
                <label>Ảnh:</label>
                <input type="text" name="image" value={products.image} onChange={handleChange} />
              </div>

              <div className="checkout_input">
                <label>Ảnh 1:</label>
                <input type="text" name="image1" value={products.image1} onChange={handleChange} />
              </div>
            </div>

            <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12">
              <div className="checkout_input1">
                <label>Ảnh 2:</label>
                <input type="text" name="image2" value={products.image2} onChange={handleChange} />
              </div>

              <div className="checkout_input1">
                <label>Ảnh 3:</label>
                <input type="text" name="image3" value={products.image3} onChange={handleChange} />
              </div>

              <div className="checkout_input1">
                <label>Giá sản phẩm: <span className="required">(*)</span></label>
                <input
                  type="text"
                  name="price"
                  placeholder="Ví dụ: 1200000"
                  value={products.price}
                  onChange={handleChange}
                />
              </div>

              <div className="checkout_input1">
                <label>Tồn kho: <span className="required">(*)</span></label>
                <input
                  type="text"
                  name="inventory"
                  placeholder="Ví dụ: 10"
                  value={products.inventory}
                  onChange={handleChange}
                />
              </div>

              <div className="checkout_input1">
                <label>Lượt xem:</label>
                <input
                  type="text"
                  name="viewCount"
                  placeholder="0"
                  value={products.viewCount}
                  onChange={handleChange}
                />
              </div>

              <div className="checkout_input1">
                <label>Ngày tạo:</label>
                <input
                  type="date"
                  name="createDate"
                  value={formatDate(products.createDate)}
                  onChange={handleChange}
                />
              </div>

              <div className="checkout_input1">
                <label>Trạng thái:</label>
                {/* đang giữ text để không phá UI hiện tại; có thể đổi thành select/checkbox */}
                <input
                  type="text"
                  name="trang_thai"
                  placeholder='true/false hoặc Active/Inactive'
                  value={products.trang_thai}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="create_category_back">
            <button type="submit" className="orders_header_button-create">
              <span>Cập nhật</span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default memo(OrderADEditPage);
