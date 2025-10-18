import { memo, useState } from "react";
import "./style.scss";
import { Link, useNavigate } from "react-router-dom";
import { ROUTERS } from "utils/router";
import { AiOutlineHome } from "react-icons/ai";
import axios from "axios";

const USER_API    = process.env.REACT_APP_USER_API    || `http://${window.location.hostname}:7200`;

const RegisterPage = () => {
  const navigate = useNavigate();
    const userApi = axios.create({ baseURL: USER_API });

  const [user, setUser] = useState({
    username: "",
    password: "",
    email: "",
    phone: "",
    typeUser: "User", // ✅ cố định role mặc định
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Không cho sửa typeUser từ UI
    if (name === "typeUser") return;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Luôn ép role là "User" khi gửi
      const payload = { ...user, typeUser: "User" };
      await userApi.post("/api/User/register", payload);

      alert("Bạn đã đăng ký tài khoản thành công!");
      navigate(ROUTERS.ADMIN.LOGIN);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        "Đăng ký thất bại.";
      setError(String(msg));
      console.error("Lỗi khi tạo user:", err);
    }
  };

  const goToHome = () => navigate(ROUTERS.USER.HOMEPAGE);

  return (
    <div className="login">
      <div className="login_container">
        <div className="login_title">
          <AiOutlineHome className="login_home-icon" onClick={goToHome} />
          <h2>Đăng ký ngay</h2>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="login_form" onSubmit={handleSubmit}>
          {/* ✅ Thay dropdown bằng dòng text cố định */}
          <div className="login_form_group">
            <input type="hidden" name="typeUser" value="User" />
          </div>

          <div className="login_form_group">
            <label htmlFor="username" className="login_label">Họ và Tên</label>
            <input
              type="text"
              id="username"
              name="username"
              value={user.username}
              onChange={handleChange}
              required
              placeholder="Tên đăng nhập"
            />
          </div>

          <div className="login_form_group">
            <label htmlFor="password" className="login_label">Mật khẩu</label>
            <input
              type="password"
              id="password"
              name="password"
              value={user.password}
              onChange={handleChange}
              required
              placeholder="Mật khẩu"
            />
          </div>

          <div className="login_form_group">
            <label htmlFor="email" className="login_label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={user.email}
              onChange={handleChange}
              required
              placeholder="Email"
            />
          </div>

          <div className="login_form_group">
            <label htmlFor="phone" className="login_label">Số điện thoại</label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={user.phone}
              onChange={handleChange}
              required
              placeholder="Số điện thoại"
            />
          </div>

          <button type="submit" className="login_button">Đăng ký ngay</button>
        </form>

        <div className="login_text">
          <p>
            Bạn đã có tài khoản?{" "}
            <Link to={ROUTERS.ADMIN.LOGIN}>Đăng nhập ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default memo(RegisterPage);
