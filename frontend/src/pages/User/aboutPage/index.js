import { useEffect, memo } from "react";
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

// ===== dịch vụ nổi bật của tiệm trang sức =====
const features = [
  {
    icon: <FaCalendar />,
    title: "Đặt lịch tư vấn 1-1",
    description: "Chuyên viên gợi ý mẫu nhẫn, vòng, bông tai theo ngân sách và phong cách của bạn."
  },
  {
    icon: <FaStore />,
    title: "Xem hàng tại showroom",
    description: "Đặt online – đến cửa hàng thử size và kiểm tra đá trước khi nhận."
  },
  {
    icon: <FaBox />,
    title: "Hộp quà cao cấp",
    description: "Đóng gói sang trọng, phù hợp làm quà cưới, kỷ niệm, sinh nhật."
  }
];

// ===== bài viết / bộ sưu tập giới thiệu =====
const collections = [
  {
    image: call1ing,
    title: "Trang sức bạc cao cấp chống đen",
    desc: "MoonLight sử dụng bạc 925 phủ lớp bảo vệ giúp hạn chế oxy hóa, giữ được độ sáng bóng lâu hơn khi đeo hằng ngày."
  },
  {
    image: call2ing,
    title: "Vì sao đá CZ được ưa chuộng?",
    desc: "Đá Cubic Zirconia có độ lấp lánh gần giống kim cương, giá dễ tiếp cận, phù hợp cho bộ sưu tập quà tặng và trang sức đi tiệc."
  },
  {
    image: call3ing,
    title: "Chọn nhẫn theo dáng tay",
    desc: "Ngón tay thon nên chọn nhẫn đá to hoặc dáng oval, tay nhỏ nên chọn bản mảnh để tổng thể thanh lịch và tôn da."
  }
];

// ===== danh mục cửa hàng =====
const categories = [
  {
    image: call4ing,
    label: "NHẪN – RING"
  },
  {
    image: call5ing,
    label: "VÒNG CỔ – NECKLACE"
  },
  {
    image: call6ing,
    label: "BÔNG TAI – EARRING"
  }
];

const AboutPage = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <>
      <Breadcrumb name="Về chúng tôi" />
      <div className="about-page">
        {/* Giới thiệu thương hiệu */}
        <section className="collection-section" data-aos="fade-up">
          <div className="shop_intro_wrapper">
            <h1>MoonLight Jewelry</h1>
            <p className="shop_intro">
              MoonLight là thương hiệu trang sức hướng đến sự tinh tế và cảm xúc tặng quà.
              Chúng tôi chọn các chất liệu an toàn với da, thiết kế hiện đại nhưng vẫn nữ tính,
              phù hợp cả đi làm lẫn đi tiệc. Mỗi sản phẩm đều được kiểm tra kỹ về màu, độ bóng,
              và độ hoàn thiện trước khi giao đến khách hàng.
              <br />
              MoonLight tin rằng một món trang sức nhỏ cũng có thể kể câu chuyện của người tặng
              và người nhận – vì vậy chúng tôi luôn có dịch vụ khắc tên, hộp quà cao cấp, và
              tư vấn chọn mẫu theo dịp đặc biệt.
            </p>
          </div>

          <div className="collection-grid">
            {collections.map((item, index) => (
              <div className="collection-card" key={index}>
                <img src={item.image} alt={item.title} />
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
                <a href="#">XEM CHI TIẾT</a>
              </div>
            ))}
          </div>
        </section>

        {/* Dịch vụ */}
        <section className="features-section" data-aos="fade-up">
          {features.map((item, index) => (
            <div className="feature" key={index}>
              <i>{item.icon}</i>
              <h5>{item.title}</h5>
              <p>{item.description}</p>
            </div>
          ))}
        </section>

        {/* Danh mục */}
        <section className="shop-category-section" data-aos="fade-up">
          {categories.map((cat, index) => (
            <div className="category-card" key={index}>
              <img src={cat.image} alt={cat.label} />
              <p>{cat.label}</p>
            </div>
          ))}
        </section>

        {/* Feedback khách */}
        <section className="testimonial-section" data-aos="fade-up">
          <h2>Khách hàng nói gì về MoonLight</h2>
          <div className="testimonial-grid">
            <div className="testimonial-card">
              <p>“Mua nhẫn tặng bạn gái, hộp quà xịn mà giá vẫn ok, giao nhanh.”</p>
              <span>– Tuấn Minh, Quận 1</span>
            </div>
            <div className="testimonial-card">
              <p>“Bông tai đeo không bị ngứa tai, màu sáng đẹp, đúng kiểu mình muốn.”</p>
              <span>– Thảo Vy, Gò Vấp</span>
            </div>
            <div className="testimonial-card">
              <p>“Nhân viên tư vấn size vòng tay rất chi tiết, đóng gói sang.”</p>
              <span>– Mai Hương, Bình Thạnh</span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-banner" data-aos="zoom-in">
          <h2>Nhận ưu đãi trang sức mới</h2>
          <p>Đăng ký email để nhận thông báo bộ sưu tập mới, giảm giá theo mùa và quà tặng sinh nhật.</p>
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
