import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setIsSidebarOpen(false);
    navigate('/');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Determine if it's the landing page (uses different dark navbar)
  const isLanding = location.pathname === '/';

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''} ${!isLanding ? 'light-theme' : ''}`}>
        <div className="container">
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="logo" onClick={closeSidebar}>
            JobTracker
          </Link>
          
          <div className="nav-links">
            {!isAuthenticated ? (
              <>
                <a href="/#hero">Home</a>
                <a href="/#services">Services</a>
                <a href="/#contact">Contact Us</a>
                <NavLink to="/login">Sign In</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>
                <NavLink to="/jobs">Jobs</NavLink>
                <NavLink to="/tracker">Tracker</NavLink>
                <NavLink to="/profile">Profile</NavLink>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
              </>
            )}
          </div>

          <div className={`hamburger ${isSidebarOpen ? 'active' : ''}`} onClick={toggleSidebar}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>

      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={closeSidebar}></div>
      <div className={`mobile-sidebar ${isSidebarOpen ? 'active' : ''} ${!isLanding ? 'light-theme' : ''}`}>
        {!isAuthenticated ? (
          <>
            <a href="/#hero" onClick={closeSidebar}>Home</a>
            <a href="/#services" onClick={closeSidebar}>Services</a>
            <a href="/#contact" onClick={closeSidebar}>Contact Us</a>
            <NavLink to="/login" onClick={closeSidebar}>Sign In</NavLink>
          </>
        ) : (
          <>
            <NavLink to="/dashboard" onClick={closeSidebar}>Dashboard</NavLink>
            <NavLink to="/jobs" onClick={closeSidebar}>Jobs</NavLink>
            <NavLink to="/tracker" onClick={closeSidebar}>Tracker</NavLink>
            <NavLink to="/profile" onClick={closeSidebar}>Profile</NavLink>
            <button className="logout-btn" onClick={handleLogout} style={{ marginTop: '20px' }}>Logout</button>
          </>
        )}
      </div>
    </>
  );
};

export default Navbar;
