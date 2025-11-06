import { useEffect, memo } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import "./style.scss";
import Breadcrumb from "../theme/breadcrumb";

import call1ing from "assets/User/images/about/about_1.jpg";
import call2ing from "assets/User/images/about/about_2.jpg";
import call3ing from "assets/User/images/about/about_3.jpg";

// ===== nhóm bài blog 1 =====
const blogHighlight = [
  {
    image: call1ing,
    title: "Cách chọn nhẫn cầu hôn chuẩn size",
    desc: "Chỉ cần đo chu vi ngón áp út hoặc mượn tạm 1 chiếc nhẫn bạn ấy hay đeo, đối chiếu bảng size là bạn đã chọn được chiếc nhẫn vừa tay rồi."
  },
  {
    image: call2ing,
    title: "Phân biệt vàng trắng và bạc cao cấp",
    desc: "Vàng trắng có độ bền và giá trị cao hơn, ánh màu ấm nhẹ. Bạc 925 sáng, dễ đeo hằng ngày và giá mềm hơn – phù hợp làm quà tặng."
  },
  {
    image: call3ing,
    title: "Bí quyết bảo quản trang sức bạc không bị đen",
    desc: "Tránh hóa chất, cất trong hộp kín, lau lại sau khi đeo và dùng dung dịch chuyên dụng sẽ giúp trang sức của bạn luôn sáng bóng."
  }
];

// ===== nhóm bài blog 2 =====
const blogTrends = [
  {
    image: call2ing,
    title: "Xu hướng trang sức 2025",
    desc: "Trang sức bản mảnh, kết hợp đá màu pastel và các mẫu khắc tên cá nhân hóa đang được yêu thích bởi giới trẻ."
  },
  {
    image: call3ing,
    title: "Gợi ý quà tặng dịp kỷ niệm",
    desc: "Vòng cổ mặt tròn khắc chữ, vòng tay đôi hoặc nhẫn cặp là 3 lựa chọn an toàn, sang mà vẫn thể hiện được sự trân trọng."
  },
  {
    image: call1ing,
    title: "Chọn bông tai theo khuôn mặt",
    desc: "Mặt tròn hợp dáng dài và thẳng; mặt dài nên chọn bông tai tròn hoặc chữ C để tạo cân đối."
  }
];

const BlogPage = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <>
      <Breadcrumb name="Blog" />
      <div className="about-page">
        {/* Blog mới nhất */}
        <section className="collection-section" data-aos="fade-up">
          <div className="collection-grid">
            {blogHighlight.map((item, index) => (
              <div className="collection-card" key={index}>
                <img src={item.image} alt={item.title} />
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
                <a href="#">XEM BÀI VIẾT</a>
              </div>
            ))}
          </div>
        </section>

        {/* Xu hướng / gợi ý */}
        <section className="collection-section" data-aos="fade-up">
          <div className="collection-grid">
            {blogTrends.map((item, index) => (
              <div className="collection-card" key={index}>
                <img src={item.image} alt={item.title} />
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
                <a href="#">XEM BÀI VIẾT</a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
};

export default memo(BlogPage);
