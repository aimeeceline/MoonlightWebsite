import { memo, useState } from "react";
import { IoChevronBackCircleSharp } from "react-icons/io5";
import "./create.scss";
import { useNavigate } from "react-router-dom";
import { ROUTERS } from "utils/router";
import axios from "axios";

const DiscountADCreatePage = () => {
    const navigate = useNavigate();
    const [discount, setDiscount] = useState({
        code: "",
        description: "",
        discountValue: 0,
        minOrderValue: 0,
        dateStart: "",
        expirationDate: "",
        status: true,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setDiscount({
            ...discount,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("https://localhost:7070/api/Discount/Create-discount", {
                ...discount,
                createDate: new Date().toISOString(),
            });
            alert("Tạo mã giảm giá thành công!");
            navigate(ROUTERS.ADMIN.DISCOUNT);
        } catch (error) {
            if (error.response && error.response.status === 400) {
                alert(error.response.data.message || "Mã khuyến mãi đã tồn tại!");
            } else {
                alert("Đã có lỗi xảy ra khi tạo mã giảm giá.");
            }
            console.error("Lỗi khi tạo mã giảm giá:", error);
        }
    };

    return (
        <div className="container">
            <div className="create_category">
                <div className="create_category_back">
                    <button
                        type="button"
                        className="orders_header_button-create"
                        onClick={() => navigate(ROUTERS.ADMIN.DISCOUNT)}
                    >
                        <IoChevronBackCircleSharp />
                    </button>
                </div>
                <div className="create_category_title">
                    <h2>Thêm mã giảm giá mới</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-lg-10 col-md-12 col-sm-12 col-xs-12 form">
                        <div className="checkout_input">
                            <label>
                                Mã khuyến mãi: <span className="required">(*)</span>
                            </label>
                            <input type="text" name="code" placeholder="Nhập mã khuyến mãi" value={discount.code} onChange={handleChange} />
                        </div>
                        <div className="checkout_input">
                            <label>Mô tả:</label>
                            <input type="text" name="description" placeholder="Nhập mô tả" value={discount.description} onChange={handleChange} />
                        </div>
                        <div className="checkout_input">
                            <label>Ngày hết hạn:</label>
                            <input type="datetime-local" name="expirationDate" value={discount.expirationDate} onChange={handleChange} />
                        </div>
                        <div className="checkout_input">
                            <label>
                                Trạng thái kích hoạt:
                                <input type="checkbox" name="status" checked={discount.status} onChange={handleChange} />
                            </label>
                        </div>
                    </div>
                     <div className="col-lg-10 col-md-12 col-sm-12 col-xs-12 form">
                        <div className="checkout_input1">
                            <label>Giảm giá (%):</label>
                            <input type="number" name="discountValue" value={discount.discountValue} onChange={handleChange} />
                        </div>
                        <div className="checkout_input1">
                            <label>Đơn tối thiểu (VNĐ):</label>
                            <input type="number" name="minOrderValue" value={discount.minOrderValue} onChange={handleChange} />
                        </div>
                        <div className="checkout_input1">
                            <label>Ngày bắt đầu:</label>
                            <input type="datetime-local" name="dateStart" value={discount.dateStart} onChange={handleChange} />
                        </div>
                        <div className="checkout_input1">
                            <label>Ngày hết hạn:</label>
                            <input type="datetime-local" name="expirationDate" value={discount.expirationDate} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                <div className="create_category_back">
                    <button type="submit" className="orders_header_button-create">
                        <span>Thêm mới</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default memo(DiscountADCreatePage);
