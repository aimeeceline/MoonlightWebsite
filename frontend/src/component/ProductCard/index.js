import { memo } from "react"
import "./style.scss";

import { AiOutlineEye, AiOutlineShoppingCart } from "react-icons/ai";
import { generatePath, Link } from "react-router-dom";
import {formatter} from "utils/fomatter"
import { ROUTERS } from "utils/router";

const ProductCard = ({image, name, price }) => {
    return (
        <>
            <div className="featured_item pl-pr-10 ">
                <div className="featured_item_img"
                    style={{
                        backgroundImage: `url(https://localhost:7007/images/${image})`
                    }}>
                    <ul className="featured_item_img_hover">
                        <li>
                            <AiOutlineEye />
                        </li>
                        <li>
                            <AiOutlineShoppingCart />
                        </li>
                    </ul>
                </div>
                <div className="featured_item_text">
                    <h6>                            
                        <Link to={generatePath(ROUTERS.USER.PRODUCTS, {productId:1})}>
                            {name}
                        </Link>
                    </h6>
                    <h5>{formatter(price)}</h5>
                </div>
            </div>      
        </>
    )
}

export default memo(ProductCard);