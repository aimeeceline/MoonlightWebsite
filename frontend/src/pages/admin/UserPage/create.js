import { memo, useState } from "react";
import { IoChevronBackCircleSharp } from "react-icons/io5";
import "./create.scss";
import { useNavigate } from "react-router-dom";
import { ROUTERS } from "utils/router";
import axios from "axios";

const UserADCreatePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
            username: "",
            password: "",
            typeUser: "",
    });

    const handleChange = (e) => {
        setUser({...user, [e.target.name]: e.target.value });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("https://localhost:7200/api/User/Create", user);
            alert("Tạo mới thành công!");
            navigate(ROUTERS.ADMIN.USERAD); // Chuyển về danh sách User
        } catch (error) {
            console.error("Lỗi khi tạo user:", error);
        }
    };
   
    
    return (
        <>
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
                        <h2>Thêm người dùng mới</h2>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-lg-10 col-md-12 col-sm-12 col-xs-12 form">
                            <div className="checkout_input">
                                <label>
                                    Tên người dùng: <span className="required">(*)</span>
                                </label>
                                <input type="text" name = "username" placeholder="Nhập tên người dùng" value={user.username} onChange={handleChange}/>
                            </div>
                            <div className="checkout_input">
                                <label>
                                    Password: <span className="required">(*)</span>
                                </label>
                                <input type="text" name = "password" placeholder="Nhập Password" value={user.password} onChange={handleChange}/>
                            </div>
                            <div className="checkout_input">
                                <label>
                                    Loại người dùng: <span className="required">(*)</span>
                                </label>
                                <input type="text" name = "typeUser" placeholder="Nhập loại người dùng" value={user.typeUser} onChange={handleChange}/>
                            </div>
                        </div>
                    </div>
                    <div className="create_category_back">
                        <button type="submit" className="orders_header_button-create" 
                        >
                            <span>Thêm mới</span>
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default memo(UserADCreatePage);