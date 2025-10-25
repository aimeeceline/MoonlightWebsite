// src/pages/Admin/theme/HeaderAD/index.jsx
import React, { useState, useEffect } from "react";
import {
  AiOutlineBell,
  AiOutlineMail,
  AiOutlineSearch,
  AiOutlineSetting,
  AiOutlineUser,
} from "react-icons/ai";
import { FaBars } from "react-icons/fa";
import axios from "axios";
import "./style.scss";

/* ===== BASE URL (ưu tiên .env, khớp protocol/host hiện tại) ===== */
const USER_API =
  process.env.REACT_APP_USER_API ||
  `${window.location.protocol}//${window.location.hostname}:7200`;

/* ===== Auth axios ===== */
const normalizeBearer = () => {
  const raw = localStorage.getItem("token");
  if (!raw) return null;
  return raw.startsWith("Bearer ") ? raw : `Bearer ${raw}`;
};

const authAxios = axios.create();
authAxios.interceptors.request.use((config) => {
  const bearer = normalizeBearer();
  if (bearer) {
    config.headers = { ...(config.headers || {}), Authorization: bearer };
  }
  return config;
});

const HeaderAD = ({ toggleSidebar }) => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  // Gọi API lấy thông tin người dùng
  useEffect(() => {
    const controller = new AbortController();

    const getUserInfo = async () => {
      try {
        const bearer = normalizeBearer();
        if (!bearer) {
          // Chưa đăng nhập
          setUsername("Admin");
          return;
        }

        const res = await authAxios.get(`${USER_API}/api/Auth/me`, {
          signal: controller.signal,
        });

        // Phòng trường hợp BE trả các key khác nhau
        const data = res?.data || {};
        const name =
          data.username ||
          data.fullName ||
          data.name ||
          data.email ||
          "Admin";

        setUsername(name);
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error("Error fetching user info:", err);
        setUsername("Admin");
      } finally {
        setLoading(false);
      }
    };

    getUserInfo();
    return () => controller.abort();
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <FaBars className="menu-icon" onClick={toggleSidebar} />
        <div className="logo">MoonlightAdmin</div>

        <nav className="nav-search">
          <input type="text" placeholder="Tìm kiếm..." />
          <button className="search-btn">
            <AiOutlineSearch />
          </button>
        </nav>
      </div>

      <div className="header-right">
        <AiOutlineBell className="icon" />
        <AiOutlineMail className="icon" />
        <AiOutlineSetting className="icon" />

        <div className="user-info">
          <div className="user-avatar">
            <AiOutlineUser className="icon" />
          </div>
          <span className="user-name">
            {loading ? "..." : username}
          </span>
        </div>
      </div>
    </header>
  );
};

export default HeaderAD;
