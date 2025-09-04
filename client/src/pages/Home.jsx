import React from "react";
import { Link } from "react-router-dom";

import Testimonials from "./testimonials/Testimonials";
import WhyChooseUs from "./WhyChooseUs/WhyChooseUs";
import FeaturedFlowers from "./FeaturedFlowers/FeaturedFlowers";

// If you prefer bundling the Birthday image instead of relying on runtime path,
// uncomment this and use <img src={birthdayImg} .../>
// import birthdayImg from "/src/assets/Birthday/IMG_4759.JPG";

const Home = () => {
  return (
    <div className="card-bg">
      {/* HERO */}
      <div className="hero-bg-image">
        <div
          className="hero-safe d-flex flex-column justify-content-center align-items-center text-center mx-4"
          style={{ minHeight: "80vh" }}
        >
          <h1 className="heading mb-3 animate__animated animate__fadeInDown">
            Elegant Blooms for <br /> Every Occasion
          </h1>

          <p className="subheading mb-4 animate__animated animate__fadeInUp">
            Dubai’s premium flower shop for luxurious floral experiences.
          </p>

          {/* Always side-by-side; will wrap only if the screen is ultra narrow */}
          <div className="hero-cta animate__animated animate__fadeInUp mb-4">
            <Link to="/shop" className="luxury-btn text-decoration-none">
              Shop Now
            </Link>
            <Link to="/offers" className="luxury-btn text-decoration-none">
              Explore Offers
            </Link>
          </div>
        </div>
      </div>

      <FeaturedFlowers />

      {/* Section 1 */}
      <div className="container my-5 px-3 px-md-4">
        <div className="row align-items-center right-left-bg g-0">
          <div className="col-md-6 mb-4 mb-md-0 p-0">
            <img
              className="img-fluid right-left-image"
              src="/images/image1.jpg" /* from public/images */
              alt="Same day flower delivery"
              loading="lazy"
            />
          </div>
          <div className="col-md-6 text-md-end text-center p-4">
            <h2 className="heading2">Flowers Delivered TODAY</h2>
            <p className="text-decoration-underline mb-3">
              Let flowers save the day.
            </p>
            {/* Button: full-width on xs, inline on sm+ */}
            <div className="d-grid gap-2 d-sm-inline-block">
              <button className="btn-pink">Order Same Day</button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div className="container my-5 px-3 px-md-4">
        <div className="row align-items-center flex-md-row flex-column-reverse right-left-bg g-0">
          <div className="col-md-6 text-md-start text-center p-4">
            <h2 className="heading2 fw-bold">Birthday Bouquets that WOW</h2>
            <p className="text-decoration-underline mb-3">
              Not sure what to get them? Flowers are always a good idea.
            </p>
            <div className="d-grid gap-2 d-sm-inline-block">
              <Link
                to="/flowers/birthday"
                className="btn-pink text-decoration-none"
              >
                Shop Birthday
              </Link>
            </div>
          </div>
          <div className="col-md-6 mb-4 mb-md-0 p-0">
            <img
              className="img-fluid right-left-image2"
              src="/images/IMG_4759.JPG" /* or use imported birthdayImg */
              alt="Birthday flowers"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Section 3 */}
      <div className="container my-5 px-3 px-md-4">
        <div className="row align-items-center right-left-bg g-0">
          <div className="col-md-6 mb-4 mb-md-0 p-0">
            <img
              className="img-fluid right-left-image2"
              src="/images/paonshop.jpeg" /* from public/images */
              alt="Paon Flowers shop"
              loading="lazy"
            />
          </div>
          <div className="col-md-6 text-md-end text-center p-4">
            <h2 className="heading2">Visit Our Flower Shop</h2>
            <p className="text-decoration-underline mb-3">
              Shop for Paon at our location
            </p>
            <div className="d-grid gap-2 d-sm-inline-block">
              <Link
                to="/store-location"
                className="btn-pink text-decoration-none"
              >
                Shop URL
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Testimonials />
      <WhyChooseUs />
    </div>
  );
};

export default Home;
