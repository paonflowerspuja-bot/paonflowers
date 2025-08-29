import React from "react";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { Link } from "react-router-dom";
const featuredFlowers = [
  {
    title: "Rose Elegance",
    image: "/src/assets/Birthday/85ea5ded-23dd-4a67-9640-c702c5f0b76c.jpg",
    price: "$2,999",
  },
  {
    title: "Lily Luxury",
    image: "/src/assets/Birthday/85ea5ded-23dd-4a67-9640-c702c5f0b76c.jpg",
    price: "$3,499",
  },
  {
    title: "Tulip Charm",
    image:
      "/Users/gauravkumar/Desktop/paon-flowers/client/client/src/assets/Birthday/85ea5ded-23dd-4a67-9640-c702c5f0b76c.jpg",
    price: "$2,799",
  },
  {
    title: "Orchid Grace",
    image: "/images/hero-bg.jpg",
    price: "$3,299",
  },
  {
    title: "Daisy Delight",
    image: "/images/hero-bg.jpg",
    price: "$2,599",
  },
  {
    title: "Peony Blush",
    image: "/images/hero-bg.jpg",
    price: "$3,899",
  },
];

const responsive = {
  superLargeDesktop: {
    breakpoint: { max: 4000, min: 1200 },
    items: 4,
  },
  desktop: {
    breakpoint: { max: 1200, min: 992 },
    items: 4,
  },
  tablet: {
    breakpoint: { max: 992, min: 768 },
    items: 2,
  },
  mobile: {
    breakpoint: { max: 768, min: 0 },
    items: 1,
  },
};

const FeaturedFlowers = () => {
  return (
    <section className="py-5  px-5 ">
      <div className="p-3 d-flex flex-column ">
        <div className="container text-center">
          <h2 className="mb-4 subheading2">Featured Flowers</h2>
          <Carousel
            responsive={responsive}
            infinite
            autoPlay={true}
            arrows={false}
            keyBoardControl
            containerClass="carousel-container"
            itemClass="px-3"
          >
            {featuredFlowers.map((flower, index) => (
              <div className="card h-100 shadow-sm" key={index}>
                <img src={flower.image} className="" alt={flower.title} />
                <div className=" ">
                  <h5 className="card-title">{flower.title}</h5>
                  <p className="card-text text-muted">{flower.price}</p>
                </div>
              </div>
            ))}
          </Carousel>
        </div>
        <div className="d-flex justify-content-center mt-5 ">
          {/* <button
            className="btn-pink rounded py-3 "
            style={{
              padding: "0 100px 0 100px",
            }}
          >
            SHOP OUR FEATURED
          </button> */}
          <Link
            to="/flowers/featured"
            className="btn-pink rounded py-3 "
            style={{
              padding: "0 100px 0 100px",
            }}
          >
            SHOP OUR FEATURED
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedFlowers;
