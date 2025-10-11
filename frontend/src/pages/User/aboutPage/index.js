import { useEffect, useState, memo } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import "./style.scss";
import { FaCalendar, FaStore, FaBox } from "react-icons/fa";
import Breadcrumb from "../theme/breadcrumb";

import call1ing from "assets/User/images/about/about_1.jpg";
import call2ing from "assets/User/images/about/about_2.jpg";
import call3ing from "assets/User/images/about/about_3.jpg";

import call4ing from "assets/User/images/about/about_4.jpg";
import call5ing from "assets/User/images/about/about_5.jpg";
import call6ing from "assets/User/images/about/about_6.jpg";

import call7ing from "assets/User/images/about/about_7.jpg";
import call8ing from "assets/User/images/about/about_8.jpg";
import call9ing from "assets/User/images/about/about_9.jpg";
import call10ing from "assets/User/images/about/about_10.jpg";
import call11ing from "assets/User/images/about/about_11.jpg";
import call12ing from "assets/User/images/about/about_12.jpg";
import call13ing from "assets/User/images/about/about_13.jpg";
import call14ing from "assets/User/images/about/about_14.jpg";
import call15ing from "assets/User/images/about/about_15.jpg";

const features = [
    {
        icon: <FaCalendar />,
        title: "Book An Appointment",
        description: "Đặt lịch nhanh chóng và dễ dàng mọi lúc mọi nơi."
    },
    {
        icon: <FaStore />,
        title: "Pick Up In Store",
        description: "Mua online – nhận tại cửa hàng tiện lợi."
    },
    {
        icon: <FaBox />,
        title: "Special Packaging",
        description: "Đóng gói cao cấp – sẵn sàng để tặng."
    }
];

const collections = [
    {
        image: call1ing,
        title: "Serum Hoa Thảo có tốt không?",
        desc: "Serum Hoa Thảo sở hữu công thức làm sạch sâu, hỗ trợ giảm bã nhờn, thu nhỏ lỗ chân lông và nuôi dưỡng làn da sáng khỏe từ bên trong – là lựa chọn lý tưởng cho làn da cần detox mỗi ngày.",
    },
    {
        image: call2ing,
        title: "Tại sao nến của chúng tôi lại kỳ diệu?",
        desc: "Vì không chỉ là kem dưỡng thể, mà là 'ngọn nến' nuôi dưỡng làn da. Công thức cấp ẩm đột phá, thẩm thấu nhanh và hương thơm thư giãn khiến bạn muốn dùng mãi không thôi.",
    },
    {
        image: call3ing,
        title: "Quy trình chăm sóc da sẽ như thế nào?",
        desc: "Bắt đầu với Organic Cream – bước không thể thiếu giúp phục hồi độ ẩm, làm dịu làn da và bảo vệ da khỏi tác nhân môi trường. Dù là routine đơn giản hay phức tạp, đây chính là bước chốt hoàn hảo.",
    },
];


const categories = [
    {
        image: call4ing,
        label: "CHĂM SÓC DA"
    },
    {
        image: call5ing,
        label: "KEM DƯỠNG BODY"
    },
    {
        image: call6ing,
        label: "NƯỚC HOA"
    },
];

const allProducts = {
    "cosmetic": [
        {
            image: call7ing,
            title: "Serum Vitamin C",
            desc: "Sáng da, giảm thâm, phục hồi da sau mụn."
        },
        {
            image: call8ing,
            title: "Kem Dưỡng Ẩm 24h",
            desc: "Cấp nước tức thì, mềm mịn cả ngày dài."
        },
        {
            image: call9ing,
            title: "Nước hoa 100% từ thiên nhiên",
            desc: "Màu sắc quyến rũ – chất son bền lâu không khô môi."
        }
    ],
    "skincare": [
        {
            image: call13ing,
            title: "Mặt nạ dưỡng trắng",
            desc: "Thành phần thiên nhiên giúp sáng da an toàn."
        },
        {
            image: call14ing,
            title: "Sữa rửa mặt dịu nhẹ",
            desc: "Làm sạch mà không gây khô da."
        },
        {
            image: call15ing,
            title: "Nước tẩy trang",
            desc: "Màu sắc quyến rũ – chất son bền lâu không khô môi."
        }
    ],
    "makeup": [
        {
            image: call10ing,
            title: "Bảng phấn mắt",
            desc: "Che phủ khuyết điểm hoàn hảo."
        },
        {
            image: call11ing,
            title: "Bộ son 3CE",
            desc: "Cho đôi mắt lung linh suốt ngày dài."
        },
        {
            image: call12ing,
            title: "Son Lì 3CE",
            desc: "Màu sắc quyến rũ – chất son bền lâu không khô môi."
        }
    ]
};

