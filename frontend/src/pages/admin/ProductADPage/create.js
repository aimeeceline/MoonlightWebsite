import { memo, useState } from "react";
import { IoChevronBackCircleSharp } from "react-icons/io5";
import "./create.scss";
import { useNavigate } from "react-router-dom";
import { ROUTERS } from "utils/router";
import axios from "axios";

const ProductADCreatePage = () => {
    const navigate = useNavigate();
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
            price:"",
            inventory: "",
            viewCount: "",
            createDate: "",
            trang_thai: "",
    });


    const handleChange = (e) => {
            setProducts({ ...products, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("https://localhost:7007/api/Product", products);
            alert("Thêm mới thành công!");
            navigate(ROUTERS.ADMIN.PRODUCTAD);
        } catch (e) {
            console.error("Lỗi khi thêm mới sản phẩm", e);
            alert("Thêm mới thất bại!");
        }
    }
    const formatDate = (dateString) => {
        return dateString ? new Date(dateString).toISOString().split("T")[0] : "";
    };
    
    return (
        <>
            <div className="container">
                <div className="create_category">
                    <div className="create_category_back">
                        <button type="button" className="orders_header_button-create" 
                        onClick={() => navigate(ROUTERS.ADMIN.PRODUCTAD)}
                        >
                            <IoChevronBackCircleSharp /> 
                        </button>
                    </div>
                    <div className="create_category_title">
                        <h2>Thêm sản phẩm mới</h2>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12 form">
                            <div className="checkout_input">
                                <label>
                                    Mã sản phẩm: <span className="required">(*)</span>
                                </label>
                                <input type="text" name="productId" placeholder="Nhập mã sản phẩm" value={products.productId} onChange={handleChange}/>
                            </div>
                            <div className="checkout_input">
                                <label>
                                    Mã danh mục sản phẩm: <span className="required">(*)</span>
                                </label>
                                <input type="text" name="categoryId" placeholder="Nhập mã danh mục sản phẩm" value={products.categoryId} onChange={handleChange}/>
                            </div>
                            <div className="checkout_input">
                                <label>
                                    Tên sản phẩm: <span className="required">(*)</span>
                                </label>
                                <input type="text" name="name" placeholder="Nhập Tên sản phẩm" value={products.name} onChange={handleChange}/>
                            </div>
                            <div className="checkout_input">
                                <label>
                                    Mô tả: 
                                </label>
                                <textarea placeholder="Nhập mô tả..." name="description" value={products.description} onChange={handleChange}/>
                            </div>
                            <div className="checkout_input">
                                <label>
                                    Mô tả chi tiết: 
                                </label>
                                <textarea placeholder="Nhập mô tả chi tiết..." name="descriptionDetails" value={products.descriptionDetails} onChange={handleChange} />
                            </div>
                            <div className="checkout_input">
                                <label>
                                    Ảnh: <span className="required">(*)</span>
                                </label>
                                <input type="text" name="image" placeholder="Chọn ảnh" value={products.image} onChange={handleChange}/>
                            </div>
                            <div className="checkout_input">
                                <label>
                                    Ảnh 1: <span className="required">(*)</span>
                                </label>
                                <input type="text" name="image1" placeholder="Chọn ảnh" value={products.image1}  onChange={handleChange}/>
                            </div>
                        </div>
                        <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12">
                            
                            <div className="checkout_input1">
                                <label>
                                    Ảnh 2: <span className="required">(*)</span>
                                </label>
                                <input type="text" name="image2" placeholder="Chọn ảnh" value={products.image2} onChange={handleChange}/>
                            </div>
                            <div className="checkout_input1">
                                <label>
                                    Ảnh 3: <span className="required">(*)</span>
                                </label>
                                <input type="text" name="image3" placeholder="Chọn ảnh" value={products.image3}   onChange={handleChange}/>
                            </div>
                            <div className="checkout_input1">
                                <label>
                                    Giá sản phẩm: <span className="required">(*)</span>
                                </label>
                                <input type="text" name="price" placeholder="Nhập Giá sản phẩm" value={products.price} onChange={handleChange}/>
                            </div>
                            <div className="checkout_input1">
                                <label>
                                    Tồn kho: <span className="required">(*)</span>
                                </label>
                                <input type="text" name="inventory" placeholder="Nhập Tồn kho" value={products.inventory} onChange={handleChange}/>
                            </div>
                            <div className="checkout_input1">
                                <label>
                                    Lượt xem: <span className="required">(*)</span>
                                </label>
                                <input type="text" name="viewCount" placeholder="Nhập Lượt xem" value={products.viewCount} onChange={handleChange}/>
                            </div>
                            <div className="checkout_input1">
                                <label>
                                    Ngày tạo: <span className="required">(*)</span>
                                </label>
                                <input
                                    type="date"
                                    name="createDate"
                                    value={formatDate(products.createDate)}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="checkout_input1">
                                <label>
                                    Trạng thái: <span className="required">(*)</span>
                                </label>
                                <input type="text" name="trang_thai" placeholder="Nhập Trạng thái" value={products.trang_thai} onChange={handleChange}/>
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

export default memo(ProductADCreatePage);
