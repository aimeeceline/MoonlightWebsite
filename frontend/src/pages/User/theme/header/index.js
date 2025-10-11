import { memo, useEffect } from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    AiOutlineUser,
    AiOutlineMail,
    AiOutlineShoppingCart,
    AiOutlineMenu,
    AiOutlinePhone,
    AiOutlineDownCircle,
    AiOutlineUpCircle,
    AiOutlineLogout
} from "react-icons/ai";

import { MdEmail } from "react-icons/md";

import "./style.scss"
import { ROUTERS } from "utils/router";
import { formatter } from "utils/fomatter";
import axios from "axios";

export const categories = [
    "Sữa rửa mặt",
    "Kem dưỡng"
];


const Header = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [cartDetails, setCartDetails] = useState({
        totalCartPrice: 0,
        quantity: 0,
        originalTotal: 0
    });

    const location = useLocation();
    // const[isShowCategories, setisShowCategories] = useState([false]);
    const [isShowHamberger, setisShowHamberger] = useState([false]);
    const [isHome, setIsHome] = useState([location.pathname.length <= 1]);
    const [isShowCategories, setisShowCategories] = useState(isHome);
    const [menus, setMenus] = useState([
        {
            name: "Trang chủ",
            path: ROUTERS.USER.HOMEPAGE,
        },
        {
            name: "Về chúng tôi",
            path: ROUTERS.USER.ABOUT,
        },
        {
            name: "Sản phẩm",
            path: ROUTERS.USER.PRODUCT,
            isShowSubmenu: false,
            child: [],
        },
        {
            name: "Blog",
            path: ROUTERS.USER.BLOG
        }
    ])

    // Hàm gọi API để lấy thông tin người dùng
    const getUserInfo = async () => {
        try {
            const token = localStorage.getItem("token");  // Lấy token từ localStorage
            const response = await axios.get('https://localhost:7200/api/Auth/me', {
  headers: { Authorization: `Bearer ${token}` }
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


    // Thực hiện đăng xuất
    const handleLogout = () => {
        localStorage.removeItem("token");
        setUsername(null);
        navigate(ROUTERS.USER.HOMEPAGE);
    };


    // state cho danh mục
const [categories, setCategories] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

useEffect(() => {
  let alive = true;
  (async () => {
    try {
      const { data } = await axios.get('https://localhost:7007/api/category'); // endpoint đang OK
      const raw = Array.isArray(data) ? data : (data?.categories ?? []);

const cats = raw
  .map(c => {
    const id = Number(c.categoryId ?? c.CategoryId ?? c.id ?? c.Id);
    if (!Number.isFinite(id)) return null;
    return {
      id,                     // để dùng chung
      categoryId: id,         // 👈 giữ lại đúng tên mà list đang dùng
      name: c.name ?? c.Name ?? `Danh mục ${id}`,
      path: `${ROUTERS.USER.CATEGORY_PRODUCTS}/${id}` 
      // hoặc ROUTERS.USER.CATEGORY_PRODUCTS.replace(':categoryId', String(id))
    };
  })
  .filter(Boolean);

setMenus(prev => prev.map(m => m.name === 'Sản phẩm' ? { ...m, child: cats } : m));
setCategories(cats);
      setError('');
    } catch (e) {
      if (!alive) return;
      console.error(e);
      setCategories([]);
      setError('Không thể tải danh mục!');
    } finally {
      if (alive) setLoading(false);
    }
  })();
  return () => { alive = false; };
}, []);

    // Thực hiện ẩn banner ngoại trừ 2 trang HOME và HOMES
    useEffect(() => {
        const isHome = location.pathname === "/" || location.pathname === ROUTERS.USER.HOMEPAGE;
        setIsHome(isHome);
        setisShowCategories(isHome);
    }, [location]);
    // Thực hiện lấy tổng tiền và số lượng trong giỏ hàng
    const fetchCartDetails = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setCartDetails({ quantity: 0, totalCartPrice: 0, originalTotal: 0 });
            return;
        }

        try {
            const response = await axios.get("https://localhost:7099/api/Cart/user-cart", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 200) {
                setCartDetails(response.data);
            } else {
                setCartDetails({ quantity: 0, totalCartPrice: 0, originalTotal: 0 });
                console.warn("Không thể lấy thông tin giỏ hàng!");
            }
        } catch (error) {
            console.error("Lỗi khi lấy giỏ hàng:", error);
            setCartDetails({ quantity: 0, totalCartPrice: 0, originalTotal: 0 });
        }
    };
    // Theo dõi sự thay đổi token trong localStorage + kiểm tra định kỳ (Trong giỏ hàng)
    useEffect(() => {
        const checkTokenAndFetch = () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setCartDetails({ quantity: 0, totalCartPrice: 0 });
            } else {
                fetchCartDetails();
            }
        };

        // Lắng nghe khi storage thay đổi ở tab khác
        const handleStorageChange = () => {
            console.log("Storage event fired");
            checkTokenAndFetch();
        };

        window.addEventListener("storage", handleStorageChange);

        // Check định kỳ trong cùng tab
        const interval = setInterval(checkTokenAndFetch, 3000); // Mỗi 3 giây

        // Lấy lần đầu khi component mounted
        checkTokenAndFetch();

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            clearInterval(interval);
        };
    }, []);
    const [searchTerm, setSearchTerm] = useState("");

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        // Điều hướng sang trang kết quả kèm từ khóa
        navigate(`${ROUTERS.USER.SEARCHPAGE}?keyword=${encodeURIComponent(searchTerm)}`);
    };


    return (
        <>
            {/* Sidebar khi thu nhỏ màn hình */}
            <div className={`hamberger_menu_overlay ${isShowHamberger ? "active" : ""
                }`}
                onClick={() => setisShowHamberger(false)}
            />
            <div className={`hamberger_menu_wrapper ${isShowHamberger ? "show" : ""}`}
            >
                <div className="header_logo">
                    <h2>MoonLight</h2>
                </div>
                <div className="hamberger_menu_cart">
                    <ul>
                        <li>
                            <Link to={ROUTERS.USER.SHOPPING_CART}>
                                <AiOutlineShoppingCart />
                                <span>{cartDetails.quantity}</span>
                            </Link>
                        </li>
                    </ul>
                    <div className="header_cart_price">
                        Giỏ hàng: <span>{formatter(cartDetails.originalTotal || 0)}</span>
                    </div>
                </div>
                <div className="hamberger_menu_widget">
                    <div className="header_top_right_auth">
                        <Link to="#">
                            <AiOutlineUser /> <span>Đăng nhập</span>
                        </Link>

                    </div>
                </div>
                <div className="hamberger_menu_nav">
                    <ul>
                        {
                            menus.map((menu, menuKey) => (
                                <li key={menuKey} to={menu.path}>
                                    <Link
                                        to={menu.path}
                                        onClick={() => {
                                            const newMenus = [...menus];
                                            newMenus[menuKey].isShowSubmenu =
                                                !newMenus[menuKey].isShowSubmenu;
                                            setMenus(newMenus);
                                        }}
                                    >
                                        {menu.name}
                                        {menu.child && (
                                            menu.isShowSubmenu ? (
                                                <AiOutlineDownCircle />
                                            )
                                                : <AiOutlineUpCircle />
                                        )}
                                        {menu.child && (
                                            <ul className={`header_menu_dropdown ${menu.isShowSubmenu ? "show_submenu" : ""
                                                }`}>
                                                {menu.child.map((childItem, childKey) => (
                                                    <li key={`${menuKey} - ${childKey}`}>
                                                        <Link to={childItem.path}>
                                                            {childItem.name}
                                                        </Link>

                                                    </li>
                                                ))}

                                            </ul>
                                        )}
                                    </Link>
                                </li>
                            ))
                        }

                    </ul>
                </div>
                <div className="hamberger_menu_context">
                    <ul>
                        <li>
                            <MdEmail />moonlight@gmail.com
                        </li>
                        <li>
                            Miễn phí đơn từ {formatter(5000000)}
                        </li>
                    </ul>
                </div>
            </div>


            {/* Tạo một thanh Header trên cùng*/}
            <div className="header_top">
                <div className="container">
                    <div className="row">
                        <div className="col-6 header_top_left">
                            <ul>
                                <li>
                                    <AiOutlineMail />
                                    <span>
                                        moonlight@gmail.com
                                    </span>
                                </li>
                                <li>
                                    Miễn phí ship hàng đơn từ 5.000.000đ
                                </li>
                            </ul>

                        </div>
                        <div className="col-6 header_top_right">
                            <ul>
                                {username ? (
                                    <>
                                        <li
                                            className="name"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center', /* Căn giữa icon và text theo chiều dọc */
                                                gap: '5px', /* Khoảng cách giữa icon và text */
                                                cursor: 'pointer', /* Con trỏ dạng tay khi hover */
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                color: '#333',
                                                transition: 'color 0.3s ease, transform 0.3s ease'
                                            }}
                                            onClick={() => navigate(ROUTERS.USER.MYACCOUNT)}
                                        >
                                            <AiOutlineUser
                                                style={{
                                                    fontSize: '18px', /* Kích thước icon */
                                                    color: '#666', /* Màu icon mặc định */
                                                    transition: 'color 0.3s ease, transform 0.3s ease'
                                                }}
                                            />
                                            <span style={{
                                                color: '#333', /* Màu text mặc định */
                                                transition: 'color 0.3s ease' /* Mượt khi hover */
                                            }}
                                            >
                                                Xin chào, <span style={{ color: '#0d6efd' }}>{username}</span>
                                            </span>
                                        </li>
                                        <li
                                            className="logout"
                                            onClick={handleLogout}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center', /* Căn giữa icon và text theo chiều dọc */
                                                gap: '5px', /* Khoảng cách giữa icon và text */
                                                cursor: 'pointer', /* Con trỏ dạng tay khi hover */
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                color: '#333',
                                                transition: 'color 0.3s ease, transform 0.3s ease'
                                            }}
                                        >
                                            <AiOutlineLogout
                                                style={{
                                                    fontSize: '18px', /* Kích thước icon */
                                                    color: '#666', /* Màu icon mặc định */
                                                    transition: 'color 0.3s ease, transform 0.3s ease' /* Mượt khi hover */
                                                }}
                                            />
                                            <span
                                                style={{
                                                    color: '#333', /* Màu text mặc định */
                                                    transition: 'color 0.3s ease' /* Mượt khi hover */
                                                }}
                                            >
                                                Đăng xuất
                                            </span>
                                        </li>
                                    </>
                                ) : (
                                    <li onClick={() => navigate(ROUTERS.ADMIN.LOGIN)} style={{ cursor: 'pointer' }}>
                                        <AiOutlineUser />
                                        <span>Đăng nhập</span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <marquee className="marquee-wrapper" behavior="scroll" direction="left" scrollamount="6" >
                💥 Ưu đãi đặc biệt trong tuần này: Nhập ngay voucher AnhDuyenSenxinhdep để giảm 50% cho đơn từ 5000.000đ! 💥 Mua 2 tặng 1 cho dòng trang sức cưới cao cấp!
            </marquee>
            {/* Tạo một logo và thanh menu */}
            <div className="container">
                <div className="row">
                    <div className="col-lg-3">
                        <div className="header_logo">
                            <h1>MoonLight</h1>
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="header_menu">
                            <ul>
                                {menus.map((menu, menuKey) => (
                                    <li key={menuKey} className={menuKey === 0 ? "active" : ""}>
                                        <Link to={menu.path}>{menu.name}</Link>
                                        {menu.child && (
                                            <ul className="header_menu_dropdown">
                                                {menu.child.map((childItem, childKey) => (
                                                    <li key={`${menuKey} - ${childKey}`}>
                                                        <Link to={childItem.path}>{childItem.name}</Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="col-lg-3">
                        <div className="header_cart">
                            <div className="header_cart_price">
                                <span>{formatter(cartDetails.originalTotal || 0)}</span>
                            </div>
                            <ul>
                                <li>
                                    <Link to={ROUTERS.USER.SHOPPING_CART}>
                                        <AiOutlineShoppingCart />
                                        <span>{cartDetails.quantity}</span>
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div className="banner_open">
                            <AiOutlineMenu
                                onClick={() => setisShowHamberger(true)}
                            />
                        </div>
                    </div>
                </div>
            </div>
            {/* Tạo danh mục sản phẩm và banner*/}
            <div className="container">
                <div className="row here_categories_container">
                    <div className="col-lg-3 col-md-12 col-sm-12 col-xs-12 here_categories">
                        <div
                            className="here_categories_all"
                            onClick={() => setisShowCategories(!isShowCategories)}
                        >
                            <AiOutlineMenu />
                            Danh sách sản phẩm
                        </div>

                        {isShowCategories && (
                            <ul className="category_list">
                                {loading ? (
                                    <li>Đang tải...</li>
                                ) : error ? (
                                    <li>{error}</li>
                                ) : (
                                    categories.map((category) => (
                                        <li key={category.categoryId}>
                                            <Link to={`${ROUTERS.USER.CATEGORY_PRODUCTS}/${category.categoryId}`}>
                                                {category.name}
                                            </Link>
                                        </li>
                                    ))
                                )}
                            </ul>
                        )}
                    </div>
                    { /*Thanh tìm kiếm*/}
                    <div className="col-lg-9 col-md-12 col-sm-12 col-xs-12 here_search_container">
                        <div className="here_search">
                            <div className="here_search_form">
                                <form onSubmit={handleSearch}>
                                    <input type="text" name="" placeholder="Bạn đang tìm gì?" value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)} />
                                    <button type="submit" className="site-btn">Tìm kiếm</button>
                                </form>
                            </div>
                            <div className="here_search_phone">
                                <div className="here_search_phone_icon">
                                    <AiOutlinePhone />
                                </div>
                                <div className="here_search_phone_text">
                                    <p>+84 795793509</p>
                                    <span>Hỗ trợ 24/7</span>
                                </div>
                            </div>
                        </div>
                        { /*Thực hiện ẩn banner khi chuyển sang trang Danh sách sản phẩm*/}
                        {isHome && (
                            <div className="here_items">
                                <div className="here_items_text">
                                    <span>Nét riêng định khí chất</span>
                                    <h2>Sang trọng tối giản</h2>
                                    <p>Mỗi thiết kế là một câu chuyện</p>
                                    <Link to={ROUTERS.USER.PRODUCT} className="primary-btn">
                                        Mua ngay
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default memo(Header);
