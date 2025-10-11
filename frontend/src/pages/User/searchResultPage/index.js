import { useEffect, useState, memo } from "react";
import { useLocation, Link, generatePath } from "react-router-dom";
import { AiOutlineEye, AiOutlineShoppingCart } from "react-icons/ai";
import axios from "axios";
import "./style.scss";
import { ROUTERS } from "utils/router";
import { formatter } from "utils/fomatter";

const useQuery = () => new URLSearchParams(useLocation().search);

const SearchResultPage = () => {
    const query = useQuery();
    const keyword = query.get("keyword");
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchSearchResults = async () => {
            setLoading(true);
            try {
                const response = await axios.get(
                    `https://localhost:7007/api/Search?keyword=${encodeURIComponent(keyword)}`
                );
                setProducts(response.data);
                setError("");
            } catch (err) {
                console.error("Lỗi khi tìm kiếm:", err);
                setProducts([]); // clear kết quả cũ nếu có lỗi
            }
            setLoading(false);
        };

        if (keyword) {
            fetchSearchResults();
        }
    }, [keyword]);

    return (
        <div className="search_result container">
            <h2 className="search_result_title">
                Từ khóa: <strong className="text-primary">{keyword}</strong>
            </h2>

            {loading ? (
                <p>Đang tải kết quả...</p>
            ) : error ? (
                <p className="text-danger">{error}</p>
            ) : products.length === 0 ? (
                <p className="text-warning"> 🤣 Tiếc quá! Chắc là sản phẩm bạn tìm... chưa ra đời!" </p>
            ) : (
                <div className="row">
                    {products.map((item, index) => (
                        <div className="col-lg-3 col-md-4 col-sm-6 mb-4" key={index}>
                            <div className="featured_item pl-pr-10">
                                <div
                                    className="featured_item_img"
                                    style={{
                                        backgroundImage: `url(https://localhost:7007/images/${item.image})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        height: "220px",
                                    }}
                                >
                                    {/* Overlay khi hết hàng */}
                                    {item.inventory === 0 && (
                                        <div className="out-of-stock-overlay">
                                            <span className="title">Hết hàng</span>
                                        </div>
                                    )}
                                    <ul className="featured_item_img_hover">
                                        <li className="me-2 text-white">
                                            <AiOutlineEye />
                                        </li>
                                        <li>
                                            <Link
                                                to={generatePath(ROUTERS.USER.PRODUCTS, {
                                                    productId: item.productId,
                                                })}
                                                className="text-white"
                                            >
                                                <AiOutlineShoppingCart />
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="featured_item_text">
                                    <h6>
                                        <Link
                                            to={generatePath(ROUTERS.USER.PRODUCTS, {
                                                productId: item.productId,
                                            })}
                                            className="text-dark"
                                        >
                                            {item.name}
                                        </Link>
                                    </h6>
                                    <h5>{formatter(item.price)}</h5>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default memo(SearchResultPage);
