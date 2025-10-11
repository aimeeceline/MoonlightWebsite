import React, { memo, useEffect, useState } from "react";
import axios from "axios";
import "./orderdetail.scss";
import { ROUTERS } from "utils/router";
import { useNavigate, useParams } from "react-router-dom";
import { IoChevronBackCircleSharp } from "react-icons/io5";
import { AiOutlineEdit } from "react-icons/ai";
import { formatter } from "utils/fomatter";

const OrderDetail = () => {
    const navigate = useNavigate();
    const { orderId } = useParams(); // Lấy orderId từ URL
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                const token = localStorage.getItem("token"); // Lấy token nếu có xác thực
                const res = await axios.get(`https://localhost:7033/api/Order/detail/${orderId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setOrder(res.data);
            } catch (err) {
                setError("Không thể tải chi tiết đơn hàng!");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetail();
    }, [orderId]);

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
    <div className="order-detail-container">
        <div className="order-header">
            <button type="button" className="orders_header_button-create" 
                onClick={() => navigate(ROUTERS.ADMIN.ORDERS)}
                >
                    <IoChevronBackCircleSharp /> 
                </button>
                <button type="button" className="orders_header_button-create"
                onClick={() => navigate(`${ROUTERS.ADMIN.EDITORDERS}/${orderId}`)}
                >
                    <AiOutlineEdit />
            </button>
        </div>
    {loading && <p>Đang tải dữ liệu...</p>}
    {error && <p className="error-message">{error}</p>}
    {order && (
        <>
            <div className="order-title">
                <h2>Chi tiết đơn hàng</h2>
                <span className="orderItemId">#{order.items[0]?.orderItemId}</span>
            </div>
            <div className="row">
                <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12">
                    <div className="section">
                        <h3>Thông tin khách hàng</h3>
                        <p>Tên: {order.items[0]?.nameReceive}</p>
                        <p>Phone: {order.items[0]?.phone}</p>
                        <p>Email: {order.items[0]?.email}</p>
                        <p>Address: {order.items[0]?.address}</p>
                    </div>
                </div>
                <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12">
                    <div className="order_details">
                        <h3>Thông tin đơn hàng</h3>
                        <ul>
                            <li>
                                <span>Mã đơn hàng:</span>
                                <b style={{ color: "blue" }}>#{order.orderId}</b>
                            </li>
                            <li>
                                <span>Ngày tạo:</span>
                                <b>{new Date(order.createdDate).toLocaleDateString()}</b>
                            </li>
                            <li >
                                <span>Trạng thái đơn hàng:</span>
                                <b className={`status-badge ${getStatusClass(order.status)}`}>{order.status}</b>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12">
                    <div className="order_details">
                        <h3>Sản phẩm đã mua</h3>
                        <ul>
                            {order.items.map(item => (
                                <li key={item.orderItemId}>
                                    <span>{item.name}</span>
                                    <b>{formatter(item.price)} ({item.soLuong})</b>
                                </li>
                            ))}
                            <li>
                                <h4>Mã giảm giá:</h4>
                                <b>{order.discountCode || 'Không có'}</b>
                            </li>
                            <li>
                                <h4>Tổng cộng Voucher giảm giá:</h4>
                                <b>{formatter(order.discount)}</b>
                            </li>
                            <li className="checkout_order_subtotal">
                                <h3>Tổng tiền:</h3>
                                <b>{formatter(order.totalCost)}</b>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12">
                    <div className="order_details">
                        <h3>Thông tin thanh toán</h3>
                        <ul>
                            <li>
                                <span>Phí Ship:</span>
                                <b>{formatter(order.ship)}</b>
                            </li>
                            <li>
                                <span>Tổng tiền thanh toán:</span>
                                <b>{formatter(order.totalCost  + order.ship)}</b>
                            </li>
                            <li>
                                <span>Phương thức thanh toán:</span>
                                <b>{order.items[0]?.paymentMethod}</b>
                            </li>
                            <li>
                                <span>Trạng thái thanh toán:</span>
                                <b>{order.items[0]?.paymentStatus}</b>
                            </li>
                            <li>
                                <span>Ghi chú (Nếu có):</span>
                                <b>{order.items[0]?.note}</b>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    )}
    </div>
  );
};

export default memo(OrderDetail);
