import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Animation.css';  // Add this import

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for mobile menu
  const [isVisible, setIsVisible] = useState(false); // Add this for animation
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    // Add animation on mount
    setIsVisible(true);

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignUp = () => {
    navigate('/register-category');
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full flex flex-wrap justify-between items-center p-4 md:p-5 transition-all duration-500 ease-in-out z-50 bg-white ${
        scrolled ? 'shadow-md' : 'shadow-none'
      } ${
        isVisible 
          ? 'opacity-100 transform translate-y-0 header-animate' 
          : 'opacity-0 transform -translate-y-4'
      }`}
    >
      {/* Logo */}
      <div className="text-2xl font-bold text-orange-600 font-aclonica">
        BuilderSync
      </div>
      

      {/* Hamburger Menu for Mobile */}
      <button
        className="md:hidden p-2 focus:outline-none"
        onClick={toggleMenu}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
      </button>

      {/* Navigation Links */}
      <nav
        className={`w-full md:w-auto md:flex md:space-x-14 ${  // Changed from space-x-4 to space-x-8
          isMenuOpen ? 'block' : 'hidden'
        }`}
      >
        <a
          href="#home"
          className="block mt-4 md:mt-0 md:inline-block text-gray-800 hover:text-orange-600"
        >
          Home
        </a>
        <a
          href="#about"
          className="block mt-4 md:mt-0 md:inline-block text-gray-800 hover:text-orange-600"
        >
          About Us
        </a>
        <a
          href="#service"
          className="block mt-4 md:mt-0 md:inline-block text-gray-800 hover:text-orange-600"
        >
          Service
        </a>
        <a
          href="#project"
          className="block mt-4 md:mt-0 md:inline-block text-gray-800 hover:text-orange-600"
        >
          Project
        </a>
      </nav>

      {/* Sign-Up Button */}
      <button 
        onClick={handleSignUp}
        className="hidden md:inline-block bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition-colors duration-300"
      >
        Sign Up
      </button>
    </header>
    
  );
}

export default Header;