const AboutPage = () => {
    const [activeTab, setActiveTab] = useState("cosmetic");

    useEffect(() => {
        AOS.init({ duration: 1000 });
    }, []);

    return (
        <>
            <Breadcrumb name ="Về chúng tôi"/>
        <div className="about-page">
            {/* Collection Section */}
            <section className="collection-section" data-aos="fade-up">
                <div className="shop_intro_wrapper">
                    <h1>Bae Beauty</h1>
                    <p className="shop_intro">Bae Beauty Boutique là một thương hiệu mỹ phẩm cam kết mang đến các sản phẩm chất lượng cao, 
                    giá cả phải chăng và phù hợp với mọi đối tượng. Với phương châm "Vẻ đẹp bắt đầu từ bạn", 
                    Bae Beauty tôn vinh vẻ đẹp tự nhiên và sự đa dạng của mỗi cá nhân. 
                    Thương hiệu cung cấp các sản phẩm trang điểm như son bóng, phấn phủ và dầu dưỡng môi, 
                    được làm từ các thành phần tự nhiên như dầu bơ, jojoba và squalane, đảm bảo an toàn và thân thiện với làn da. 
                    Tất cả sản phẩm đều được sản xuất theo tiêu chuẩn sạch, thuần chay và không thử nghiệm trên động vật. 
                    Bae Beauty hướng đến việc giúp bạn tự tin thể hiện cá tính và phong cách riêng của mình.</p>
                </div>
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

            {/* Features */}
            <section className="features-section" data-aos="fade-up">
                {features.map((item, index) => (
                    <div className="feature" key={index}>
                        <i>{item.icon}</i>
                        <h5>{item.title}</h5>
                        <p>{item.description}</p>
                    </div>
                ))}
            </section>

            {/* Shop Categories */}
            <section className="shop-category-section" data-aos="fade-up">
                {categories.map((cat, index) => (
                    <div className="category-card" key={index}>
                        <img src={cat.image} alt={cat.label} />
                        <p>{cat.label}</p>
                    </div>
                ))}
            </section>

            {/* Filter Tab & Cosmetics Section */}
            <section className="cosmetics-section" data-aos="fade-up">
                <h2>Sản phẩm nổi bật</h2>
                <div className="tab-buttons">
                    <button onClick={() => setActiveTab("cosmetic")} className={activeTab === "cosmetic" ? "active" : ""}>Mỹ phẩm</button>
                    <button onClick={() => setActiveTab("skincare")} className={activeTab === "skincare" ? "active" : ""}>Skincare</button>
                    <button onClick={() => setActiveTab("makeup")} className={activeTab === "makeup" ? "active" : ""}>Makeup</button>
                </div>
                <div className="cosmetic-grid">
                    {allProducts[activeTab].map((item, index) => (
                        <div className="cosmetic-card" key={index}>
                            <img src={item.image} alt={item.title} />
                            <h4>{item.title}</h4>
                            <p>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Skincare Services */}
            <section className="skincare-section" data-aos="fade-up">
                <h2>Dịch vụ chăm sóc da</h2>
                <ul className="skincare-list">
                    <li>🌿 Liệu trình làm sạch chuyên sâu</li>
                    <li>💧 Dưỡng ẩm chuyên biệt theo từng loại da</li>
                    <li>🌸 Trị liệu da mụn – da nhạy cảm</li>
                    <li>✨ Massage nâng cơ mặt & trẻ hoá da</li>
                </ul>
            </section>

            {/* Customer Testimonials */}
            <section className="testimonial-section" data-aos="fade-up">
                <h2>Khách hàng nói gì về chúng tôi</h2>
                <div className="testimonial-grid">
                    <div className="testimonial-card">
                        <p>“Tôi cực kỳ hài lòng với serum ở đây, da cải thiện rõ rệt chỉ sau 2 tuần!”</p>
                        <span>– Mai Trinh, Hà Nội</span>
                    </div>
                    <div className="testimonial-card">
                        <p>“Shop đóng gói rất đẹp, dùng làm quà tặng cực kỳ tinh tế.”</p>
                        <span>– Lan Anh, TP.HCM</span>
                    </div>
                    <div className="testimonial-card">
                        <p>“Dịch vụ chăm sóc da chuyên nghiệp, nhân viên dễ thương.”</p>
                        <span>– Ngọc Hân, Đà Nẵng</span>
                    </div>
                </div>
            </section>

            {/* CTA Banner */}
            <section className="cta-banner" data-aos="zoom-in">
                <h2>Đăng ký nhận ưu đãi & quà tặng</h2>
                <p>Nhập email để không bỏ lỡ những chương trình khuyến mãi hot nhất!</p>
                <form>
                    <input type="email" placeholder="Nhập email của bạn" />
                    <button type="submit">Đăng ký</button>
                </form>
            </section>
        </div>
        </>
    );
};

export default memo(AboutPage);
