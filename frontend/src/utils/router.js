export const ADMIN_PATH = "/quan-tri"
export const ROUTERS = {
    USER: {
        HOME: "/",
        HOMEPAGE:"/trang-chu",
        PROFILE:"thong_tin_ca_nhan",
        ABOUT:"/ve-chung-toi",
        PRODUCT:"/san-pham",
        CATEGORY_PRODUCTS: "/danh-muc/san-pham", 
        PRODUCTS: "/san-pham/chi-tiet/:productId",
        SHOPPING_CART: "/gio-hang",
        CHECKOUT: "/thanh-toan",
        BLOG:"/blog",
        LIENHE:"/lien-he",
        SEARCHPAGE:"/search",
        MESSAGE:"/message",
        MYACCOUNT:"/tai-khoan-cua-toi",
        ORDERHISTORY:"/don-hang",
    },
    ADMIN: {
        LOGIN:`${ADMIN_PATH}/dang-nhap`,
        REGISTER:`${ADMIN_PATH}/dang-ky`,

        DASHBOARD:`${ADMIN_PATH}/dashboard`,

        USERAD:`${ADMIN_PATH}/user`,
        USERADCREATE: `${ADMIN_PATH}/tao-moi-nguoi-dung`,
        USERADEDIT: `${ADMIN_PATH}/cap-nhat-nguoi-dung`,
        
        PRODUCTAD:`${ADMIN_PATH}/san-pham`,
        PRODUCTADCREATE: `${ADMIN_PATH}/tao-moi-san-pham`,
        PRODUCTADEDIT: `${ADMIN_PATH}/cap-nhat-san-pham`,

        CUSTOMES:`${ADMIN_PATH}/khach-hang`,

        

        CATEGORIES:`${ADMIN_PATH}/danh-muc`,
        CREATECATEGORY: `${ADMIN_PATH}/tao-moi-danh-muc`,
        EDITCATEGORY: `${ADMIN_PATH}/cap-nhat-danh-muc`,

        ORDERS:`${ADMIN_PATH}/don-hang`,
        EDITORDERS:`${ADMIN_PATH}/cap-nhat-don-hang`,
        DETAILORDERS:`${ADMIN_PATH}/chi-tiet-don-hang`,

        DISCOUNT:`${ADMIN_PATH}/ma-giam-gia`,
        DISCOUNTADCREATE:`${ADMIN_PATH}/tao-moi`,
        DISCOUNTADEDIT:`${ADMIN_PATH}/cap-nhat-thong-tin`,
        
    }
}