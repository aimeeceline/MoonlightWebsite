import { memo, useEffect, useState } from "react";
import { IoChevronBackCircleSharp } from "react-icons/io5";
import "./create.scss";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTERS } from "utils/router";
import axios from "axios";

const CategoryEditPage = () => {
    const navigate = useNavigate();
    const {categoryId} = useParams();
    const [category, setCategory] = useState({
    
        categoryId :"",
        name:"",
        decription:"",
    });

    useEffect (() => {
        const fetchCategory = async () => {
            try {
                const response = await axios.get(`https://localhost:7007/api/Category/${categoryId}`)
                setCategory ({
                    categoryId : response.data.categoryId,
                    name:response.data.name,
                    decription:response.data.decription
                });
            } catch (err) {
                console.error("Lỗi khi tải thông tin danh mục:", err);
            }
        };
        fetchCategory();
    }, [categoryId]);
   
    const handleChange = (e) => {
        setCategory({ ...category, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`https://localhost:7007/api/Category/${Number(categoryId)}`, category);
            alert("Cập nhật thành công!");
            navigate(ROUTERS.ADMIN.CATEGORIES);
        } catch (err) {
            console.error("Lỗi khi cập nhật danh mục", err);
            alert("Cập nhật thất bại!");
        }
    };
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
                        <h2>Cập nhật lại danh mục</h2>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12 form">
                            <div className="checkout_input">
                                <label>
                                    Mã danh mục: <span className="required">(*)</span>
                                </label>
                                <input type="text" name="categoryId" placeholder="Nhập mã danh mục" value={category.categoryId} readOnly/>
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
                            <span>Cập nhật</span>
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default memo(CategoryEditPage);
