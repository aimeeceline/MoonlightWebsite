import { memo, useEffect, useState } from "react";
import axios from "axios";
import "./style.scss";
import { formatter } from "utils/fomatter";
import { AiOutlineDelete } from "react-icons/ai";
import { TbDetails } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { ROUTERS } from "utils/router";



const API_URL = "https://localhost:7033/api/Order/all-order"; 

const OrderPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const [checkedAll, setCheckedAll] = useState(false);
    const [checkedItems, setCheckedItems] = useState([]);
    
    // Gọi API để lấy danh sách đơn hàng
    const fetchOrders = async () => {
        try {
        const res = await axios.get(API_URL, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        setOrders(res.data);
        } catch (err) {
            console.error("Không thể tải danh sách đơn hàng", err);
            setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại.");
        } finally {
            setLoading(false);  
        }
    };

    // useEffect để gọi lần đầu
    useEffect(() => {
        fetchOrders();
    }, []);
    // Thực hiện xóa đơn hàng 
    const handleDelete = async (orderId) => {
        const confirmDelete = window.confirm(`Bạn có chắc muốn xóa đơn hàng #${orderId}?`);
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem("token");
            await axios.delete(`https://localhost:7033/api/Order/delete/${orderId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            alert("Xóa đơn hàng thành công!");
            // Gọi lại API để load danh sách đơn hàng mới
            fetchOrders();
        } catch (err) {
            alert("Không thể xóa đơn hàng!");
            console.error(err);
        }
    };

    // Bấm chọn tất cả
    const handleSelectAll = (e) => {
        const checked = e.target.checked;
        setCheckedAll(checked);
        setCheckedItems(checked ? orders.map(({ id }) => id) : []);
    };

    // Bấm chọn từng item
    const handleSelectItem = (id) => {
        if (checkedItems.includes(id)) {
        setCheckedItems(checkedItems.filter((itemId) => itemId !== id));
        } else {
        setCheckedItems([...checkedItems, id]);
        }
    };

    // Hàm trả về lớp CSS cho trạng thái
    const getStatusClass = (status) => {
        switch (status) {
            case 'Chờ xử lý':
                return 'status-pending';
            case 'Đang giao':
                return 'status-shipping';
            case 'Đã hoàn thành':
                return 'status-completed';
            case 'Đã hủy':
                return 'status-canceled';
            default:
                return '';
        }
    };
    
    
    return (
        <div className="container">
            <div className="orders">
                <h2>Quản lý đơn hàng</h2>

                {/* Hiển thị trạng thái tải dữ liệu */}
                {loading && <p>Đang tải dữ liệu...</p>}
                {error && <p className="error-message">{error}</p>}

                {!loading && !error && (
                    <div className="orders_content">
                        <table className="orders_table">
                            <thead>
                                <tr>
                                    <th>
                                        <input type="checkbox" checked={checkedAll} onChange={handleSelectAll} />
                                    </th>
                                    <th>Mã đơn hàng</th>
                                    <th>Người đặt hàng</th>
                                    <th>Tổng tiền</th>
                                    <th>Ngày đặt hàng</th>
                                    <th>Giảm giá</th>
                                    <th>Phí ship</th>
                                    <th>Trạng thái</th>
                                    <th>Hành động</th>
                                    
                                </tr>
                            </thead>
                            <tbody>
                            {
                                orders.length > 0 ? (
                                    orders.map((item, i) =>(
                                        <tr key={i}>
                                            <td>
                                            <input
                                                type="checkbox"
                                                checked={checkedItems.includes(item.id)}
                                                onChange={() => handleSelectItem(item.id)}
                                                />
                                            </td>
                                            <td>
                                                <span className="OrderID">#{item.orderId}</span>
                                            </td>
                                            <td>{item.username}</td>
                                            <td>{formatter(item.totalCost)}</td>
                                            <td>{new Date(item.createdDate).toLocaleDateString()}</td>
                                            <td>{item.discount}</td>
                                            <td>{item.ship}</td>
                                            <td className={`status-badge ${getStatusClass(item.status)}`}>
                                                {item.status}
                                                </td>
                                            <td>
                                                <div className="orders_button">
                                                    <button type="submit" className="orders_button-btn"
                                                    onClick={() => navigate(`${ROUTERS.ADMIN.DETAILORDERS}/${item.orderId}`)}
                                                    >
                                                        <TbDetails />
                                                    </button>
                                                    <button type="submit" className="orders_button-btn"
                                                    onClick={() => handleDelete(item.orderId)}
                                                    >
                                                        <AiOutlineDelete />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="5">Không có đơn hàng nào!</td></tr>
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

export default memo(OrderPage);
