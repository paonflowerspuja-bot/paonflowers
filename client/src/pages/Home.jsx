import React from "react";
import { Link } from "react-router-dom";

import Testimonials from "./testimonials/Testimonials";
import WhyChooseUs from "./WhyChooseUs/WhyChooseUs";
import FeaturedFlowers from "./FeaturedFlowers/FeaturedFlowers";
const Home = () => {
  return (
    <div className=" card-bg">
      <div className="hero-bg-image  ">
        <div className=" d-flex flex-column justify-content-center align-items-center vh-100 text-center mx-4  ">
          <h1 className=" heading  mb-3 mt-5 pt-5 animate__animated animate__fadeInDown ">
            Elegant Blooms for Every <br /> Occasion
          </h1>
          <p className="subheading mb-4  animate__animated animate__fadeInUp">
            Dubai’s premium flower shop for luxurious floral experiences.
          </p>
          <div
            className="d-flex gap-3  animate__animated animate__fadeInUp "
            style={{ marginBottom: "100px" }}
          >
            <Link to="/shop" className="luxury-btn text-decoration-none ">
              Shop Now
            </Link>
            <Link to="/offers" className="luxury-btn text-decoration-none  ">
              Explore Offers
            </Link>
          </div>
        </div>
      </div>
      <FeaturedFlowers />
      <div className="container my-5">
        <div className="row align-items-center right-left-bg ">
          <div className="col-md-6 mb-4 mb-md-0 p-0">
            <img
              className="img-fluid right-left-image"
              src="/public/images/image1.jpg"
              alt="Flowers Delivered"
            />
          </div>
          <div className="col-md-6 text-md-end text-center ">
            <h1 className="heading2">Flowers Delivered TODAY</h1>
            <p className="text-decoration-underline">
              Let flowers save the day.
            </p>
            <button className="btn-pink">Order Same Day</button>
          </div>
        </div>
      </div>

      <div className="container my-5">
        <div className="row align-items-center flex-md-row flex-column-reverse right-left-bg ">
          <div className="col-md-6 text-md-start text-center">
            <h1 className="heading2 fw-bold">Birthday Bouquets that WOW</h1>
            <p className="text-decoration-underline">
              Not sure what to get them? Flowers are always a good idea.
            </p>
            <button className="btn-pink">Shop Birthday</button>
          </div>
          <div className="col-md-6 mb-4 mb-md-0 p-0">
            <img
              className="img-fluid right-left-image2 "
              src="/src/assets/Birthday/IMG_4759.JPG"
              alt="Birthday Flowers"
            />
          </div>
        </div>
      </div>

      <div className="container my-5">
        <div className="row align-items-center right-left-bg p-0 ">
          <div className="col-md-6 mb-4 mb-md-0 p-0">
            <img
              className="img-fluid right-left-image2"
              src="/public/images/paonshop.jpeg"
              alt="Shop Image"
            />
          </div>
          <div className="col-md-6 text-md-end text-center">
            <h1 className="heading2">Visit Our Flower Shop</h1>
            <p className="text-decoration-underline">
              Shop for Paon at our location
            </p>
            <Link
              to="/store-location"
              className="btn-pink text-decoration-none"
            >
              Shop URL
            </Link>
          </div>
        </div>
      </div>

      <Testimonials />
      <WhyChooseUs />
    </div>
  );
};

export default Home;
