import React, { useState, useEffect } from "react";
import { AiOutlineBell, AiOutlineMail, AiOutlineSearch, AiOutlineSetting, AiOutlineUser } from "react-icons/ai";
import { FaBars } from "react-icons/fa";
import axios from 'axios'; // Sử dụng axios để gọi API
import "./style.scss";

const HeaderAD = ({ toggleSidebar }) => {
    const [username, setUsername] = useState("");  // State để lưu tên người dùng

    // Hàm gọi API để lấy thông tin người dùng
    const getUserInfo = async () => {
        try {
            const token = localStorage.getItem("token");  // Lấy token từ localStorage
            const response = await axios.get("https://localhost:7200/api/Auth/me", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
    
            console.log(response.data);  // In ra dữ liệu trả về từ API để kiểm tra
            setUsername(response.data.username);  // Cập nhật state với username
        } catch (error) {
            console.error("Error fetching user info", error);
        }
    };

    // Gọi API khi component được render lần đầu
    useEffect(() => {
        getUserInfo();
    }, []);
    

    return (
        <header className="header">
            <div className="header-left">
                {/* Icon mở menu */}
                <FaBars className="menu-icon" onClick={toggleSidebar} />

                {/* Logo */}
                <div className="logo">Moonlight</div>

                {/* Navigation */}
                <nav className="nav-search">
                    <input type="text" placeholder="Tìm kiếm..." />
                    <button className="search-btn">
                        <AiOutlineSearch />
                    </button>
                </nav>
            </div>

            <div className="header-right">
                {/* Icons */}
                <AiOutlineBell className="icon" />
                <AiOutlineMail className="icon" />
                <AiOutlineSetting className="icon" />

                {/* User Avatar */}
                <div className="user-info">
                    <div className="user-avatar"
                    >
                        <AiOutlineUser className="icon" />
                    </div>
                    {/* Hiển thị tên người dùng */}
                    <span className="user-name">{username}</span>
                </div>
            </div>
        </header>
    );
};

export default HeaderAD;
