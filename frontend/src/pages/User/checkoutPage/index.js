import { memo, useEffect, useState } from "react";
import Breadcrumb from "../theme/breadcrumb";
import "./style.scss";
import { formatter } from "utils/fomatter";
import { AiOutlineCreditCard, AiOutlineGift } from "react-icons/ai";
import { RiErrorWarningLine } from "react-icons/ri";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ROUTERS } from "utils/router";

const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
};

const CheckoutPage = () => {
    const navigate = useNavigate();
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
    const [productCart, setProductCart] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [countdown, setCountdown] = useState(0);
    const [paymentId, setPaymentId] = useState("");
    const [, setLoading] = useState(false);
    const [, setMessage] = useState("");
    const [showQrPopup, setShowQrPopup] = useState(false);
    const [pendingOrderPopup, setPendingOrderPopup] = useState(null);
    const [customerInfo, setCustomerInfo] = useState({
        fullName: "", address: "", phone: "", email: "", note: ""
    });

    useEffect(() => {
        const fetchCartDetails = async () => {
            const token = localStorage.getItem("token");
            if (!token) return setProductCart(null);
            try {
                const res = await axios.get("https://localhost:7099/api/Cart/user-cartItem", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setProductCart(res.status === 200 ? res.data : null);
            } catch {
                setProductCart(null);
            }
        };
        fetchCartDetails();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCustomerInfo(prev => ({ ...prev, [name]: value }));
    };

    const handlePaymentMethodChange = (method) => {
        setSelectedPaymentMethod(method);
        setQrCodeUrl("");
        setShowQrPopup(false);
    };

    const handleCheckStatus = () => {
        handleCheckout();
    };
    // Lấy đơn hàng đang ở trạng thái Pending - Chờ Thanh toán
    const checkPendingOrder = async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await axios.get("https://localhost:7033/api/Order/pending-order", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.hasPending) {
                setPendingOrderPopup({
                    show: true,
                    orderId: res.data.orderId,
                    totalCost: res.data.totalCost
                });
                return false;
            }

            return true;
        } catch {
            return true;
        }
    };

    const handleCheckout = async () => {
        const token = localStorage.getItem("token");
        if (!token) return alert("Vui lòng đăng nhập!");

        const { fullName, address, phone, email } = customerInfo;
        if (!fullName || !address || !phone || !email)
            return alert("Vui lòng nhập đầy đủ thông tin đơn hàng!");

        if (!selectedPaymentMethod)
            return alert("Vui lòng chọn phương thức thanh toán!");

        if (!productCart || productCart.items.length === 0)
            return alert("Giỏ hàng rỗng, vui lòng thêm sản phẩm!");

        const hasNoPending = await checkPendingOrder();
        if (!hasNoPending) return;

        setLoading(true);
        try {
            const orderPayload = {
                NameReceive: fullName,
                Phone: phone,
                Email: email,
                Address: address,
                Note: customerInfo.note,
                PaymentMethod: selectedPaymentMethod,
                PaymentStatus: selectedPaymentMethod === "VietQR" ? "Chờ Thanh Toán" : "Chưa Thanh Toán",
                Status: selectedPaymentMethod === "COD" ? "Chờ xác nhận" : "Pending",
                Discount: productCart.discount || 0,
                Ship: 20000,
                DiscountCode: productCart.discountCode || "",
                Items: productCart.items.map(item => ({
                    ProductId: item.productId,
                    Quantity: item.quantity,
                }))
            };

            const orderRes = await axios.post(
                "https://localhost:7033/api/Order/create-order",
                orderPayload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (orderRes.status === 200) {
                const orderId = orderRes.data.orderId;
                if (selectedPaymentMethod === "VietQR") {
                    const qrRes = await axios.post(
                        "https://localhost:7100/api/Payment/process-payment",
                        {
                            BankCode: "VCB",
                            AccountNumber: "123456789",
                            AccountName: "Nguyen Van A",
                            TotalPrice: productCart?.totalCartPrice || 0,
                            Note: `Thanh toán đơn hàng #${orderId}`,
                            OrderId: orderId,
                        },
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );

                    if (qrRes.status === 200) {
                        setMessage("Đã tạo mã QR cho thanh toán!");
                        setQrCodeUrl(qrRes.data.qrCodeUrl);
                        setPaymentId(qrRes.data.paymentId);
                        setTimeout(() => setCountdown(360), 100);
                        setShowQrPopup(true);
                    } else {
                        alert("Tạo đơn hàng thành công nhưng không tạo được mã QR.");
                    }
                } else {
                    alert(`Đơn hàng đã được tạo! Mã đơn hàng: ${orderId}`);
                    navigate(ROUTERS.USER.MESSAGE);
                }
            } else {
                alert("Tạo đơn hàng thất bại.");
            }
        } catch (error) {
            alert("Đã xảy ra lỗi khi xử lý đơn hàng.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!countdown) return;
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) clearInterval(timer);
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    // Cập nhật trạng thái đơn hàng và thanh toán
    useEffect(() => {
        if (!paymentId || !showQrPopup) return;

        const interval = setInterval(async () => {
            try {
                const token = localStorage.getItem("token");

                // Gọi kiểm tra trạng thái thanh toán
                const res = await axios.get(
                    `https://localhost:7100/api/Payment/check-payment?paymentId=${paymentId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (res.status === 200 && res.data.status === "Completed") {
                    clearInterval(interval);

                    // Gọi API cập nhật trạng thái đơn hàng
                    try {
                        await axios.get("https://localhost:7033/api/Order/sync-order-payment-status", {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        });
                        console.log("Đã cập nhật trạng thái đơn hàng.");
                    } catch (orderSyncError) {
                        console.error("Lỗi khi cập nhật trạng thái đơn hàng:", orderSyncError);
                    }

                    setShowQrPopup(false);
                    navigate(ROUTERS.USER.MESSAGE);
                    window.scrollTo(0, 0);
                }
            } catch (error) {
                console.error("Lỗi kiểm tra trạng thái thanh toán:", error);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [paymentId, showQrPopup]);


    return (
        <>
            <Breadcrumb name="Thanh toán" />
            <div className="container">
                <div className="row">
                    {/* Form thông tin người dùng */}
                    <div className="col-lg-6">
                        <div className="checkout_input">
                            <label>Họ và tên: <span className="required">*</span></label>
                            <input type="text" name="fullName" value={customerInfo.fullName} onChange={handleInputChange} />
                        </div>
                        <div className="checkout_input">
                            <label>Địa chỉ: <span className="required">*</span></label>
                            <input type="text" name="address" value={customerInfo.address} onChange={handleInputChange} />
                        </div>
                        <div className="checkout_input_group">
                            <div className="checkout_input">
                                <label>Điện thoại: <span className="required">*</span></label>
                                <input type="tel" name="phone" value={customerInfo.phone} onChange={handleInputChange} />
                            </div>
                            <div className="checkout_input">
                                <label>Email: <span className="required">*</span></label>
                                <input type="email" name="email" value={customerInfo.email} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="checkout_input">
                            <label>Ghi chú:</label>
                            <textarea name="note" value={customerInfo.note} onChange={handleInputChange} />
                        </div>
                    </div>

                    {/* Chi tiết đơn hàng + phương thức thanh toán */}
                    <div className="col-lg-6">
                        <div className="checkout_order">
                            <h3>Sản phẩm</h3>
                            <ul>
                                {productCart?.items.map((item, i) => (
                                    <li key={i}>
                                        <span>{item.productName}</span>
                                        <b>{formatter(item.price)} ({item.quantity})</b>
                                    </li>
                                ))}
                                <li><h4>Tổng tiền:</h4> <b>{formatter(productCart?.originalTotal || 0)}</b></li>
                                <li><h4>Mã giảm giá:</h4> <b>{productCart?.discountCode || "Không có"}</b></li>
                                <li><h4>Tiết kiệm:</h4> <b>{formatter(productCart?.discount || 0)}</b></li>
                                <li className="checkout_order_subtotal"><h3>Thành tiền:</h3> <b>{formatter(productCart?.totalCartPrice || 0)}</b></li>
                            </ul>

                            {/* Phương thức thanh toán */}
                            <div className="checkout_payment">
                                <h2>Chọn phương thức thanh toán</h2>
                                <div className="payment-methods">
                                    <div className={`payment-option ${selectedPaymentMethod === "VietQR" ? "selected" : ""}`}
                                        onClick={() => handlePaymentMethodChange("VietQR")}>
                                        <AiOutlineCreditCard />
                                        <span>Thanh toán qua VietQR</span>
                                    </div>
                                    <div className={`payment-option ${selectedPaymentMethod === "COD" ? "selected" : ""}`}
                                        onClick={() => handlePaymentMethodChange("COD")}>
                                        <AiOutlineGift />
                                        <span>Thanh toán khi nhận hàng</span>
                                    </div>
                                </div>
                                <div className="selected-payment">
                                    {selectedPaymentMethod && (
                                        <p>
                                            Phương thức thanh toán đã chọn: <strong>{selectedPaymentMethod}</strong>
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button type="button" className="button-submit" onClick={handleCheckStatus}>
                                Đặt hàng
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Popup mã QR */}
            {showQrPopup && (
                <div className="qr-popup">
                    <div className="qr-popup-content">
                        <h3>Quét mã QR để thanh toán</h3>
                        <img src={qrCodeUrl} alt="QR Code Thanh Toán" className="qr-image" />
                        <p className="qr-expire">
                            <RiErrorWarningLine size={24} color="#FFC107" /> Hết hạn sau: {formatTime(countdown)}
                        </p>
                        <div className="qr-popup-actions">
                            <button className="btn-outline" onClick={() => setShowQrPopup(false)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup đơn hàng pending */}
            {pendingOrderPopup?.show && (
                <div className="order-popup">
                    <div className="order-popup-content">
                        <h3>Đơn hàng đang chờ thanh toán</h3>
                        <p>Bạn có đơn hàng <strong>#{pendingOrderPopup.orderId}</strong> đang chờ thanh toán.</p>
                        <p>Thành tiền: <strong>{formatter(pendingOrderPopup.totalCost)}</strong></p>
                        <div className="order-popup-actions">
                            <button className="btn-outline" onClick={() => setPendingOrderPopup(null)}>Đóng</button>
                            <button className="btn-primary" onClick={() => navigate(ROUTERS.USER.ORDERHISTORY)}>Xem đơn hàng</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default memo(CheckoutPage);
