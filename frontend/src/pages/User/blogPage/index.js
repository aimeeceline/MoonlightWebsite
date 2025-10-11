import { useEffect, useState, memo } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import "./style.scss";
import Breadcrumb from "../theme/breadcrumb";

import call1ing from "assets/User/images/about/about_1.jpg";
import call2ing from "assets/User/images/about/about_2.jpg";
import call3ing from "assets/User/images/about/about_3.jpg";





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


const BlogPage = () => {

    useEffect(() => {
        AOS.init({ duration: 1000 });
    }, []);

    return (
        <>
        <Breadcrumb name ="Blog"/>
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
        </>
    );
};

export default memo(BlogPage);
