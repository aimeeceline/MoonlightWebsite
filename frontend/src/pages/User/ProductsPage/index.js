// src/pages/User/product/index.js
import { memo, useEffect, useState } from "react";
import "./style.scss";
import Breadcrumb from "../theme/breadcrumb";
import { generatePath, Link } from "react-router-dom";
import { ROUTERS } from "utils/router";

import axios from "axios";
import { formatter } from "utils/fomatter";
import { AiOutlineEye, AiOutlineShoppingCart } from "react-icons/ai";

const ProductPage = () => {
  const sorts = [
    
    "Giá cao đến thấp",
    "Giá thấp đến cao",
    "Mới đến cũ",
    "Cũ đến mới",
    "Bán chạy",
    "Đang giảm giá",
  ];

  const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
  const fetchProduct = async () => {
    try {
      const res = await axios.get('https://localhost:7007/api/Product'); // dùng URL tương đối
      const list = Array.isArray(res.data) ? res.data : (res.data?.products || []);
      setProducts(list);
    } catch (err) {
      console.error(err);
      setError('Không thể tải sản phẩm!');
    } finally {
      setLoading(false);
    }
  };
  fetchProduct();
}, []);

  return (
    <>
      <Breadcrumb name="Danh sách sản phẩm" />

      <div className="container">
        <div className="row">
          {/* Cột trái: filter/sort */}
          <div className="col-lg-3 col-md-12 col-sm-12 col-xs-12">
            <div className="slidebar">
              <div className="slidebar_item">
                <h2>Tìm kiếm</h2>
                <input type="text" placeholder="Từ khoá..." />
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

          {/* Cột phải: danh sách */}
          <div className="col-lg-9 col-md-12 col-sm-12 col-xs-12">
            {loading && <p>Đang tải sản phẩm...</p>}
            {!!error && <p className="error-message">{error}</p>}
            {!loading && !error && products.length === 0 && (
              <p>Chưa có sản phẩm.</p>
            )}

            <div className="row">
              {(Array.isArray(products) ? products : []).map((item, index) => {
                const pid = item.productId ?? item.ProductId ?? item.id ?? item.Id;
                const imgUrl = `url(https://localhost:7007/images/${item.image})`;
                return (
                  <div className="col-lg-4 col-md-4 col-sm-6 col-xs-12" key={`${pid}-${index}`}>
                    <div className="featured_item pl-pr-10">
                      <div
                        className="featured_item_img"
                        style={{
                          backgroundImage: imgUrl,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        {item.inventory === 0 && (
                          <div className="out-of-stock-overlay">
                            <span className="title">Hết hàng</span>
                          </div>
                        )}
                        <ul className="featured_item_img_hover">
                          <li>
                            <Link to={generatePath(ROUTERS.USER.PRODUCTS, { productId: pid })}>
                              <AiOutlineEye />
                            </Link>
                          </li>
                          <li>
                            <Link to={generatePath(ROUTERS.USER.PRODUCTS, { productId: pid })}>
                              <AiOutlineShoppingCart />
                            </Link>
                          </li>
                        </ul>
                      </div>

                      <div className="featured_item_text">
                        <h6>
                          <Link to={generatePath(ROUTERS.USER.PRODUCTS, { productId: pid })}>
                            {item.name}
                          </Link>
                        </h6>
                        <h5>{formatter(item.price)}</h5>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pagination mẫu (chưa nối API) */}
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

export default memo(ProductPage);
