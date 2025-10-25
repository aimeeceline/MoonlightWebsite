import { memo, useState, useEffect } from "react";
import "./style.scss";
import axios from "axios";

const CART_API = process.env.REACT_APP_CART_API || `http://${window.location.hostname}:7099`;

const Quantity = ({
  product,
  hasAddToCart = true,
  initialQuantity = 1,
  onQuantityChange,
}) => {
  const [quantity, setQuantity] = useState(initialQuantity);
  const isOutOfStock = (product?.inventory ?? 0) <= 0;

  const getToken = () => {
    // Đổi 'token' -> đúng key mà flow đăng nhập đang lưu
    const raw = localStorage.getItem("token");
    if (!raw) return null;
    // Nếu người khác lỡ lưu kèm 'Bearer ' thì cắt đi
    return raw.startsWith("Bearer ") ? raw.slice(7) : raw;
  };

  const increaseQuantity = () => {
    setQuantity((prev) => {
      const newQty = prev + 1;
      onQuantityChange?.(newQty);
      return newQty;
    });
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => {
      const newQty = prev > 1 ? prev - 1 : 1;
      onQuantityChange?.(newQty);
      return newQty;
    });
  };

  const handleChange = (e) => {
    let value = parseInt(e.target.value, 10);
    if (Number.isNaN(value) || value < 1) value = 1;
    setQuantity(value);
    onQuantityChange?.(value);
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) {
      alert("Sản phẩm đã hết hàng!");
      return;
    }

    const token = getToken();
    if (!token) {
      alert("Vui lòng đăng nhập!");
      return;
    }

    const cartPayload = {
      items: [{ productId: product?.productId, quantity }]
    };


    try {
      const res = await axios.post(`${CART_API}/api/Cart/add`, cartPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Send add-to-cart', { productId: product?.productId, quantity });

      if (res.status === 200) {
        alert(`${quantity} sản phẩm đã được thêm vào giỏ hàng!`);
      } else {
        alert(`Không thể thêm sản phẩm vào giỏ hàng! (status ${res.status})`);
      }
    } catch (error) {
      // Log chi tiết để biết lỗi thật là gì
      console.error("Add to cart failed:", {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });

      // Phân nhánh lỗi rõ ràng
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        alert("Phiên đăng nhập không hợp lệ hoặc hết hạn. Vui lòng đăng nhập lại!");
      } else if (!status) {
        // network/CORS/SSL
        alert("Lỗi mạng/CORS/SSL khi gọi API. Kiểm tra console để xem chi tiết.");
      } else {
        const serverMsg =
          (typeof error?.response?.data === "string" && error.response.data) ||
          error?.response?.data?.message ||
          "Lỗi không xác định";
        alert(`Thêm vào giỏ hàng thất bại (${status}): ${serverMsg}`);
      }
    }
  };

  useEffect(() => {
    setQuantity(initialQuantity);
  }, [initialQuantity]);

  return (
    <div className="quantity_container">
      <div className="quantity">
        <span className="qtybtn" onClick={decreaseQuantity}>-</span>
        <input type="number" value={quantity} onChange={handleChange} min={1} />
        <span className="qtybtn" onClick={increaseQuantity}>+</span>
      </div>

      {hasAddToCart &&
        (!isOutOfStock ? (
          <button type="button" onClick={handleAddToCart} className="button-submit">
            Thêm vào giỏ hàng
          </button>
        ) : (
          <button
            type="button"
            className="button-submit disabled"
            onClick={() => alert("Sản phẩm này đã hết hàng")}
            disabled
          >
            Hết hàng
          </button>
        ))}
    </div>
  );
};

export default memo(Quantity);
