// src/pages/Admin/DiscountPage/index.jsx
import { memo, useEffect, useMemo, useState, useCallback } from "react";
import "./style.scss";
import axios from "axios";
import { formatter } from "utils/fomatter";
import { AiOutlineDelete } from "react-icons/ai";
import { TbDetails } from "react-icons/tb";
import { ROUTERS } from "utils/router";
import { useNavigate } from "react-router-dom";

/* ===== BASE URL (ưu tiên .env, khớp protocol/host) ===== */
const DISCOUNT_API =
  process.env.REACT_APP_DISCOUNT_API ||
  `${window.location.protocol}//${window.location.hostname}:7088`;

const API_ALL = `${DISCOUNT_API}/api/Discount/all`;
const API_DELETE = (id) => `${DISCOUNT_API}/api/Discount/Delete-discount/${id}`;

/* ===== Auth axios (nếu API yêu cầu JWT) ===== */
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

/* ===== Helpers ===== */
const isActiveNow = (d) => {
  // active khi: d.status === true và now nằm trong [dateStart, expirationDate]
  const now = Date.now();
  const start = d.dateStart ? new Date(d.dateStart).getTime() : 0;
  const end = d.expirationDate ? new Date(d.expirationDate).getTime() : 0;
  const statusBool =
    typeof d.status === "boolean" ? d.status : String(d.status).toLowerCase() === "true";
  return Boolean(statusBool && now >= start && (end === 0 || now <= end));
};

const normalizeList = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.discounts)) return raw.discounts;
  if (Array.isArray(raw?.items)) return raw.items;
  return [];
};

const DiscountPage = () => {
  const navigate = useNavigate();

  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // filter UI state
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "", "active", "expired"

  // Fetch
  const fetchDiscounts = useCallback(async () => {
    try {
      const res = await authAxios.get(API_ALL);
      setDiscounts(normalizeList(res.data));
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách mã giảm giá!");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa mã này?")) return;
    try {
      await authAxios.delete(API_DELETE(id));
      setDiscounts((prev) => prev.filter((d) => d.discountId !== id));
      alert("Xóa thành công!");
    } catch (err) {
      console.error("Lỗi khi xóa:", err);
      alert("Xóa thất bại!");
    }
  };

  // Client filters + sort: active lên đầu, expired/tắt xuống cuối; tie-break theo expirationDate gần nhất
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const list = discounts.filter((d) => {
      const byKw =
        kw.length === 0 ||
        (d.code ?? "").toLowerCase().includes(kw) ||
        (d.description ?? "").toLowerCase().includes(kw);
      const active = isActiveNow(d);
      const byStatus =
        statusFilter === ""
          ? true
          : statusFilter === "active"
          ? active
          : !active; // "expired"

      return byKw && byStatus;
    });

    return list
      .slice()
      .sort((a, b) => {
        const aa = isActiveNow(a) ? 1 : 0;
        const bb = isActiveNow(b) ? 1 : 0;
        if (bb !== aa) return bb - aa; // active trước
        const ta = a.expirationDate ? new Date(a.expirationDate).getTime() : 0;
        const tb = b.expirationDate ? new Date(b.expirationDate).getTime() : 0;
        return tb - ta; // sắp theo ngày hết hạn (gần nhất trước)
      });
  }, [discounts, keyword, statusFilter]);

  return (
    <div className="container">
      <div className="discount-container">
        <div className="discount-header">
          <h2>Khuyến mãi</h2>
          <button
            className="create-btn"
            onClick={() => navigate(ROUTERS.ADMIN.DISCOUNTADCREATE)}
          >
            + Tạo khuyến mãi
          </button>
        </div>

        <div className="discount-filter">
          <input
            type="text"
            placeholder="Nhập từ khóa tìm kiếm (mã, mô tả)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang khuyến mãi</option>
            <option value="expired">Hết hạn/Đã tắt</option>
          </select>
        </div>

        {loading ? (
          <p>Đang tải...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <table className="discount-table">
            <thead>
              <tr>
                <th>Mã khuyến mại</th>
                <th>Giảm (%)</th>
                <th>Đơn tối thiểu (đ)</th>
                <th>Ngày bắt đầu</th>
                <th>Hết hạn</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const active = isActiveNow(item);
                return (
                  <tr key={item.discountId} className={active ? "" : "row-inactive"}>
                    <td>
                      <strong>{item.code}</strong>
                      {item.description && (
                        <div className="desc">{item.description}</div>
                      )}
                    </td>
                    <td>{item.discountValue}%</td>
                    <td>{formatter(item.minOrderValue || 0)}</td>
                    <td>
                      {item.dateStart
                        ? new Date(item.dateStart).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      {item.expirationDate
                        ? new Date(item.expirationDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <span
                        className={`status-dot ${active ? "green" : "red"}`}
                        title={active ? "Đang khuyến mãi" : "Hết hạn/Đã tắt"}
                      />
                      {active ? "Đang khuyến mãi" : "Hết hạn/Đã tắt"}
                    </td>
                    <td>
                      <div className="orders_button">
                        <button
                          type="button"
                          className="orders_button-btn"
                          onClick={() =>
                            navigate(`${ROUTERS.ADMIN.DISCOUNTADEDIT}/${item.discountId}`)
                          }
                          title="Chi tiết/Sửa"
                        >
                          <TbDetails />
                        </button>
                        <button
                          type="button"
                          className="orders_button-btn"
                          onClick={() => handleDelete(item.discountId)}
                          title="Xóa"
                        >
                          <AiOutlineDelete />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center" }}>
                    Không có khuyến mãi phù hợp!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default memo(DiscountPage);
