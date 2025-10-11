import { memo, useEffect, useState } from "react";
import "./style.scss";
import Breadcrumb from "../theme/breadcrumb";

import call1ing from "assets/User/images/about/account.jpg";
import axios from "axios";
import { formatter } from "utils/fomatter";



const MyOrderPage = () => {

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [userInfo, setUserInfo] = useState({ username: "", email: "", phone: "" });


    // Lấy thông tin người dùng từ API
    const getUserInfo = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("https://localhost:7200/api/Auth/me", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setUserInfo({
                username: response.data.username || "",
                email: response.data.email || "",
                phone: response.data.phone || ""
            });
        } catch (error) {
            console.error("Error fetching user info", error);
        }
    };


    useEffect(() => {
        getUserInfo();
    }, []);


    useEffect(() => {
        const fetchOrders = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setOrders([]);
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get("https://localhost:7033/api/Order/get-orders", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setOrders(response.data);
                setError("");
            } catch (err) {
                setError("Không thể lấy danh sách đơn hàng. Vui lòng thử lại.");
                console.error("Lỗi khi lấy đơn hàng:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);


    return (
        <>
            <Breadcrumb name="Tài khoản của tôi" />
            <div className="container">
                <div className="row">
                    <div className="col-lg-3 col-md-12 col-sm-12 col-xs-12">
                        <div className="myaccount">
                            <div className="myaccount_about">
                                <img src={call1ing} alt="Account" className="myaccount_about_img" />
                                <h3 className="myaccount_abount_title">{userInfo.username}</h3>
                            </div>
                            <div className="myaccount_phone">Số điện thoại: {userInfo.phone || "Không có số điện thoại"}</div>
                            <div className="myaccount_email">Email: {userInfo.email || "Không có email"}</div>
                        </div>
                    </div>

                    <div className="col-lg-9 col-md-12 col-sm-12 col-xs-12 ">
                        <h2>Đơn hàng của tôi</h2>
                        <div className="row">
                            {loading && <p>Đang tải đơn hàng...</p>}
                            {error && <p style={{ color: "red" }}>{error}</p>}

                            {orders.length === 0 && !loading && <p>Chưa có đơn hàng nào.</p>}

                            {orders.map(order => (
                                <div className="order" key={order.orderId}>
                                    <h3 className="order_title">
                                        Mã đơn hàng: <span><u>#{order.orderId}</u></span>
                                    </h3>
                                    <div className="order_info">
                                        <div className="order_date">
                                            Ngày đặt: {new Date(order.createdDate).toLocaleDateString()}
                                        </div>

                                        {/* Trạng thái thanh toán */}
                                        <div className="order_status">
                                            {order.status === "Pending"
                                                ? "Chờ thanh toán"
                                                : order.status === "Completed"
                                                    ? "Đã thanh toán"
                                                    : order.status}
                                        </div>
                                    </div>

                                    <div className="order-items">
  {order.items.map((it, idx) => {
  const img = !it.imageProduct
    ? "/placeholder.png"
    : (it.imageProduct.startsWith("http")
        ? it.imageProduct
        : `https://localhost:7007/images/${it.imageProduct}`);

  return (
    <div className="order-item" key={`${it.productId}-${idx}`}>
      <img src={img} alt={it.name || "product"} className="order-item_img" />
      <div className="order-item_details">
        <h3>{it.name}</h3>
        <p>Phân loại: {it.categoryName || "-"}</p>
        <p>x{it.soLuong}</p>
      </div>
    </div>
  );
})}
</div>
                                    <div className="order_discount">
                                        Số tiền tiết kiệm được: <span>{formatter(order.discount)}</span>
                                    </div>
                                    <div className="order_discount">
                                        Phí ship: <span>{formatter(order.ship)}</span>
                                    </div>
                                    <div className="order_total">
                                        Tổng tiền đơn hàng: <span>{formatter(order.totalCost)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default memo(MyOrderPage);