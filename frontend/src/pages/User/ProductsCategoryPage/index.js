import { memo, useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // Thêm useParams để lấy categoryId từ URL
import "./style.scss";
import Breadcrumb from "../theme/breadcrumb";
import { generatePath, Link } from "react-router-dom";
import { ROUTERS } from "utils/router";
import axios from "axios";
import { formatter } from "utils/fomatter";
import { AiOutlineEye, AiOutlineShoppingCart } from "react-icons/ai";

const ProductCategoryPage = () => {
    const sorts = [
        "Giá cao đến thấp",
        "Giá thấp đến cao",
        "Mới đến cũ",
        "Cũ đến mới",
        "Bán chạy",
        "Đang giảm giá",
    ];

    const { categoryId } = useParams(); // Lấy categoryId từ URL
    const [products, setProducts] = useState([]); // Sửa tên state từ product sang products
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
  let canceled = false;

  const fetchByCategory = async () => {
    // Nếu chưa có categoryId thì không gọi (hoặc bạn có thể fallback sang /api/Product)
    if (!categoryId) return;

    setLoading(true);
    try {
      // ✅ URL tương đối (đã có proxy trong package.json)
      const res = await axios.get(`https://localhost:7007/api/Category/category/${categoryId}`);

      // ✅ Chuẩn hoá shape trả về
      const raw =
        Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.products)
          ? res.data.products
          : [];

      if (!canceled) {
        setProducts(raw);
        setError(null);
      }
    } catch (err) {
      console.error("Lỗi khi lấy sản phẩm theo danh mục:", err);
      if (!canceled) {
        setProducts([]);
        setError("Không thể tải sản phẩm");
      }
    } finally {
      if (!canceled) setLoading(false);
    }
  };

  fetchByCategory();
  return () => { canceled = true; };
}, [categoryId]);


    return (
        <>
            <Breadcrumb name="Danh sách sản phẩm" />
            <div className="container">
                <div className="row">
                    {/* Cột bên trái */}
                    <div className="col-lg-3 col-md-12 col-sm-12 col-xs-12">
                        <div className="slidebar">
                            <div className="slidebar_item">
                                <h2>Tìm kiếm</h2>
                                <input type="text" />
                            </div>
                            <div className="slidebar_item">
                                <h2>Mức giá</h2>
                                <div className="price-range-wrap">
                                    <div>
                                        <p>Từ:</p>
                                        <input type="number" min={0} />
                                    </div>
                                    <div>
                                        <p>Đến:</p>
                                        <input type="number" min={0} />
                                    </div>
                                </div>
                            </div>
                            <div className="slidebar_item">
                                <h2>Sắp xếp</h2>
                                <div className="tags">
                                    {sorts.map((item, key) => (
                                        <div className={`tag ${key === 0 ? "active" : ""}`} key={key}>
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                        </div>
                    </div>
                    {/* Cột bên phải */}
                    <div className="col-lg-9 col-md-12 col-sm-12 col-xs-12">
                        <div className="row">
                            {loading ? (
                                <p>Đang tải sản phẩm...</p>
                            ) : error ? (
                                <p>{error}</p>
                            ) : (
                                products.map((item, index) => (
                                    <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12" key={index}>
                                        <div className="featured_item pl-pr-10">
                                            <div
                                                className="featured_item_img"
                                                style={{
                                                    backgroundImage: `url(https://localhost:7007/images/${item.image})`,
                                                    backgroundSize: "cover",
                                                    backgroundPosition: "center",
                                                }}
                                            >
                                                {/* Overlay khi hết hàng */}
                                                {item.inventory === 0 && (
                                                    <div className="out-of-stock-overlay">
                                                        <span className="title">Hết hàng</span>
                                                    </div>
                                                )}
                                                <ul className="featured_item_img_hover">
                                                    <li>
                                                                                                <Link to={generatePath(ROUTERS.USER.PRODUCTS, { productId: item.productId })} >

                                                        <AiOutlineEye />
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link to={generatePath(ROUTERS.USER.PRODUCTS, { productId: item.productId })} >
                                                            <AiOutlineShoppingCart />
                                                        </Link>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div className="featured_item_text">
                                                <h6>
                                                    <Link to={generatePath(ROUTERS.USER.PRODUCTS, { productId: item.productId })}>
                                                        {item.name}
                                                    </Link>
                                                </h6>
                                                <h5>{formatter(item.price)}</h5>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="product_footer">
                    <div className="product_pagination">
                        <div className="product_page-number">
                            <button type="button" className="product_page-btn">→</button>
                            <button type="button" className="product_page-btn product_page-btn--active">1</button>
                            <button type="button" className="product_page-btn">2</button>
                            <button type="button" className="product_page-btn">3</button>
                            <button type="button" className="product_page-btn">...</button>
                            <button type="button" className="product_page-btn">←</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default memo(ProductCategoryPage);
