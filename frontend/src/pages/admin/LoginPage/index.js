import { memo, useState } from "react";
import "./style.scss";
import { Link, useNavigate } from "react-router-dom";
import { ROUTERS } from "utils/router";
import axios from "axios";
import { AiOutlineHome } from "react-icons/ai";
const USER_API    = process.env.REACT_APP_USER_API    || `http://${window.location.hostname}:7200`;

const LoginPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const userApi = axios.create({ baseURL: USER_API });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await userApi.post("/api/Auth/login", {
                username,
                password
            });

            const token = response.data.token;
            if (!token) {
                setError("Không nhận được token từ API.");
                setLoading(false);
                return;
            }

            localStorage.setItem('token', token);

            // Giải mã token để lấy thông tin người dùng
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            let role = decodedToken["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

            // Nếu role là mảng, lấy phần tử đầu
            if (Array.isArray(role)) {
                role = role[0];
            }

            const normalizedRole = role?.toLowerCase();

            if (normalizedRole === 'admin') {
                navigate(ROUTERS.ADMIN.DASHBOARD);
            } else if (normalizedRole === 'user') {
                navigate(ROUTERS.USER.HOMEPAGE);
            } else {
                setError("Role không hợp lệ trong token.");
            }

        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            setError(error.response?.data?.message || 'Đăng nhập thất bại. Kiểm tra lại tài khoản hoặc mật khẩu.');
        } finally {
            setLoading(false);
        }
    };
    // Hàm quay lại trang chủ
    const goToHome = () => {
        // Xóa token trong localStorage
        localStorage.removeItem('token'); // Xóa token đã lưu trong localStorage
    
        // Điều hướng về trang chủ
        navigate(ROUTERS.USER.HOMEPAGE);
    };
    

    return (
        <div className="login">
            <div className="login_container">
                
                <div className="login_title">
                    <AiOutlineHome className="login_home-icon" onClick={goToHome} />
                    <h2>Đăng nhập</h2>
                </div>
                <form className="login_form" onSubmit={handleSubmit}>
                    <div className="login_form_group">
                        <label htmlFor="username" className="login_label">Tên đăng nhập</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
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
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Mật khẩu"
                        />
                    </div>
                    <button type="submit" className="login_button" disabled={loading}>
                        {loading ? "Đang đăng nhập..." : "Đăng nhập ngay"}
                    </button>
                    {error && <div className="login_error">{error}</div>}
                </form>
                <div className="login_text">
                    <p>Bạn chưa có tài khoản? <Link to={ROUTERS.ADMIN.REGISTER} >Đăng ký ngay</Link></p>
                </div>
            </div>
        </div>
    );
};

export default memo(LoginPage);
