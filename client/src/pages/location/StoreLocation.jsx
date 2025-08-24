import React from "react";

const StoreLocation = () => {
  return (
    <div className="store-container">
      <h1 className="store-title">Our Store Location</h1>
      <p className="store-description">
        Visit our store to explore premium flower collections and enjoy a
        personalized experience. 🌸
      </p>

      {/* Map Embed */}
      <div className="map-container">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3609.418205917287!2d55.5021291!3d25.223789!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f5cc9c9e8f3fb%3A0x3e32d8b68b7d2362!2s6GF3%2BGV8%20Dubai%20-%20United%20Arab%20Emirates!5e0!3m2!1sen!2sin!4v1691687560000!5m2!1sen!2sin"
          width="100%"
          height="450"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Store Location"
        ></iframe>
      </div>

      {/* Store Details Section */}
      <div className="store-details">
        <div className="detail-card">
          <h3> Address</h3>
          <p>Al Khawaneej 2, Abdulla Shakbot Ali Saeed Bld. Dubai, U.A.E</p>
        </div>

        <div className="detail-card">
          <h3> Opening Hours</h3>
          <p>Mon - Sun: 10:00 AM - 11:00 PM</p>
        </div>

        <div className="detail-card">
          <h3> Contact</h3>
          <p>+971 56 408 2871</p>
          <p>Email: Santosh@paonflowers.com</p>
        </div>
      </div>
    </div>
  );
};

export default StoreLocation;
