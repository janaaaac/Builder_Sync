import React from 'react';
import { TypeAnimation } from 'react-type-animation';
import { useNavigate } from 'react-router-dom';
import hero_bg_ from '../Assets/hero_bg_.png';
import shapeBg from '../Assets/sec-bg-shape2.png';

function Hero() {
  const navigate = useNavigate();

  const handleSignUpClick = () => {
    navigate('/register-category');
  };

  return (
    <div className="relative pt-16">
      {/* Background shape */}
      <div className="absolute left-0 bottom-0 w-full h-full">
        <img
          src={shapeBg}
          alt="Decorative shape"
          className="absolute left-0 bottom-0 w-20 sm:w-28 animate-float opacity-100 pl-8 sm:pl-12 pt-24 sm:pt-32 hidden md:block"
          style={{
            transform: 'translateY(70%)',
            zIndex: 1,
          }}
        />
      </div>

      {/* Main hero section */}
      <section
        className="flex items-center justify-center sm:justify-between p-6 sm:p-12 bg-cover bg-center h-screen text-white relative"
        style={{
          backgroundImage: `url(${hero_bg_})`,
          backgroundColor: '#ffffff',
          zIndex: 0,
        }}
      >
        <div className="max-w-2xl text-shadow mx-4 sm:ml-20 text-center sm:text-left relative z-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-jakarta animate-fade-in-right">
            <TypeAnimation
              sequence={[
                'Connect with Your\nBest ',
                1000,
                'Connect with Your\nBest Builder',
                10000,
                '',
                1000,
              ]}
              wrapper="span"
              style={{ 
                whiteSpace: 'pre-line',
                display: 'inline-block'
              }}
            />
            <span className="text-[#EA540C]"></span>
          </h1>
          <p className="mt-4 text-base sm:text-lg font-jakarta animate-fade-in-right" style={{ animationDelay: '0.6s' }}>
            This version is concise while still emphasizing experience and quality craftsmanship.
          </p>
          <button
            onClick={handleSignUpClick}
            className="mt-5 bg-[#EA540C] text-white px-6 py-2 rounded-md hover:bg-[#d64a0b] transition-colors duration-300 animate-fade-in-up"
            style={{ animationDelay: '0.9s' }}
          >
            Sign Up
          </button>
        </div>
      </section>
    </div>
  );
}

export default Hero;