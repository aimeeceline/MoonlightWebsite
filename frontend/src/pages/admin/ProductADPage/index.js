import { memo, useEffect, useState } from "react";
import "./style.scss";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";

import { IoIosAddCircleOutline } from "react-icons/io";
import { formatter } from "utils/fomatter";
import { ROUTERS } from "utils/router";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "https://localhost:7007/api/Product"; 
const ProductADPage = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState();
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null);  
   
   
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(API_URL);
                console.log(response.data);
                setProducts(response.data);
            } catch (err) {
                setError("Không thể tải danh sách sản phẩm!");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);
    

    // Xóa người dùng
    const handleDelete = async (productId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) return;


        try {
            await axios.delete(`https://localhost:7007/api/Product/${productId}`);
            alert("Xóa thành công!");
            window.location.reload(); // Reload danh sách sản phẩm sau khi xóa
        } catch {
            console.error("Lỗi khi xóa sản phẩm");
            alert("Xóa thất bại!");
        }
    }

    // Hàm trả về lớp CSS cho trạng thái
    const getStatusClass = (trang_thai) => {
        switch (trang_thai) {
            case 'Còn hàng':
                return 'con-hang';
            case 'Hết hàng':
                return 'het-hang';
            default:
                return '';
        }
    };
    return (
        <div className="container">
            <div className="orders">
                <h2>Quản lý sản phẩm</h2>
                {/* Nút tạo mới */}
                <div className="orders_header">
                    <button type="button" className="orders_header_button-create"
                    onClick={() => navigate(ROUTERS.ADMIN.PRODUCTADCREATE)}
                    >
                        <IoIosAddCircleOutline /> <span>Tạo mới</span>
                    </button>
                </div>
                

                {loading && <p>Đang tải dữ liệu....</p>}
                {error && <p className="error-message">{error}</p>}
                {!loading && !error && (
                    <div className="orders_content">
                    <table className="orders_table">
                        <thead>
                            <tr>
                                <th>Mã SP</th>
                                <th>Danh mục SP</th>
                                <th>Tên SP</th>
                                <th>Mô tả</th>
                                <th>Ảnh </th>
                                <th>Giá sản phẩm</th>
                                <th>Tồn kho</th>
                                <th>Lượt xem</th>
                                <th>Ngày tạo</th>
                                <th>Trạng thái</th>
                                <th>Hoạt động</th>
                            </tr>
                        </thead>
                        <tbody>
                        {
                            products.length > 0 ? (
                                products.map((item, i) =>(
                                    <tr key={item.productId || i}>
                                        <td>
                                        <span style={{
                                            fontWeight: "bold",
                                            color: "#007bff",
                                            backgroundColor: "#f0f8ff",
                                            padding: "4px 8px",
                                            borderRadius: "6px",
                                            fontSize: "14px"
                                        }}>
                                            #{item.productId}
                                        </span>
                                        </td>
                                        <td>{item.categoryName}</td>
                                        <td>{item.name}</td>
                                        <td>{item.description?.split(/\s+/).slice(0, 5).join(" ") + (item.description?.split(/\s+/).length > 5 ? "..." : "")}</td>

                                        <td>
                                            <img src={`https://localhost:7007/images/${item.image}`} alt={item.Name} />
                                        </td>

                                        <td>{formatter(item.price)}</td>
                                        <td>{item.inventory}</td>
                                        <td>{item.viewCount}</td>
                                        <td>{new Date(item.createDate).toLocaleDateString()}</td>
                                        <td className={`status ${getStatusClass(item.trang_thai)}`}>
                                            {item.trang_thai}
                                        </td>
                                        <td>
                                            <div className="orders_button">
                                                <button type="submit" className="orders_button-btn"
                                                onClick={() => navigate(`${ROUTERS.ADMIN.PRODUCTADEDIT}/${item.productId}`)}
                                                >
                                                    <AiOutlineEdit />
                                                </button>
                                                <button type="submit" className="orders_button-btn"
                                                    onClick={() => handleDelete(item.productId)}
                                                >
                                                    <AiOutlineDelete />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5">Không có sản phẩm nào!</td></tr>
                            )
                        }
                        </tbody>
                    </table>
                </div>
                )}
                

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
        </div>
    );
};

export default memo(ProductADPage);
