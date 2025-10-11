import { memo } from "react";
import "./style.scss";
import { AiOutlineCustomerService, AiOutlineLogout, AiOutlineOrderedList, AiOutlineProduct, AiOutlineShoppingCart, AiOutlineUser } from "react-icons/ai";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTERS } from "utils/router";


const HeaderAdmin = ({children, ...props}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const navItems = [
        {
            path: ROUTERS.ADMIN.USERAD,
            onclick: () => navigate(ROUTERS.ADMIN.USERAD),
            label: "User",
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
            path: ROUTERS.ADMIN.LOGIN,
            onclick: () => navigate(ROUTERS.ADMIN.LOGIN),
            label: "Đăng xuất",
            icon: <AiOutlineLogout />,
        },
    ]
    return (
        <div className="admin_header container" {...props}>
            <nav className="admin_header_nav">
                <div className="admin_header_logo">
                    <strong>Admin</strong>
                </div>
                {
                    navItems.map(({path, label, icon}) =>(
                        <div key = {path}
                            className={`admin_header_nav-item ${
                            location.pathname.includes(path)
                            ? "admin_header_nav-item--active" 
                            : ""
                        }`}
                        onClick={() => navigate(path)}
                        >
                            <span className="admin_header_nav-icon">{icon}</span> 
                            <span>{label}</span> 
                        </div>
                    ))
                }
            </nav>
        </div>
    );
};

export default memo(HeaderAdmin);