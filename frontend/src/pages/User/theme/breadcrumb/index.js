import { memo } from "react";
import "./style.scss";
import { Link } from "react-router-dom";
import { ROUTERS } from "utils/router";

const BreadCrumb = (props) => {
    return (
        <div className="breadcrumb">
            <div className="breadcrumb_text">
                <h2>Moonlight </h2>
                <div className="breadcrumb_option">
                    <ul>
                        <li className="link">
                            <Link to={ROUTERS.USER.HOMEPAGE}>Trang chủ</Link>
                        </li>
                        <li>
                            {props.name}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default memo(BreadCrumb);
