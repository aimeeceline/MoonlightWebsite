import React from "react";
import {ADMIN_PATH, ROUTERS} from "./utils/router"
import HomePage from "./pages/User/homePage";
import ProductPage from "./pages/User/ProductsPage";
import { Routes, Route, useLocation} from "react-router-dom";
import MasterLayout from "./pages/User/theme/masterlayout"
import ProductDetails from "pages/User/ProductDetails";
import ShoppingCart from "pages/User/ShoppingCart";
import CheckoutPage from "pages/User/checkoutPage";
import LoginPage from "pages/admin/LoginPage";
import MasterAdminLayout from "pages/admin/theme/masterAdminLayout";
import OrderPage from "pages/admin/OrderPage/index";
import OrderDetail from "pages/admin/OrderPage/orderdetail";
import UserPage from "pages/admin/UserPage/index";
import UserADCreatePage from "pages/admin/UserPage/create";


import CategoryPage from "pages/admin/CategoryPage/index";
import CategoryCreatePage from "pages/admin/CategoryPage/create";
import ProductADPage from "pages/admin/ProductADPage/index";
import ProductADCreatePage from "pages/admin/ProductADPage/create";
import ProductADEditPage from "pages/admin/ProductADPage/edit";
import ProductsCategoryPage from "pages/User/ProductsCategoryPage";
import AboutPage from "pages/User/aboutPage";
import BlogPage from "pages/User/blogPage";
import SearchResultPage from "pages/User/searchResultPage";
import RegisterPage from "pages/admin/RegisterPage";
import MessagePage from "pages/User/messagePage";
import MyOrderPage from "pages/User/myOrderPage";
import DashboardPage from "pages/admin/DashboardPage";
import DiscountPage from "pages/admin/DiscountPage";
import DiscountADCreatePage from "pages/admin/DiscountPage/create";
import OrderHistoryPage from "pages/User/orderHistoryPage";

const renderUserRouter = () => {
    const userRouter = [
        {
            path: ROUTERS.USER.HOME,
            Component: <HomePage/>
        },
        {
            path: ROUTERS.USER.HOMEPAGE,
            Component: <HomePage/>
        },
        {
            path: ROUTERS.USER.PRODUCT,
            Component: <ProductPage/>
        },
        {
            path: `${ROUTERS.USER.CATEGORY_PRODUCTS}/:categoryId`,
            Component: <ProductsCategoryPage/>
        },
        {
            
            path: ROUTERS.USER.PRODUCTS,
            Component: <ProductDetails/>
        },
        {
            path: ROUTERS.USER.SHOPPING_CART,
            Component: <ShoppingCart/>
        },
        {
            path: ROUTERS.USER.CHECKOUT,
            Component: <CheckoutPage/>
        },
        {
            path: ROUTERS.USER.ABOUT,
            Component: <AboutPage/>
        },
        {
            path: ROUTERS.USER.BLOG,
            Component: <BlogPage/>
        },
        {
            path: ROUTERS.USER.SEARCHPAGE,
            Component: <SearchResultPage/>
        },
        {
            path: ROUTERS.USER.MESSAGE,
            Component: <MessagePage/>
        },
        {
            path: ROUTERS.USER.MYACCOUNT,
            Component: <MyOrderPage/>
        },
        {
            path: ROUTERS.USER.ORDERHISTORY,
            Component: <OrderHistoryPage/>
        }
    ]
    
    return (
        <MasterLayout>
            <Routes>
                {
                    userRouter.map((item, key) => (
                        <Route key={key} path={item.path} element ={item.Component} />
                    ))
                }
            </Routes>
        </MasterLayout>
    )
}

const renderAdminRouter = () => {
    const adminRouters = [
        {
            path: ROUTERS.ADMIN.LOGIN,
            Component: <LoginPage/>
        },
        {
            path: ROUTERS.ADMIN.REGISTER,
            Component: <RegisterPage/>
        },
        {
            path: ROUTERS.ADMIN.USERAD,
            Component: <UserPage/>
        },
        
        {
            path: ROUTERS.ADMIN.CATEGORIES,
            Component: <CategoryPage/>
        },
        {
            path: ROUTERS.ADMIN.PRODUCTAD,
            Component: <ProductADPage/>
        },
        {
            path: ROUTERS.ADMIN.PRODUCTADCREATE,
            Component: <ProductADCreatePage/>
        },
        {
            path: `${ROUTERS.ADMIN.PRODUCTADEDIT}/:productId`,
            Component: <ProductADEditPage/>
        },
        {
            path: ROUTERS.ADMIN.ORDERS,
            Component: <OrderPage/>
        },
                {
            path: `${ROUTERS.ADMIN.DETAILORDERS}/:orderId`,
            Component: <OrderDetail/>
        },
        {
            path: ROUTERS.ADMIN.CREATECATEGORY,
            Component: <CategoryCreatePage/>
        },
        
        {
            path: ROUTERS.ADMIN.USERADCREATE,
            Component: <UserADCreatePage/>
        },
        {
            path: ROUTERS.ADMIN.DASHBOARD,
            Component: <DashboardPage/>
        },
        {
            path: ROUTERS.ADMIN.DISCOUNT,
            Component: <DiscountPage/>
        },
        {
            path: ROUTERS.ADMIN.DISCOUNTADCREATE,
            Component: <DiscountADCreatePage/>
        },
        
    ]
    return (
        <MasterAdminLayout>
            <Routes>
                {
                    adminRouters.map((item, key) => (
                        <Route key={key} path={item.path} element ={item.Component} />
                    ))
                }
            </Routes>
        </MasterAdminLayout>
    )
}

const RouterCustom = () => {
    const location = useLocation();
    const isAdminRouters = location.pathname.startsWith(ADMIN_PATH);
    return isAdminRouters? renderAdminRouter() : renderUserRouter();
    
};

export default RouterCustom;