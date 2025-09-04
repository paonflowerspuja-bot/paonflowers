// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import Layout from "../layout/Layout";

import Home from "../pages/Home";
import Flowers from "../pages/flowers/Flowers";
import Offers from "../pages/offers/Offers";
import FAQ from "../pages/faq/FAQ";
import Delivery from "../pages/delivery/Delivery";
import NotFound from "../pages/NotFound";

import Birthday from "../pages/flowers/Birthday";
import ValentineDay from "../pages/flowers/ValentineDay";
import GraduationDay from "../pages/flowers/GraduationDay";
import NewBaby from "../pages/flowers/NewBaby";
import Eid from "../pages/flowers/Eid";
import MothersDay from "../pages/flowers/MothersDay";
import BridalBoutique from "../pages/flowers/BridalBoutique";

import Cart from "../pages/cart/Cart";
import WhatsAppCheckout from "../pages/Checkout/WhatsAppCheckout";
import OtpVerification from "../pages/Checkout/OtpVerification";
import OrderSuccess from "../pages/Checkout/OrderSuccess";
import Login from "../pages/user/Login";
import Signup from "../pages/user/Signup";

import ProtectedRoute from "../components/ProtectedRoute";

import AdminDashboard from "../pages/admin/AdminDashboard";
import ManageProducts from "../pages/admin/ManageProducts";
import ManageOrders from "../pages/admin/ManageOrders";
import ManageOffers from "/src/pages/admin/ ManageOffers.jsx"; // ← fixed path (no space)
import DeliveryStatus from "../pages/admin/DeliveryStatus";
import Customers from "../pages/admin/Customers";

import Profile from "../pages/user/profileIcon/Profile";
import Orders from "../pages/user/profileIcon/Orders";

import StoreLocation from "../pages/location/StoreLocation";

import Blog from "../pages/blog/Blog";
import BlogPost from "../pages/blog/BlogPost";
import NextDay from "../pages/NextDay/NextDay";
import Weddings from "../pages/weddings/Weddings";
import CustomFlowers from "../pages/customization/CustomFlowers";
import FeaturedFlowers from "../pages/FeaturedFlowers";
import ShopAll from "../pages/ShopAll";
import AboutPaonFlowers from "../pages/AboutPaonFlowers.jsx";

// If you have an AdminRoute, you can wrap the /admin element with it.
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public site shell */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<ShopAll />} />

        {/* Flower Categories */}
        <Route path="flowers" element={<Flowers />} />
        <Route path="flowers/birthday" element={<Birthday />} />
        <Route path="flowers/valentine" element={<ValentineDay />} />
        <Route path="flowers/GraduationDay" element={<GraduationDay />} />
        <Route path="flowers/newbaby" element={<NewBaby />} />
        <Route path="flowers/Eid" element={<Eid />} />
        <Route path="flowers/MothersDay" element={<MothersDay />} />
        <Route path="flowers/BridalBoutique" element={<BridalBoutique />} />
        <Route path="flowers/featured" element={<FeaturedFlowers />} />

        {/* Blog */}
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<BlogPost />} />

        {/* Other Pages */}
        <Route path="offers" element={<Offers />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="delivery" element={<Delivery />} />
        <Route path="cart" element={<Cart />} />
        <Route path="store-location" element={<StoreLocation />} />
        <Route path="nextday" element={<NextDay />} />
        <Route path="weddings" element={<Weddings />} />
        <Route path="custom-flowers" element={<CustomFlowers />} />
        <Route path="about" element={<AboutPaonFlowers />} />

        {/* Protected user routes */}
        <Route path="profile" element={<Profile />} />
        <Route
          path="orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <WhatsAppCheckout />
            </ProtectedRoute>
          }
        />
        <Route
          path="otp"
          element={
            <ProtectedRoute>
              <OtpVerification />
            </ProtectedRoute>
          }
        />
        <Route
          path="order-success"
          element={
            <ProtectedRoute>
              <OrderSuccess />
            </ProtectedRoute>
          }
        />

        {/* Public auth */}
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />

        {/* Public 404 (for unknown public paths) */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin shell OUTSIDE the public <Layout /> */}
      <Route path="/admin" element={<AdminDashboard />}>
        <Route index element={<></>} /> {/* overview in AdminDashboard */}
        <Route path="products" element={<ManageProducts />} />
        <Route path="orders" element={<ManageOrders />} />
        <Route path="offers" element={<ManageOffers />} />
        <Route path="delivery" element={<DeliveryStatus />} />
        <Route path="customers" element={<Customers />} />
        {/* Optional: Admin-only 404 */}
        {/* <Route path="*" element={<AdminNotFound />} /> */}
      </Route>

      {/* Global 404 fallback for anything else not matched */}
      {/* <Route path="*" element={<NotFound />} />  // optional */}
    </Routes>
  );
};

export default AppRoutes;
