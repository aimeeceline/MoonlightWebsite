import { memo, useState } from "react";
import { IoChevronBackCircleSharp } from "react-icons/io5";
import "./create.scss";
import { useNavigate } from "react-router-dom";
import { ROUTERS } from "utils/router";
import axios from "axios";

const CategoryCreatePage = () => {
    const navigate = useNavigate();
    const [category, setCategory] = useState({

            categoryId :"",
            name:"",
            decription:""
    });
    
    // Xử lý sự kiện thay đổi dữ liệu nhập vào

    const handleChange = (e) => {
        setCategory({...category, [e.target.name]: e.target.value});
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("https://localhost:7007/api/Category", category);
            alert("Thêm mới thành công!");
            navigate(ROUTERS.ADMIN.CATEGORIES); 
        } catch {
            console.error("Lỗi khi tạo danh mục");
            alert("Thêm mới thất bại!");
        }
    }

    // Thực hiện gửi dữ liệu lên API
    return (
        <>
            <div className="container">
                <div className="create_category">
                    <div className="create_category_back">
                        <button type="button" className="orders_header_button-create" 
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
                                <label>
                                    Mã danh mục: <span className="required">(*)</span>
                                </label>
                                <input type="text" name="categoryId" placeholder="Nhập mã danh mục" value={category.categoryId} onChange={handleChange}/>
                            </div>
                            <div className="checkout_input">
                                <label>
                                    Tên danh mục: <span className="required">(*)</span>
                                </label>
                                <input type="text" name="name" placeholder="Nhập tên danh mục" value={category.name} onChange={handleChange}/>
                            </div>
                            <div className="checkout_input">
                                <label>
                                    Mô tả: 
                                </label>
                                <textarea placeholder="Nhập mô tả..." name="decription" value={category.decription} onChange={handleChange}/>
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

export default memo(CategoryCreatePage);
