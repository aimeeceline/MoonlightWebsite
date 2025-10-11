import React, { memo } from "react";
import {  useLocation, useNavigate } from "react-router-dom";
import {  FaBars } from "react-icons/fa";
import { RiDiscountPercentFill } from "react-icons/ri";
import "./style.scss";
import { ROUTERS } from "utils/router";
import { AiOutlineCustomerService, AiOutlineLogout, AiOutlineOrderedList, AiOutlineProduct, AiOutlineShoppingCart, AiOutlineUser } from "react-icons/ai";
import { MdDashboard } from "react-icons/md";

const SideBar = ({ isOpen, toggleSidebar }) => {

    const navigate = useNavigate();
        const location = useLocation();
        const navItems = [
            {
                path: ROUTERS.ADMIN.DASHBOARD,
                onclick: () => navigate(ROUTERS.ADMIN.DASHBOARD),
                label: "Dashboard",
                icon: <MdDashboard  />,
            },
            {
                path: ROUTERS.ADMIN.USERAD,
                onclick: () => navigate(ROUTERS.ADMIN.USERAD),
                label: "Người dùng",
                icon: <AiOutlineUser />,
            },
            {
                path: ROUTERS.ADMIN.CUSTOMES,
                onclick: () => navigate(ROUTERS.ADMIN.CUSTOMES),
                label: "Khách hàng",
                icon: <AiOutlineCustomerService />,
            },
            {
                path: ROUTERS.ADMIN.CATEGORIES,
                onclick: () => navigate(ROUTERS.ADMIN.CATEGORIES),
                label: "Danh mục SP",
                icon: <AiOutlineOrderedList />,
            },
            {
                path: ROUTERS.ADMIN.PRODUCTAD,
                onclick: () => navigate(ROUTERS.ADMIN.PRODUCTAD),
                label: "Sản phẩm",
                icon: <AiOutlineProduct />,
            },
            {
                path: ROUTERS.ADMIN.ORDERS,
                onclick: () => navigate(ROUTERS.ADMIN.ORDERS),
                label: "Đơn hàng",
                icon: <AiOutlineShoppingCart />,
            },
            {
                path: ROUTERS.ADMIN.DISCOUNT,
                onclick: () => navigate(ROUTERS.ADMIN.DISCOUNT),
                label: "Mã giảm giá",
                icon: <RiDiscountPercentFill  />,
            },
            {
                path: ROUTERS.ADMIN.LOGIN,
                onclick: () => {
                    localStorage.removeItem("accessToken");
                    navigate(ROUTERS.ADMIN.LOGIN);
                },
                label: "Đăng xuất",
                icon: <AiOutlineLogout />,
            },
        ]
    return (
        <div className={`sidebar ${isOpen ? "open" : ""}`}>
            {/* Header Sidebar */}
            <div className="sidebar-header">
                <FaBars className="menu-icon" onClick={toggleSidebar} />
                <h2>Bae Beauty</h2>
            </div>
            
            {/* Danh sách menu */}
            <nav className="sidebar-menu">
                <div className="sidebar-title">Admin</div> 
                {navItems.map(({ path, label, icon }, index) => (
                    <div 
                        key={index} 
                        className={`menu-item ${location.pathname.includes(path) ? "menu-item--active" : ""}`} 
                        onClick={() => navigate(path)}
                    >
                        {icon}
                        <span>{label}</span>
                    </div>
                ))}
            </nav>
        </div>
    );
};

export default memo(SideBar);
