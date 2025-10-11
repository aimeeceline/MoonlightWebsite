import { memo, useEffect, useState } from "react";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import "./style.scss";
import { formatter } from "utils/fomatter";
import axios from "axios";
import { ROUTERS } from "utils/router";
import { generatePath, Link } from "react-router-dom";
import { AiOutlineEye, AiOutlineShoppingCart } from "react-icons/ai";

import call1ing from "assets/User/images/slider/slider_1.jpg";
import call2ing from "assets/User/images/slider/slider_2.jpg";
import call3ing from "assets/User/images/slider/slider_3.jpg";
import call4ing from "assets/User/images/slider/slider_4.jpg";

import banner1Img from "assets/User/images/product/1002_3.png";
import banner2Img from "assets/User/images/product/2003_4.png";
import Aos from "aos";

import about1ing from "assets/User/images/about/about_1.jpg";
import about2ing from "assets/User/images/about/about_2.jpg";
import about3ing from "assets/User/images/about/about_3.jpg";


const HomePage = () => {
    const collections = [
        {
            image: about1ing,
            title: "Một cặp nhẫn cưới là dấu ấn đặc biệt trong hành trình yêu của mọi cặp đôi.",
            desc: "Chẳng cần cầu kỳ hay xa xỉ, chỉ cần đủ chân thành và ý nghĩa, một thiết kế tinh giản cũng có thể ghi dấu cam kết trọn đời. Dù lễ cưới có giản dị hay rực rỡ, khoảnh khắc trao nhẫn vẫn mãi là thời khắc đáng nhớ, mở ra hành trình vun đắp tương lai bên nhau của hai trái tim đồng điệu.",
        },
        {
            image: about2ing,
            title: "Snow White",
            desc: "Snow White luôn được biết đến là nàng công chúa trong sáng với những ước mơ thuần khiết. Hình ảnh nàng Bạch Tuyết được gợi nhắc qua chiếc nơ đáng yêu, quả táo đỏ đặc trưng... sẽ được Disney | Moonlight mang đến trong những bộ sưu tập như một điểm nhấn về sự ngọt ngào cùng nàng loa sắc rạng ngời.",
        },
        {
            image: about3ing,
            title: "Quy trình chăm sóc da sẽ như thế nào?",
            desc: "Bắt đầu với Organic Cream – bước không thể thiếu giúp phục hồi độ ẩm, làm dịu làn da và bảo vệ da khỏi tác nhân môi trường. Dù là routine đơn giản hay phức tạp, đây chính là bước chốt hoàn hảo.",
        },
    ];

    useEffect(() => {
            Aos.init({ duration: 1000 });
        }, []);

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
  const fetchProduct = async () => {
    try {
      const res = await axios.get('https://localhost:7007/api/Product/san-pham-noi-bat'); // dùng URL tương đối
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
    
    const responsive = {
        superLargeDesktop: {
            breakpoint: { max: 4000, min: 3000 },
            items: 5,
        },
        desktop: {
            breakpoint: { max: 3000, min: 1024 },
            items: 3,
        },
        tablet: {
            breakpoint: { max: 1024, min: 464 },
            items: 2,
        },
        mobile: {
            breakpoint: { max: 464, min: 0 },
            items: 1,
        },
    };
    // Dữ liệu cho Slide
    const sliderItems = [
        { bgImg: call1ing, name: "Nhẫn" },
        { bgImg: call2ing, name: "Dây chuyền" },
        { bgImg: call3ing, name: "Bông tai" },
        { bgImg: call4ing, name: "Lắc tay" },
    ];

    const renderFeaturedProduct = (data) => {
        if (!data || data.length === 0) {
            return <p>Không có sản phẩm nổi bật.</p>;
        }

        return (
            <div className="row">
                {data.map((item, index) => (
                    <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12" key={index}>
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
                                        
                                            <AiOutlineShoppingCart />
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
                ))}
            </div>
        );
    };

    return (
        <>
            
            {/* Slide */}
            <div className="container container_categories_slider">
                <Carousel responsive={responsive} className="categories_slider">
                    {sliderItems.map((item, key) => (
                        <div
                            className="categories_slider_item"
                            key={key}
                            style={{
                                backgroundImage: `url(${item.bgImg})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                            }}
                        >
                            <p>{item.name}</p>
                        </div>
                    ))}
                </Carousel>
            </div>
            

            {/* Sản phẩm nổi bật */}
            <div className="container">
                <div className="featured">
                    <div className="section-title">
                        <h2>Sản phẩm nổi bật</h2>
                    </div>
                    {loading ? (
                        <p>Đang tải sản phẩm...</p>
                    ) : error ? (
                        <p>{error}</p>
                    ) : (
                        renderFeaturedProduct(products)
                    )}
                </div>
            </div>

            <div className="about-page">
                {/* Collection Section */}
                <section className="collection-section" data-aos="fade-up">
                    
                    <div className="collection-grid">
                        {collections.map((item, index) => (
                            <div className="collection-card" key={index}>
                                <img src={item.image} alt={item.title} />
                                <h4>{item.title}</h4>
                                <p>{item.desc}</p>
                                <a href="#">DISCOVER NOW</a>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

             {/*Banner End*/}
             <div className="container">
                <div className="banner">
                    <div className="banner_img col-lg-6">
                        <img src= {banner1Img} alt="banner" />
                    </div>
                    <div className="banner_img col-lg-6">
                        <img src= {banner2Img} alt="banner" />
                    </div>
                </div>
            </div>
        </>
    );
};

export default memo(HomePage);
