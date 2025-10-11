import { memo } from "react";
import { Link } from "react-router-dom";
import "./style.scss"
import { AiOutlineFacebook, AiOutlineGoogle, AiOutlineInstagram, AiOutlineTwitter } from "react-icons/ai";
import { ROUTERS } from "utils/router";

const Footer = () => {
    return <footer className="footer">
        <div className="container">
            <div className="row">
                <div className="col-lg-3 col-md-6 col-sm-6 col-xs-12">
                    <div className="footer_about">
                    
                        <h1 className="footer_about_logo">MoonLight</h1>
                        <ul>
                            <li>Địa chỉ: Đại học Sài Gòn</li>
                            <li>SĐT: (+84) 795793509</li>
                            <li>Email: moonlight@gmail.com</li>
                        </ul>
                    </div>
                </div>
                <div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
                                            <div className="footer_widget">
                        <h6>Dịch vụ khách hàng</h6>
                        <ul>
                            <li>
                                <Link to="">Mua hàng trả góp</Link>
                            </li>
                            <li>
                                <Link to="">Chính sách hoàn tiền</Link>
                            </li>
                            <li>
                                <Link to="">Chính sách giao hàng</Link>
                            </li>
                        </ul>
                        <ul>
                            <li>
                                <Link to="">Tuyển dụng</Link>
                            </li>
                            <li>
                                <Link to="">Kiểm định kim cương</Link>
                            </li>
                            <li>
                                <Link to="">Kinh doanh sỉ</Link>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="col-lg-3 col-md-12 col-sm-12 col-xs-12">
                    <div className="footer_widget">
                        <h6>Khuyến mãi & Ưu đãi</h6>
                        <p>Đăng ký nhận thông tin tại đây</p>
                        <form action="#">
                            <div className="input-group">
                                <input type="text" placeholder="Nhập email" />
                                <button type="submit" className="button-submit">
                                    Đăng ký
                                </button>
                            </div>
                            
                        </form>
                    </div>
                </div>
            </div>
        <div className="footer-inner">
          <span>Copyright © 2025 All Rights Reserved</span>
          <Link to={ROUTERS.USER.HOMEPAGE} className="footer-home">Trang chủ</Link>
        </div>
        </div>
    </footer>;
};

export default memo(Footer);
