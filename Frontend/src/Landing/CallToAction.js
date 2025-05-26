import React from "react";
import { useNavigate } from "react-router-dom";
import globalLineShape from '../Assets/global-line-shape1.png';

const CallToAction = () => {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Animated shape */}
      <img 
        src={globalLineShape} 
        alt="Decorative line"
        className="absolute top-0 right-0 w-1200 animate-slide-left"
        style={{
          zIndex: 10,
          transform: 'translateY(40%)',
          filter: 'brightness(0) invert(1)' // This will make the image white
        }}
      />

      <section className="bg-gradient-to-r from-[#3E3E3E] to-[#3E3E3E] py-16 px-6 sm:px-12 lg:px-32 flex justify-center items-center">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-8 w-full max-w-6xl bg-white rounded-3xl p-8 sm:p-12 shadow-lg">
          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-bold text-[#3E3E3E] text-center sm:text-left">
            Ready to work with us?
          </h2>

          {/* Button */}
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center justify-center bg-[#EA540C] text-white font-bold py-4 px-8 rounded-full hover:bg-[#D94A0A] transition-colors duration-300"
          >
            Get Started <span className="ml-3 text-xl">→</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default CallToAction;