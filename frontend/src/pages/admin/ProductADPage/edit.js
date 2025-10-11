import { memo, useEffect, useState } from "react";
import { IoChevronBackCircleSharp } from "react-icons/io5";
import "./create.scss";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTERS } from "utils/router";
import axios from "axios";

const OrderADEditPage = () => {
    const navigate = useNavigate();
    const {productId} = useParams();
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
    

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(`https://localhost:7007/api/Product/${productId}`);
                setProducts({
                    productId: response.data.productId,
                    categoryId: response.data.categoryId,
                    categoryName: response.data.categoryName,
                    name: response.data.name,
                    description: response.data.description,
                    descriptionDetails: response.data.descriptionDetails,
                    image: response.data.image,
                    image1: response.data.image1,
                    image2: response.data.image2,
                    image3: response.data.image3,
                    price:response.data.price,
                    inventory: response.data.inventory,
                    viewCount: response.data.viewCount,
                    createDate: response.data.createDate,
                    trang_thai: response.data.trang_thai,
                });
            } catch {
                console.error("Lỗi khi lấy thông tin sản phẩm");
            }
        };
        fetchProducts();
    }, [productId]);

    const handleChange = (e) => {
        if (e.target.type === "file") {
            setProducts({ ...products, [e.target.name]: e.target.files[0]});
        } else {
            setProducts({ ...products, [e.target.name]: e.target.value });
        }
    };
    const formatDate = (dateString) => {
        return dateString ? new Date(dateString).toISOString().split("T")[0] : "";
    };

    const handleSubmit = async (e) => {
            e.preventDefault();
            try {
                await axios.put(`https://localhost:7007/api/Product/${Number(productId)}`, products);
                alert("Cập nhật thành công!");
                navigate(ROUTERS.ADMIN.PRODUCTAD);
            } catch (err) {
                console.error("Lỗi khi cập nhật sản phẩm", err);
                alert("Cập nhật thất bại!");
            }
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
                        <h2>Cập nhật Sản phẩm</h2>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12 form">
                            <div className="checkout_input">
                                <label>
                                    Mã sản phẩm: <span className="required">(*)</span>
                                </label>
                                <input type="text" name="productId" placeholder="Nhập mã sản phẩm" value={products.productId} readOnly/>
                            </div>
                            <div className="checkout_input">
                                <label>
                                    Mã danh mục sản phẩm: <span className="required">(*)</span>
                                </label>
                                <input type="text" name="categoryId" placeholder="Nhập mã danh mục sản phẩm" value={products.categoryId} readOnly/>
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
                                <input type="text" name="image1" placeholder="Chọn ảnh" value={products.image1} onChange={handleChange}/>
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
                                <input type="text" name="image3" placeholder="Chọn ảnh" value={products.image3}  onChange={handleChange}/>
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
                            <span>Cập nhật</span>
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default memo(OrderADEditPage);
