import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="landing-page">
      <header className="hero-section" id="hero">
        <div className="container">
          <div className="hero-content">
            <span className="badge">Simplified Career Tracking</span>
            <h1>Job Tracker <br />Design Your Future</h1>
            <p>Take control of your job search. Track applications, manage company details, and follow your progress
              from application to offer — all in one organized dashboard designed for the modern seeker.</p>
            <div className="hero-actions">
              <Link to="/login" className="start-btn">Get Started Now</Link>
              <a href="#services" className="explore-btn">Explore Features</a>
            </div>
          </div>
        </div>
      </header>

      <section className="image-section">
        <div className="container">
          <div className="image-wrapper">
            <img src="/assets/Landingimage.jpg" alt="Career Management Dashboard" className="main-landing-image" />
          </div>
        </div>
      </section>

      <section className="services-section" id="services">
        <div className="container">
          <div className="section-header">
            <span className="sub-title">Features</span>
            <h2 className="decorative-title">Our services</h2>
          </div>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-search"></i></div>
              <h3>Job Search</h3>
              <p>Discover thousands of opportunities across different industries and locations with advanced filtering.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-tasks"></i></div>
              <h3>Application Tracking</h3>
              <p>Keep a clear record of every application. Track statuses from 'Applied' to 'Hired' effortlessly.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-calendar-check"></i></div>
              <h3>Interview Management</h3>
              <p>Never miss an interview. Manage rounds, dates, and feedback with our structured interview tracker.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-user-circle"></i></div>
              <h3>Profile Building</h3>
              <p>Showcase your skills and experience with a professional profile that employers will love.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="container">
          <div className="section-header">
            <span className="sub-title">Get In Touch</span>
            <h2 className="decorative-title">Contact Us</h2>
          </div>
          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-icon"><i className="fas fa-phone"></i></div>
              <h3>Contact Us</h3>
              <p>+997-9803016355 <br />+977 976-2800739</p>
            </div>
            <div className="contact-card">
              <div className="contact-icon"><i className="fas fa-map-marker-alt"></i></div>
              <h3>Location</h3>
              <p>Thapathali, Kathmandu</p>
            </div>
            <div className="contact-card">
              <div className="contact-icon"><i className="fas fa-share-alt"></i></div>
              <h3>Follow Us</h3>
              <div className="social-links" style={{ justifyContent: 'center', marginTop: '12px', gap: '24px' ,marginRight:'5px'}}>
                <a href="https://github.com/lyrain07"><i className="fab fa-github"></i></a>
                <a href="mailto:reemashrestha2019@gmail.com"><i className="fas fa-envelope"></i></a>
                <a href="https://www.facebook.com/0rain.7"><i className="fab fa-facebook"></i></a>
                <a href="https://www.instagram.com/"><i className="fab fa-instagram"></i></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer" id="footer">
        <div className="container">
          <div className="footer-bottom">
            <p>&copy; 2026 JobTracker. Student project by Reema Kasula & Bibha Ray</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
