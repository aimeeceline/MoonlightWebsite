import { memo, useState, useEffect } from "react";
import { IoChevronBackCircleSharp } from "react-icons/io5";
import "./create.scss";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ROUTERS } from "utils/router";

const OrderADEditPage = () => {
    const navigate = useNavigate();
    const { orderId } = useParams();

    const [order, setOrder] = useState({
        address: "",
        phone: "",
        email: "",
        status: "",
        note: ""
    });

    const [loading, setLoading] = useState(true);

    const fetchOrder = async () => {
        try {
            const res = await axios.get(`https://localhost:7033/api/Order/detail/${orderId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            });

            const data = res.data;
            const item = data.items?.[0] || {};

            setOrder({
                address: item.address || "",
                phone: item.phone || "",
                email: item.email || "",
                status: data.status || "",
                note: item.note || ""
            });

            setLoading(false);
        } catch (err) {
            console.error("Không thể tải chi tiết đơn hàng", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setOrder((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Chỉ gửi các trường backend yêu cầu
        const payload = {
            address: order.address,
            phone: order.phone,
            email: order.email,
            note: order.note,
            status: order.status
        };

        try {
            await axios.put(`https://localhost:7033/api/Order/update-order-info/${orderId}`, payload, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json"
                }
            });

            alert("Cập nhật đơn hàng thành công!");
            navigate(`${ROUTERS.ADMIN.DETAILORDERS}/${orderId}`);
        } catch (err) {
            console.error("Lỗi khi cập nhật đơn hàng", err);
            alert("Cập nhật thất bại!");
        }
    };

    if (loading) return <p>Đang tải dữ liệu...</p>;

    return (
        <div className="container">
            <div className="create_category">
                <div className="create_category_back">
                    <button
                        type="button"
                        className="orders_header_button-create"
                        onClick={() => navigate(`${ROUTERS.ADMIN.DETAILORDERS}/${orderId}`)}
                    >
                        <IoChevronBackCircleSharp />
                    </button>
                </div>
                <div className="create_category_title">
                    <h2>Cập nhật đơn hàng</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-lg-6 col-md-12">
                        <div className="checkout_input">
                            <label>Địa chỉ: <span className="required">*</span></label>
                            <input type="text" name="address" value={order.address} onChange={handleChange} />
                        </div>
                        <div className="checkout_input">
                            <label>Số điện thoại: <span className="required">*</span></label>
                            <input type="text" name="phone" value={order.phone} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="col-lg-6 col-md-12">
                        <div className="checkout_input1">
                            <label>Email: <span className="required">*</span></label>
                            <input type="email" name="email" value={order.email} onChange={handleChange} />
                        </div>
                        <div className="checkout_input1">
                            <div>
                                <label>Trạng thái: <span className="required">*</span></label>
                            </div>
                            <div>
                                <select name="status" value={order.status} onChange={handleChange}>
                                    <option value="New">Mới</option>
                                    <option value="Processing">Đang xử lý</option>
                                    <option value="Shipped">Đã giao</option>
                                    <option value="Cancelled">Đã hủy</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-12">
                        <div className="checkout_input">
                            <label>Ghi chú:</label>
                            <textarea name="note" value={order.note} onChange={handleChange}></textarea>
                        </div>
                    </div>
                </div>

                <div className="create_category_back">
                    <button type="submit" className="orders_header_button-create">
                        <span>Cập nhật</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default memo(OrderADEditPage);
