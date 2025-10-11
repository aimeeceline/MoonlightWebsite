import { memo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ROUTERS } from "utils/router";
import HeaderAd from "../headerAd";
import SideBar from "../SideBar"; // Import Sidebar
import "./style.scss";
import FooterAd from "../footerAd";

const MasterAdminLayout = ({ children, ...props }) => {
    const location = useLocation();
    const isLoginPage = location.pathname.startsWith(ROUTERS.ADMIN.LOGIN);
    const isRegisterPage = location.pathname.startsWith(ROUTERS.ADMIN.REGISTER);
    const isAuthPage = isLoginPage || isRegisterPage; 
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className={`admin-layout ${isAuthPage ? "login-page" : ""}`}>
            {!isAuthPage && <HeaderAd toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />}
    
            <div className="main-layout">
                {!isAuthPage && <SideBar isOpen={isSidebarOpen} />}
                <div className={`content ${isSidebarOpen && !isAuthPage ? "with-sidebar" : "full-width"}`}>
                    {children}
                </div>
            </div>
    
            {!isAuthPage && <FooterAd />}
        </div>
    );
};

export default memo(MasterAdminLayout);
