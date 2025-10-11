import { memo, useEffect, useState } from "react";
import "./style.scss";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import { IoIosAddCircleOutline } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { ROUTERS } from "utils/router";
import axios from "axios";

const API_URL = "https://localhost:7007/api/Category"; 
const CategoryPage = () => {
    const navigate = useNavigate();
    const [category, setCategory] = useState(); // Lưu và cập nhật thông tin danh mục
    const [loading, setLoading] = useState(true); // Hiệu ứng đang loading
    const [error, setError] = useState(null); // Hiển thị lỗi khi lấy được dữ liệu API
    const [checkedAll, setCheckedAll] = useState(false);
    const [checkedItems, setCheckedItems] = useState([]);
   
    // Gọi API để lấy danh sách danh mục
    useEffect(() => {
        const fetchCategory = async () => {
            try {
                const response = await axios.get(API_URL);
                setCategory(response.data);
            }
            catch(err) {
                setError("Không thể tải danh sách danh mục!");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCategory();
    }, []);
    // Hàm xóa người dùng
    const handleDelete = async (categoryId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này hay không?"))
            return;
        try {
            await axios.delete(`https://localhost:7007/api/Category/${categoryId}`);
            alert("Xóa thành công!");
            window.location.reload(); // Reload danh sách danh mục sau khi xóa
        } catch (error){
            console.error("Lỗi khi xóa danh mục:", error);
            alert("Xóa thất bại!");
        }
    }

    // Bấm chọn tất cả
    const handleSelectAll = (e) => {
        const checked = e.target.checked;
        setCheckedAll(checked);
        setCheckedItems(checked ? category.map(({ id }) => id) : []);
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
                <h2>Quản lý danh mục sản phẩm</h2>
                {/* Nút tạo mới */}
                <div className="orders_header">
                    <button type="button" className="orders_header_button-create" 
                    onClick={() => navigate(ROUTERS.ADMIN.CREATECATEGORY)}
                    >
                        <IoIosAddCircleOutline /> <span>Tạo mới</span>
                    </button>
                </div>

                {/*Hiển thị trạng thái tải dữ liệu*/}
                {loading && <p>Đang tải dữ liệu....</p>}
                {error && <p className="error-message">{error}</p>}
                
                {/*Hiển thị danh sách các danh mục*/}
                {!loading && !error && (
                    <div className="orders_content">
                        <table className="orders_table">
                            <thead>
                                <tr>
                                    <th>
                                        <input type="checkbox" checked={checkedAll} onChange={handleSelectAll} />
                                    </th>
                                    <th>Mã danh mục</th>
                                    <th>Tên danh mục</th>
                                    <th>Mô tả</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                            {
                                category.length > 0 ? (
                                    category.map((item, i) =>(
                                        <tr key={item.categoryId || i}>
                                            <td>
                                            <input
                                                type="checkbox"
                                                checked={checkedItems.includes(item.id)}
                                                onChange={() => handleSelectItem(item.id)}
                                                />
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontWeight: "bold",
                                                    color: "#007bff",
                                                    backgroundColor: "#f0f8ff",
                                                    padding: "4px 8px",
                                                    borderRadius: "6px",
                                                    fontSize: "14px"
                                                }}> 
                                                    #{item.categoryId}
                                                </span>
                                            </td>
                                            <td>{item.name}</td>
                                            <td>{item.decription}</td>
                                            <td>
                                                <div className="orders_button">
                                                    <button type="submit" className="orders_button-btn"
                                                    onClick={() => navigate(`${ROUTERS.ADMIN.EDITCATEGORY}/${item.categoryId}`)}
                                                    >
                                                        <AiOutlineEdit />
                                                    </button>
                                                    <button type="submit" className="orders_button-btn"
                                                    onClick={() =>handleDelete(item.categoryId)}
                                                    >
                                                        <AiOutlineDelete />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )  : (
                                    <p>Không tìm thấy danh mục nào!</p>
                                )
                            }
                            </tbody>
                        </table>
                    </div>
                )}
                

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
        </div>
    );
};

export default memo(CategoryPage);
