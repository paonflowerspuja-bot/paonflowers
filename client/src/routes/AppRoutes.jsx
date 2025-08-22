import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import Checkout from "../pages/Checkout/Checkout";
import OtpVerification from "../pages/Checkout/OtpVerification";
import OrderSuccess from "../pages/Checkout/OrderSuccess";
import Login from "../pages/user/Login";
import Signup from "../pages/user/Signup";

import ProtectedRoute from "../components/ProtectedRoute";
import AdminDashboard from "../pages/admin/AdminDashboard";
import ManageProducts from "../pages/admin/ManageProducts";
import ManageOrders from "../pages/admin/ManageOrders";
import ManageOffers from "../pages/admin/ ManageOffers";
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

import ShopAll from "../pages/ShopAll";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Home Page */}
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

        {/* Blog */}
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<BlogPost />} />

        {/* Other Pages */}
        <Route path="offers" element={<Offers />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="delivery" element={<Delivery />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="store-location" element={<StoreLocation />} />
        <Route path="nextday" element={<NextDay />} />
        <Route path="weddings" element={<Weddings />} />
        <Route path="custom-flowers" element={<CustomFlowers />} />

        {/* Protected Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />

        <Route
          path="/otp"
          element={
            <ProtectedRoute>
              <OtpVerification />
            </ProtectedRoute>
          }
        />

        <Route
          path="/order-success"
          element={
            <ProtectedRoute>
              <OrderSuccess />
            </ProtectedRoute>
          }
        />
        <Route path="/admin" element={<AdminDashboard />}>
          <Route path="products" element={<ManageProducts />} />
          <Route path="orders" element={<ManageOrders />} />
          <Route path="offers" element={<ManageOffers />} />
          <Route path="delivery" element={<DeliveryStatus />} />
          <Route path="customers" element={<Customers />} />
        </Route>

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
