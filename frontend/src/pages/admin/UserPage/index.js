import { memo, useEffect, useState } from "react";
import axios from "axios";
import "./style.scss";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import { IoIosAddCircleOutline } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { ROUTERS } from "utils/router";

const API_URL = "https://localhost:7200/api/User/all"; 

const UserPage = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [checkedAll, setCheckedAll] = useState(false);
    const [checkedItems, setCheckedItems] = useState([]);

    // Gọi API để lấy danh sách người dùng
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(API_URL);
                setUsers(response.data); // Giả sử API trả về mảng user
            } catch (err) {
                setError("Không thể tải danh sách người dùng!");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleDelete = async (userId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;
    
        try {
            await axios.delete(`https://localhost:7200/api/User/${userId}`);
            alert("Xóa thành công!");
            window.location.reload(); // Reload danh sách user sau khi xóa
        } catch (error) {
            console.error("Lỗi khi xóa user:", error);
            alert("Xóa thất bại!");
        }
    };

    // Bấm chọn tất cả
    const handleSelectAll = (e) => {
        const checked = e.target.checked;
        setCheckedAll(checked);
        setCheckedItems(checked ? users.map(({ id }) => id) : []);
    };

    // Bấm chọn từng item
    const handleSelectItem = (id) => {
        if (checkedItems.includes(id)) {
        setCheckedItems(checkedItems.filter((itemId) => itemId !== id));
        } else {
        setCheckedItems([...checkedItems, id]);
        }
    };

    return (
        <div className="container">
            <div className="orders">
                <h2>Quản lý User</h2>

                {/* Nút tạo mới */}
                <div className="orders_header">
                    <button type="button" className="orders_header_button-create"
                        onClick={() => navigate(ROUTERS.ADMIN.USERADCREATE)}
                    >
                        <IoIosAddCircleOutline /> <span>Tạo mới</span>
                    </button>
                </div>

                {/* Hiển thị trạng thái tải dữ liệu */}
                {loading && <p>Đang tải dữ liệu...</p>}
                {error && <p className="error-message">{error}</p>}

                {!loading && !error && (
                    <div className="orders_content">
                        <table className="orders_table">
                            <thead>
                                <tr>
                                    <th>
                                        <input type="checkbox" checked={checkedAll} onChange={handleSelectAll} />
                                    </th>
                                    <th>Mã người dùng</th>
                                    <th>Tên người dùng</th>
                                    <th>Mật khẩu</th>
                                    <th>Loại người dùng</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    users.length > 0 ? (
                                        users.map((item, i) => (
                                            <tr key={item.userId  || i}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={checkedItems.includes(item.id)}
                                                        onChange={() => handleSelectItem(item.id)}
                                                        />
                                                </td>
                                                <td><span style={{
                                                    fontWeight: "bold",
                                                    color: "#007bff",
                                                    backgroundColor: "#f0f8ff",
                                                    padding: "4px 8px",
                                                    borderRadius: "6px",
                                                    fontSize: "14px"
                                                }}>
                                                    #{item.userId }
                                                    </span>
                                                </td>
                                                <td>{item.username}</td>
                                                <td>{item.password}</td>
                                                <td>{item.typeUser}</td>
                                                <td>
                                                    <div className="orders_button">
                                                        <button type="button" className="orders_button-btn"
                                                            onClick={() => navigate(`${ROUTERS.ADMIN.USERADEDIT}/${item.userId}`)}
                                                        >
                                                            <AiOutlineEdit />
                                                        </button>
                                                        <button type="submit" className="orders_button-btn"
                                                            onClick={() => handleDelete(item.userId)}
                                                        >
                                                            <AiOutlineDelete />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5">Không có người dùng nào!</td></tr>
                                    )
                                }
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <div className="orders_footer">
                <div className="orders_pagination">
                    <div className="orders_page-number">
                        <button type="button" className="orders_page-btn">→</button>
                        <button type="button" className="orders_page-btn orders_page-btn--active">1</button>
                        <button type="button" className="orders_page-btn">2</button>
                        <button type="button" className="orders_page-btn">3</button>
                        <button type="button" className="orders_page-btn">...</button>
                        <button type="button" className="orders_page-btn">←</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(UserPage);
