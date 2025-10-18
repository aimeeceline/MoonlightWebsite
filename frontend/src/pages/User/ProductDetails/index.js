// src/pages/User/product-details/index.js
import { memo, useEffect, useState } from "react";
import "./style.scss";
import Breadcrumb from "../theme/breadcrumb";
import { AiOutlineEye, AiOutlineShoppingCart } from "react-icons/ai";
import { formatter } from "utils/fomatter";
import Quantity from "component/Quantity";
import { generatePath, Link, useParams } from "react-router-dom";
import axios from "axios";
import { ROUTERS } from "utils/router";

// === API base URL cho Product ===
const PRODUCT_API =
  process.env.REACT_APP_PRODUCT_API || `http://${window.location.hostname}:7007`;

// Helper ảnh: nếu BE trả sẵn full URL thì dùng luôn; nếu chỉ là tên file -> nối PRODUCT_API/images/...
const buildImg = (name) => {
  if (!name) return "";
  if (typeof name === "string" && /^https?:\/\//i.test(name)) return name;
  return `${PRODUCT_API}/images/${name}`;
};

const ProductDetails = () => {
  const { productId } = useParams();
  const productApi = axios.create({ baseURL: PRODUCT_API });

  // Chi tiết
  const [product, setProduct] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorDetail, setErrorDetail] = useState("");

  // Gợi ý (sản phẩm nổi bật)
  const [hot, setHot] = useState([]);
  const [loadingHot, setLoadingHot] = useState(false);

  // Số lượng mua
  const [quantity, setQuantity] = useState(1);

  // Scroll khi đổi product
  useEffect(() => {
    window.scrollTo({ top: 400, left: 0, behavior: "smooth" });
  }, [productId]);

  // ====== Fetch chi tiết sản phẩm ======
  useEffect(() => {
    if (!productId) return;

    const ctrl = new AbortController();

    const fetchDetail = async () => {
      setLoadingDetail(true);
      setErrorDetail("");
      setProduct(null);

      try {
        const { data } = await productApi.get(`/api/Product/${productId}`, {
          signal: ctrl.signal,
        });

        // Chuẩn hoá shape trả về
        const item = data?.product ?? data ?? null;

        // Nếu không có id hợp lệ => coi như không tìm thấy
        const pid =
          item?.productId ?? item?.ProductId ?? item?.id ?? item?.Id ?? null;

        if (!item || !pid) {
          throw new Error("NOT_FOUND");
        }

        setProduct(item);
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error("Fetch product detail error:", err);
        setErrorDetail("Không thể tải chi tiết sản phẩm!");
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetail();
    return () => ctrl.abort();
  }, [productId]); // cố ý không đưa productApi vào deps để tránh refetch vòng lặp

  // ====== Fetch “sản phẩm tương tự” (nổi bật) — loại trừ sp hiện tại & chỉ lấy 4 cái ======
  useEffect(() => {
    if (!productId) return;

    const ctrl = new AbortController();
    let canceled = false;

    (async () => {
      try {
        setLoadingHot(true);

        const { data } = await productApi.get(`/api/Product/san-pham-noi-bat`, {
          signal: ctrl.signal,
        });

        const list = Array.isArray(data)
          ? data
          : data?.products ?? data?.data ?? [];

        // ❗️Loại bỏ sản phẩm đang xem
        const currentId = Number(productId);
        const filtered = (list || []).filter((x) => {
          const pid = Number(x.productId ?? x.ProductId ?? x.id ?? x.Id);
          return Number.isFinite(pid) && pid !== currentId;
        });

        // ✅ Chỉ lấy 4 sp
const top4 = filtered.slice().sort(() => Math.random() - 0.5).slice(0, 4);
        if (!canceled) setHot(top4);
      } catch (e) {
        if (!axios.isCancel(e)) {
          console.error(e);
          if (!canceled) setHot([]);
        }
      } finally {
        if (!canceled) setLoadingHot(false);
      }
    })();

    return () => {
      canceled = true;
      ctrl.abort();
    };
  }, [productId]); // cố ý không đưa productApi vào deps để ổn định

  return (
    <>
      <Breadcrumb name="Chi tiết sản phẩm" />

      <div className="container">
        {loadingDetail && <p>Đang tải dữ liệu...</p>}
        {!!errorDetail && <p className="error-message">{errorDetail}</p>}

        {product && (
          <>
            <div className="row">
              <div className="col-lg-6 col-xl-12 col-md-12 col-sm-12 col-xs-12 product_details_pic">
                <div className="product_details_picture position-relative">
                  <img
                    src={buildImg(product.image)}
                    alt="product-main"
                    style={{ borderRadius: "6px" }}
                  />

                  {product.inventory === 0 && (
                    <div className="out-of-stock-overlay">
                      <span className="title">Hết hàng</span>
                    </div>
                  )}
                </div>

                <div className="main">
                  <img src={buildImg(product.image1)} alt="product-1" />
                  <img src={buildImg(product.image2)} alt="product-2" />
                  <img src={buildImg(product.image3)} alt="product-3" />
                </div>
              </div>

              <div className="col-lg-6 col-xl-12 col-md-12 col-sm-12 col-xs-12 product_details_text">
                <h2>{product.name}</h2>

                <div className="seen_icon">
                  <AiOutlineEye />
                  {`${product.viewCount} (lượt đã xem)`}
                </div>

                <h2>{formatter(product.price)}</h2>

                <p>{product.description}</p>

                <Quantity
                  product={product}
                  quantity={quantity}
                  setQuantity={setQuantity}
                />

                <ul>
                  <li>
                    <b>Số lượng:</b>&emsp; <span>{product.inventory}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="product_details_tab">
              <h4>Thông tin chi tiết</h4>
              <div>
                <ul>
                  <li>
                    <p>{product.descriptionDetails}</p>
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}

        <div className="section_title">
          <h2>Sản phẩm tương tự</h2>
        </div>

        {loadingHot && <p>Đang tải gợi ý...</p>}

        <div className="row">
          {(Array.isArray(hot) ? hot : []).map((item, index) => {
            const pid =
              item.productId ?? item.ProductId ?? item.id ?? item.Id ?? null;
            if (!pid) return null;

            const imgUrl = buildImg(item.image);

            return (
              <div
                className="col-lg-3 col-md-4 col-sm-6 col-xs-12"
                key={`${pid}-${index}`}
              >
                <div className="featured_item pl-pr-10">
                  <div
                    className="featured_item_img"
                    style={{
                      backgroundImage: `url(${imgUrl})`,
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
                        <Link
                          to={generatePath(ROUTERS.USER.PRODUCTS, {
                            productId: pid,
                          })}
                        >
                          <AiOutlineEye />
                        </Link>
                      </li>
                      <li>
                        <AiOutlineShoppingCart />
                      </li>
                    </ul>
                  </div>

                  <div className="featured_item_text">
                    <h6>{item.name}</h6>
                    <h5>{formatter(item.price)}</h5>
                  </div>
                </div>
              </div>
            );
          })}

          {!loadingHot && hot.length === 0 && (
            <div className="col-12">
              <p>Không có sản phẩm tương tự.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default memo(ProductDetails);
