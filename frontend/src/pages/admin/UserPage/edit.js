import { memo, useEffect, useState } from "react";
import { IoChevronBackCircleSharp } from "react-icons/io5";
import "./create.scss";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTERS } from "utils/router";
import axios from "axios";

const UserADEditPage = () => {
    const navigate = useNavigate();
    const { userId } = useParams();
    const [user, setUser] = useState({
        userId: "",
        username: "",
        password: "",
        typeUser: "",
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get(`https://localhost:7200/api/User/${userId}`);
                setUser({
                    userId: response.data.userId,
                    username: response.data.username,
                    password: response.data.password,
                    typeUser: response.data.typeUser
                });
            } catch (err) {
                console.error("Lỗi khi lấy thông tin User", err);
            }
        };
        fetchUser();
    }, [userId]);

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`https://localhost:7200/api/User/Edit/${Number(userId)}`, user);
            alert("Cập nhật thành công!");
            navigate(ROUTERS.ADMIN.USERAD);
        } catch (err) {
            console.error("Lỗi khi cập nhật User", err);
            alert("Cập nhật thất bại!");
        }
    };

    return (
        <div className="container">
            <div className="create_category">
                <div className="create_category_back">
                    <button type="button" className="orders_header_button-create"
                        onClick={() => navigate(ROUTERS.ADMIN.USERAD)}
                    >
                        <IoChevronBackCircleSharp />
                    </button>
                </div>
                <div className="create_category_title">
                    <h2>Cập nhật người dùng</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12">
                        <div className="checkout_input">
                            <label>
                                Mã người dùng: <span className="required">(*)</span>
                            </label>
                            <input type="text" name="userId" value={user.userId} readOnly />
                        </div>
                        <div className="checkout_input">
                            <label>
                                Tên người dùng: <span className="required">(*)</span>
                            </label>
                            <input type="text" name="username" placeholder="Nhập tên người dùng" value={user.username} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12">
                        <div className="checkout_input1">
                            <label>
                                Password: <span className="required">(*)</span>
                            </label>
                            <input type="text" name="password" placeholder="Nhập Password" value={user.password} onChange={handleChange} />
                        </div>
                        <div className="checkout_input1">
                            <label>
                                Loại người dùng: <span className="required">(*)</span>
                            </label>
                            <input type="text" name="typeUser" placeholder="Nhập loại người dùng" value={user.typeUser} onChange={handleChange} />
                        </div>
                    </div>
                </div>
                <div className="create_category_back">
                    <button 
                        type="submit" 
                        className="orders_header_button-create"
                    >
                        <span>Cập nhật</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default memo(UserADEditPage);
