import { memo, useEffect, useState } from "react";
import { IoChevronBackCircleSharp } from "react-icons/io5";
import "./create.scss";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTERS } from "utils/router";
import axios from "axios";

const DiscountADEditPage = () => {
    const navigate = useNavigate();
    const { discountId } = useParams();

    const [discount, setDiscount] = useState({
        discountId: "",
        code: "",
        description: "",
        discountValue: 0,
        minOrderValue: 0,
        dateStart: "",
        expirationDate: "",
        status: true,
    });


    // Lấy thông tin mã giảm giá cần sửa
    useEffect(() => {
        const fetchDiscount = async () => {
            try {
                const response = await axios.get(`https://localhost:7070/api/Discount/get-discount/${discountId}`);
                setDiscount({
                    discountId: response.data.discountId,
                    code: response.data.code,
                    description: response.data.description,
                    discountValue: response.data.discountValue,
                    minOrderValue: response.data.minOrderValue,
                    dateStart: response.data.dateStart,
                    expirationDate: response.data.expirationDate,
                    status: response.data.status,
                });
            } catch (err) {
                console.error("Lỗi khi lấy mã giảm giá:", err);
            }
        };
        fetchDiscount();
    }, [discountId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === "checkbox" ? checked : value;
        setDiscount({ ...discount, [name]: val });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();


        try {
            await axios.put(`https://localhost:7070/api/Discount/Update-discount/${discount.discountId}`, discount);
            alert("Cập nhật mã giảm giá thành công!");
            navigate(ROUTERS.ADMIN.DISCOUNT);
        } catch (err) {
            console.error("Lỗi khi cập nhật mã giảm giá", err);
            alert("Cập nhật thất bại!");
        }
    };

    return (
        <div className="container">
            <div className="create_category">
                <div className="create_category_back">
                    <button type="button" className="orders_header_button-create"
                        onClick={() => navigate(ROUTERS.ADMIN.DISCOUNT)}
                    >
                        <IoChevronBackCircleSharp />
                    </button>
                </div>
                <div className="create_category_title">
                    <h2>Cập nhật mã giảm giá</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12">
                        <div className="checkout_input">
                            <label>Mã giảm giá</label>
                            <input type="text" name="code" value={discount.code} onChange={handleChange} required />
                        </div>
                        <div className="checkout_input">
                            <label>Mô tả</label>
                            <input type="text" name="description" value={discount.description} onChange={handleChange} />
                        </div>
                        <div className="checkout_input">
                            <label>Phần trăm giảm (%)</label>
                            <input type="number" name="discountValue" value={discount.discountValue} onChange={handleChange} />
                        </div>
                        <div className="checkout_input">
                            <label>Giá trị đơn tối thiểu</label>
                            <input type="number" name="minOrderValue" value={discount.minOrderValue} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12">
                        <div className="checkout_input1">
                            <label>Ngày bắt đầu</label>
                            <input type="datetime-local" name="dateStart" value={discount.dateStart} onChange={handleChange} />
                        </div>
                        <div className="checkout_input1">
                            <label>Ngày hết hạn</label>
                            <input type="datetime-local" name="expirationDate" value={discount.expirationDate} onChange={handleChange} />
                        </div>
                        <div className="checkout_input1">
                            <label>Trạng thái</label>
                            <input type="checkbox" name="status" checked={discount.status} onChange={handleChange} />
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

export default memo(DiscountADEditPage);
