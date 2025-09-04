import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaTwitter,
  FaPinterestP,
  FaInstagram,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-light text-dark pt-5">
      <Container>
        <Row>
          <Col xs={12} md={6} lg={3} className="mb-4">
            <div className="d-flex justify-content-start w-100">
              <Link to={"/"}>
                <img
                  src="/images/logo.png"
                  alt="Paon Logo"
                  style={{ height: "80px" }}
                />
              </Link>
            </div>
            <p>
              Elegant blooms for every occasion. Dubai’s luxury flower
              destination.
            </p>
          </Col>

          <Col xs={6} md={6} lg={3} className="mb-4">
            <h6>Explore</h6>
            <ul className="list-unstyled">
              <li>
                <Link to="/blog" className="footer-link">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="#" className="footer-link">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/about" className="footer-link">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="#" className="footer-link">
                  Contact
                </Link>
              </li>
            </ul>
          </Col>

          <Col xs={6} md={6} lg={3} className="mb-4">
            <h6>Customer Service</h6>
            <ul className="list-unstyled">
              <li>
                <Link to="#" className="footer-link">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to="#" className="footer-link">
                  Returns
                </Link>
              </li>
              <li>
                <Link to="#" className="footer-link">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="#" className="footer-link">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </Col>

          <Col xs={12} md={6} lg={3} className="mb-4">
            <h6>Contact Us</h6>
            <p>Email: Santosh@paonflowers.com</p>
            <p>Phone: ‪+971 54 507 8365‬</p>
            <p>Al Khawaneej 2, Abdulla Shakbot Ali Saeed Bld. Dubai, U.A.E</p>
          </Col>
        </Row>
        <div className="d-flex justify-content-center mt-4 mb-2 gap-3 fs-5 text-dark">
          <Link
            className="footer-link"
            to="https://www.facebook.com/share/16qQ5BgtfT/?mibextid=wwXIfr"
          >
            <FaFacebookF />
          </Link>

          <Link
            className="footer-link"
            to="https://www.instagram.com/paonflowers?igsh=M3FsMzY0aGdzbmt3&utm_source=qr"
          >
            <FaInstagram />
          </Link>
        </div>

        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} PAON Flowers. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
