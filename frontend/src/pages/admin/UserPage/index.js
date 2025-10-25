// src/pages/Admin/UserPage/index.jsx
import { memo, useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./style.scss";
import { IoIosAddCircleOutline } from "react-icons/io";
import { AiOutlineUnlock, AiOutlineLock } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { ROUTERS } from "utils/router";

/* ===== BASE URL (ưu tiên .env, khớp protocol/host) ===== */
const USER_API =
  process.env.REACT_APP_USER_API ||
  `${window.location.protocol}//${window.location.hostname}:7200`;

const API_ALL_USERS = `${USER_API}/api/User/all`;
const API_TOGGLE_ACTIVE = (id, v) => `${USER_API}/api/User/toggle-active/${id}?active=${v}`;
const API_USER_BY_ID = (id) => `${USER_API}/api/User/${id}`;
const API_EDIT = (id) => `${USER_API}/api/User/Edit/${id}`;

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

/* ===== Utils (đọc id/active, fallback key casing) ===== */
const getId = (u) => u.userId ?? u.userID ?? u.id;
const getActive = (u) => Boolean(u.isActive ?? u.IsActive ?? false);
const getUserSafe = (data) => data?.user ?? data ?? {};

const UserPage = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [checkedAll, setCheckedAll] = useState(false);
  const [checkedItems, setCheckedItems] = useState([]); // userIds
  const [busyId, setBusyId] = useState(null); // chống double click

  /* ===== Fetch list ===== */
  const fetchUsers = useCallback(async () => {
    try {
      const res = await authAxios.get(API_ALL_USERS);
      const list = Array.isArray(res.data) ? res.data : (res.data?.users ?? []);
      setUsers(list);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách người dùng!");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* ===== Đặt trạng thái tường minh (true/false) với fallback Edit ===== */
  const setActive = async (userId, value) => {
    // 1) thử endpoint toggle-active nếu BE hỗ trợ query ?active
    try {
      await authAxios.put(API_TOGGLE_ACTIVE(userId, value));
      return;
    } catch (e1) {
      // 2) fallback: GET rồi PUT Edit với isActive = value
      const { data } = await authAxios.get(API_USER_BY_ID(userId));
      const u = getUserSafe(data);

      const payload = {
        userId: u.userId ?? userId,
        username: u.username ?? u.userName ?? "",
        typeUser: u.typeUser ?? u.role ?? "",
        email: u.email ?? u.Email ?? "",
        phone: u.phone ?? u.PhoneNumber ?? "",
        isActive: value,
        IsActive: value, // kèm cả 2 casing nếu BE map khác
      };

      await authAxios.put(API_EDIT(userId), payload, {
        headers: { "Content-Type": "application/json" },
      });
    }
  };

  /* ===== Toggle click ===== */
  const handleToggleActive = async (user) => {
    const id = getId(user);
    const current = getActive(user);
    const next = !current;
    const label = next ? "Kích hoạt" : "Vô hiệu";

    if (!window.confirm(`${label} người dùng #${id}?`)) return;

    try {
      setBusyId(id);
      await setActive(id, next);
      await fetchUsers(); // đồng bộ UI với DB
      alert(`${label} thành công!`);
    } catch (err) {
      console.error("Đổi isActive thất bại:", err);
      alert("Thao tác thất bại! Kiểm tra yêu cầu payload của BE.");
    } finally {
      setBusyId(null);
    }
  };

  /* ===== Chọn tất cả / từng dòng ===== */
  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setCheckedAll(checked);
    setCheckedItems(checked ? users.map(getId) : []);
  };
  const handleSelectItem = (userId) => {
    setCheckedItems((prev) =>
      prev.includes(userId) ? prev.filter((x) => x !== userId) : [...prev, userId]
    );
  };
  useEffect(() => {
    setCheckedAll(users.length > 0 && checkedItems.length === users.length);
  }, [checkedItems, users]);

  return (
    <div className="container">
      <div className="orders">
        <h2>Quản lý User</h2>

        {/* Nút tạo mới */}
        <div className="orders_header">
          <button
            type="button"
            className="orders_header_button-create"
            onClick={() => navigate(ROUTERS.ADMIN.USERADCREATE)}
          >
            <IoIosAddCircleOutline /> <span>Tạo mới</span>
          </button>
        </div>

        {loading && <p>Đang tải dữ liệu...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && (
          <div className="orders_content">
            {users.length === 0 ? (
              <p>Không có người dùng nào!</p>
            ) : (
              <table className="orders_table">
                <thead>
                  <tr>                    
                    <th>Mã người dùng</th>
                    <th>Tên người dùng</th>
                    <th>Email</th>
                    <th>Số điện thoại</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => {
                    const id = getId(item);
                    const active = getActive(item);
                    const username = item.username ?? item.userName ?? "—";
                    const email = item.email ?? item.Email ?? "—";
                    const phone = item.phone ?? item.PhoneNumber ?? "—";

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

                        <td>{username}</td>
                        <td>{email}</td>
                        <td>{phone}</td>

                        <td>
                          <span
                            className={`status-badge ${active ? "status-completed" : "status-canceled"}`}
                          >
                            {active ? "Hoạt động" : "Vô hiệu"}
                          </span>
                        </td>

                        <td>
                          <div className="orders_button">
                            <button
                              type="button"
                              className="orders_button-btn"
                              onClick={() => handleToggleActive(item)}
                              title={active ? "Vô hiệu hóa" : "Kích hoạt"}
                              disabled={busyId === id}
                            >
                              {active ? <AiOutlineLock /> : <AiOutlineUnlock />}
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
      </div>

      {/* Phân trang placeholder */}
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
  );
};

export default memo(UserPage);
