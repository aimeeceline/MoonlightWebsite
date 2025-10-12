import { memo, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AiOutlineShoppingCart,
  AiOutlineUser,
  AiOutlineLogout,
  AiOutlineMenu,
  AiOutlineMail,
  AiOutlinePhone,
  AiOutlineDownCircle,
  AiOutlineUpCircle,
} from "react-icons/ai";
import { MdEmail } from "react-icons/md";
import "./style.scss";
import { ROUTERS } from "utils/router";
import { formatter } from "utils/fomatter";
import axios from "axios";

// === API base URLs (đọc từ env CRA khi chạy trong Docker) ===
const PRODUCT_API = process.env.REACT_APP_PRODUCT_API || `http://${window.location.hostname}:7007`;
const USER_API    = process.env.REACT_APP_USER_API    || `http://${window.location.hostname}:7200`;
const CART_API    = process.env.REACT_APP_CART_API    || `http://${window.location.hostname}:7099`;

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [cartDetails, setCartDetails] = useState({ totalCartPrice: 0, quantity: 0, originalTotal: 0 });

  // UI state
  const [isShowHamberger, setIsShowHamberger] = useState(false);
  const [isHome, setIsHome] = useState(location.pathname.length <= 1);
  const [isShowCategories, setIsShowCategories] = useState(isHome);

  const [menus, setMenus] = useState([
    { name: "Trang chủ", path: ROUTERS.USER.HOMEPAGE },
    { name: "Về chúng tôi", path: ROUTERS.USER.ABOUT },
    { name: "Sản phẩm", path: ROUTERS.USER.PRODUCT, isShowSubmenu: false, child: [] },
    { name: "Blog", path: ROUTERS.USER.BLOG },
  ]);

  // ===== USER INFO =====
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await axios.get(`${USER_API}/api/Auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsername(response.data?.username ?? "");
      } catch (error) {
        console.error("Error fetching user info", error);
      }
    })();
  }, []);
  const handleLogout = () => { localStorage.removeItem("token"); setUsername(""); navigate(ROUTERS.USER.HOMEPAGE); };

  // ===== CATEGORIES =====
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const productApi = axios.create({ baseURL: PRODUCT_API });

    (async () => {
      try {
        const resp = await productApi.get("/api/Category");
        console.log("[Category] API =", PRODUCT_API, resp.status);
        const raw = Array.isArray(resp.data) ? resp.data : (resp.data?.categories ?? []);
        const cats = raw
          .map((c) => {
            const id = Number(c.categoryId ?? c.CategoryId ?? c.id ?? c.Id);
            if (!Number.isFinite(id)) return null;
            return {
              id,
              categoryId: id,
              name: c.name ?? c.Name ?? `Danh mục ${id}`,
              description: c.description ?? c.Description ?? "",
            };
          })
          .filter(Boolean);
        if (!alive) return;

        // bơm vào menu "Sản phẩm"
        setMenus((prev) =>
          prev.map((m) =>
            m.name === "Sản phẩm"
              ? {
                  ...m,
                  child: cats.map((cat) => ({
                    name: cat.name,
                    path: `${ROUTERS.USER.CATEGORY_PRODUCTS}/${cat.categoryId}`,
                  })),
                }
              : m
          )
        );

        setCategories(cats);
        setError("");
        setIsShowCategories(true);
      } catch (e) {
        if (!alive) return;
        console.error("[Category] ERROR:", { message: e.message, status: e.response?.status });
        setCategories([]);
        setError("Không thể tải danh mục!");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  // ===== BANNER & HOME TOGGLE =====
  useEffect(() => {
    const isHomeRoute = location.pathname === "/" || location.pathname === ROUTERS.USER.HOMEPAGE;
    setIsHome(isHomeRoute);
    setIsShowCategories(isHomeRoute);
  }, [location]);

  // ===== CART =====
  useEffect(() => {
    const fetchCart = async () => {
      const token = localStorage.getItem("token");
      if (!token) { setCartDetails({ quantity: 0, totalCartPrice: 0, originalTotal: 0 }); return; }
      try {
        const r = await axios.get(`${CART_API}/api/Cart/user-cart`, { headers: { Authorization: `Bearer ${token}` }});
        setCartDetails(r.status === 200 ? r.data : { quantity: 0, totalCartPrice: 0, originalTotal: 0 });
      } catch {
        setCartDetails({ quantity: 0, totalCartPrice: 0, originalTotal: 0 });
      }
    };
    const tick = () => fetchCart();
    const intv = setInterval(tick, 3000);
    tick();
    return () => clearInterval(intv);
  }, []);

  // ===== SEARCH =====
  const [searchTerm, setSearchTerm] = useState("");
  const handleSearch = (e) => { e.preventDefault(); if (searchTerm.trim()) navigate(`${ROUTERS.USER.SEARCHPAGE}?keyword=${encodeURIComponent(searchTerm)}`); };

  return (
    <>
      {/* Sidebar mobile */}
      <div className={`hamberger_menu_overlay ${isShowHamberger ? "active" : ""}`} onClick={() => setIsShowHamberger(false)} />
      <div className={`hamberger_menu_wrapper ${isShowHamberger ? "show" : ""}`}>
        <div className="header_logo"><h2>MoonLight</h2></div>
        <div className="hamberger_menu_cart">
          <ul>
            <li>
              <Link to={ROUTERS.USER.SHOPPING_CART}>
                <AiOutlineShoppingCart /><span>{cartDetails.quantity}</span>
              </Link>
            </li>
          </ul>
          <div className="header_cart_price">Giỏ hàng: <span>{formatter(cartDetails.originalTotal || 0)}</span></div>
        </div>
        <div className="hamberger_menu_widget">
          <div className="header_top_right_auth">
            {username ? (
              <span onClick={handleLogout} style={{ cursor: "pointer" }}>
                <AiOutlineLogout /> Đăng xuất
              </span>
            ) : (
              <Link to={ROUTERS.ADMIN.LOGIN}><AiOutlineUser /> <span>Đăng nhập</span></Link>
            )}
          </div>
        </div>
        <div className="hamberger_menu_nav">
          <ul>
            {menus.map((menu, i) => (
              <li key={i}>
                <Link
                  to={menu.path}
                  onClick={() => {
                    const next = [...menus];
                    next[i].isShowSubmenu = !next[i].isShowSubmenu;
                    setMenus(next);
                  }}
                >
                  {menu.name}
                  {menu.child && (menu.isShowSubmenu ? <AiOutlineDownCircle /> : <AiOutlineUpCircle />)}
                  {menu.child && (
                    <ul className={`header_menu_dropdown ${menu.isShowSubmenu ? "show_submenu" : ""}`}>
                      {menu.child.map((child, j) => (
                        <li key={`${i}-${j}`}><Link to={child.path}>{child.name}</Link></li>
                      ))}
                    </ul>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="hamberger_menu_context">
          <ul>
            <li><MdEmail /> moonlight@gmail.com</li>
            <li>Miễn phí đơn từ {formatter(5000000)}</li>
          </ul>
        </div>
      </div>

      {/* Header top */}
      <div className="header_top">
        <div className="container">
          <div className="row">
            <div className="col-6 header_top_left">
              <ul>
                <li><AiOutlineMail /><span>moonlight@gmail.com</span></li>
                <li>Miễn phí ship hàng đơn từ 5.000.000đ</li>
              </ul>
            </div>
            <div className="col-6 header_top_right">
              <ul>
                {username ? (
                  <>
                    <li className="name" onClick={() => navigate(ROUTERS.USER.MYACCOUNT)}>
                      <AiOutlineUser /> Xin chào, <span style={{ color: "#0d6efd" }}>{username}</span>
                    </li>
                    <li className="logout" onClick={handleLogout}><AiOutlineLogout /> Đăng xuất</li>
                  </>
                ) : (
                  <li onClick={() => navigate(ROUTERS.ADMIN.LOGIN)} style={{ cursor: "pointer" }}>
                    <AiOutlineUser /><span>Đăng nhập</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <marquee className="marquee-wrapper" behavior="scroll" direction="left" scrollamount="6">
        💥 Ưu đãi đặc biệt trong tuần này: Nhập voucher AnhDuyenSenxinhdep để giảm 50% cho đơn từ
        5.000.000đ! 💥 Mua 2 tặng 1 cho dòng trang sức cưới cao cấp!
      </marquee>

      {/* Logo + main menu */}
      <div className="container">
        <div className="row">
          <div className="col-lg-3"><div className="header_logo"><h1>MoonLight</h1></div></div>
          <div className="col-lg-6">
            <div className="header_menu">
              <ul>
                {menus.map((menu, i) => (
                  <li key={i} className={i === 0 ? "active" : ""}>
                    <Link to={menu.path}>{menu.name}</Link>
                    {menu.child && (
                      <ul className="header_menu_dropdown">
                        {menu.child.map((child, j) => (
                          <li key={`${i}-${j}`}><Link to={child.path}>{child.name}</Link></li>
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
              <div className="header_cart_price"><span>{formatter(cartDetails.originalTotal || 0)}</span></div>
              <ul>
                <li>
                  <Link to={ROUTERS.USER.SHOPPING_CART}>
                    <AiOutlineShoppingCart /><span>{cartDetails.quantity}</span>
                  </Link>
                </li>
              </ul>
            </div>
            <div className="banner_open"><AiOutlineMenu onClick={() => setIsShowHamberger(true)} /></div>
          </div>
        </div>
      </div>

      {/* Danh mục + search */}
      <div className="container">
        <div className="row here_categories_container">
          <div className="col-lg-3 col-md-12 col-sm-12 col-xs-12 here_categories">
            <div className="here_categories_all" onClick={() => setIsShowCategories(!isShowCategories)}>
              <AiOutlineMenu /> Danh sách sản phẩm
            </div>

            {isShowCategories && (
              <ul className="category_list">
                {loading ? (
                  <li>Đang tải...</li>
                ) : error ? (
                  <li>{error}</li>
                ) : (
                  categories.map((c) => (
                    <li key={c.categoryId}>
                      <Link to={`${ROUTERS.USER.CATEGORY_PRODUCTS}/${c.categoryId}`}>{c.name}</Link>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {/* Search + banner */}
          <div className="col-lg-9 col-md-12 col-sm-12 col-xs-12 here_search_container">
            <div className="here_search">
              <div className="here_search_form">
                <form onSubmit={handleSearch}>
                  <input type="text" placeholder="Bạn đang tìm gì?" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  <button type="submit" className="site-btn">Tìm kiếm</button>
                </form>
              </div>
              <div className="here_search_phone">
                <div className="here_search_phone_icon"><AiOutlinePhone /></div>
                <div className="here_search_phone_text"><p>+84 795793509</p><span>Hỗ trợ 24/7</span></div>
              </div>
            </div>

            {isHome && (
              <div className="here_items">
                <div className="here_items_text">
                  <span>Nét riêng định khí chất</span>
                  <h2>Sang trọng tối giản</h2>
                  <p>Mỗi thiết kế là một câu chuyện</p>
                  <Link to={ROUTERS.USER.PRODUCT} className="primary-btn">Mua ngay</Link>
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
