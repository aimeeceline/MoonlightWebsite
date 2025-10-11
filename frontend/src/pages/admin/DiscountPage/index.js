import { memo, useEffect, useState } from "react";
import "./style.scss";
import axios from "axios";
import { formatter } from "utils/fomatter";
import { AiOutlineDelete } from "react-icons/ai";
import { TbDetails } from "react-icons/tb";
import { ROUTERS } from "utils/router";
import { useNavigate } from "react-router-dom";
const API_URL = "https://localhost:7070/api/Discount/all";

const DiscountPage = () => {
    const navigate = useNavigate();
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    
    useEffect(() => {
        const fetchDiscounts = async () => {
            try {
                const response = await axios.get(API_URL);
                setDiscounts(response.data);
            } catch (err) {
                setError("Không thể tải danh sách mã giảm giá!");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDiscounts();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa mã này?")) return;
        try {
            await axios.delete(`https://localhost:7070/api/Discount/Delete-discount/${id}`);
            alert("Xóa thành công!");
            // Cập nhật lại danh sách:
            setDiscounts(discounts.filter(d => d.discountId !== id));
        } catch (error) {
            console.error("Lỗi khi xóa:", error);
            alert("Xóa thất bại!");
        }
    };

    return (
        <div className="container">
            <div className="discount-container">
                <div className="discount-header">
                    <h2>Khuyến mãi</h2>
                    <button className="create-btn"
                    onClick={() => navigate(ROUTERS.ADMIN.DISCOUNTADCREATE)}
                    >+ Tạo khuyến mãi</button>
                </div>

                <div className="discount-filter">
                    <input type="text" placeholder="Nhập từ khóa tìm kiếm" />
                    <select>
                        <option value="">Trạng thái</option>
                        <option value="active">Đang khuyến mãi</option>
                        <option value="expired">Đã hết hạn</option>
                    </select>
                    <select>
                        <option value="">Hình thức</option>
                        <option value="code">Mã khuyến mãi</option>
                        <option value="program">Chương trình</option>
                    </select>
                </div>

                {loading ? (
                    <p>Đang tải...</p>
                ) : error ? (
                    <p className="error">{error}</p>
                ) : (
                    <table className="discount-table">
                        <thead>
                            <tr>
                                <th>Mã khuyến mại</th>
                                <th>Giảm (%)</th>
                                <th>Đơn tối thiểu (đ)</th>
                                <th>Ngày bắt đầu</th>
                                <th>Hết hạn</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {discounts.map((item, index) => (
                                <tr key={index}>
                                    <td>
                                        <strong>{item.code}</strong>
                                        <div className="desc">{item.description}</div>
                                    </td>
                                    <td>{item.discountValue}%</td>
                                    <td>{formatter(item.minOrderValue)}</td>
                                    <td>{new Date(item.dateStart).toLocaleDateString()}</td>
                                    <td>{new Date(item.expirationDate).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`status-dot ${item.status ? "green" : "red"}`}></span>
                                        {item.status ? "Đang khuyến mãi" : "Đã tắt"}
                                    </td>
                                    <td>
                                        <div className="orders_button">
                                            <button type="submit" className="orders_button-btn"
                                            onClick={() => navigate(`${ROUTERS.ADMIN.DISCOUNTADEDIT}/${item.discountId}`)}
                                            >
                                                <TbDetails />
                                            </button>
                                            <button type="submit" className="orders_button-btn"
                                            onClick={() => handleDelete(item.discountId)}
                                            >
                                                <AiOutlineDelete />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default memo(DiscountPage);
