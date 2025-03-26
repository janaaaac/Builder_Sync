import React from "react";

const Footer = () => {
  return (
    <footer className="bg-[#3E3E3E] text-white py-8 px-4 sm:py-12 sm:px-6 lg:px-12 xl:px-24 font-jakarta">
      {/* Newsletter Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
        <h3 className="text-lg sm:text-xl font-medium w-full sm:w-auto sm:flex-1 font-jakarta">
          Join our newsletter to<br className="hidden sm:block" /> keep up to date with us!
        </h3>
        <div className="w-full sm:flex-1 sm:justify-end">
          <div className="relative flex w-full sm:max-w-[400px] sm:ml-auto items-center">
            <input
              type="email"
              placeholder="Enter your email"
              aria-label="Enter your email"
              className="w-full pl-4 pr-24 py-2 bg-[#333333] border border-[#444444] rounded-full text-white placeholder-gray-400 focus:outline-none font-jakarta"
            />
            <button className="absolute right-0 bg-[#FF5722] text-white text-sm px-4 sm:px-6 py-2 rounded-full hover:bg-[#E64A19] transition-colors duration-300 font-jakarta">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <hr className="border-t border-[rgba(255,255,255,0.32)] mb-8" />

      {/* Footer Content */}
      <div className="flex flex-col lg:flex-row justify-between gap-8 mb-8">
        {/* Footer Logo */}
        <div className="flex-none lg:flex-1 mb-6 lg:mb-0">
          <h2 className="text-xl sm:text-2xl font-bold text-[#FF5722] mb-2 font-aclonica">BuilderSync</h2>
          <p className="text-gray-300 text-sm font-jakarta">
            We growing up your business with<br className="hidden sm:block" /> personal AI manager.
          </p>
        </div>

        {/* Footer Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-12 w-full lg:w-auto">
          <div>
            <h5 className="text-sm font-bold mb-4 text-gray-300 font-jakarta">Platform</h5>
            <ul className="space-y-2">
              <li className="text-sm text-white hover:text-[#FF5722] transition-colors duration-300 font-jakarta">
                Plans & Pricing
              </li>
              <li className="text-sm text-white hover:text-[#FF5722] transition-colors duration-300 font-jakarta">
                Personal AI Manager
              </li>
              <li className="text-sm text-white hover:text-[#FF5722] transition-colors duration-300 font-jakarta">
                AI Business Writer
              </li>
            </ul>
          </div>
          <div>
            <h5 className="text-sm font-bold mb-4 text-gray-300 font-jakarta">Company</h5>
            <ul className="space-y-2">
              <li className="text-sm text-white hover:text-[#FF5722] transition-colors duration-300 font-jakarta">
                Blog
              </li>
              <li className="text-sm text-white hover:text-[#FF5722] transition-colors duration-300 font-jakarta">
                Careers
              </li>
              <li className="text-sm text-white hover:text-[#FF5722] transition-colors duration-300 font-jakarta">
                News
              </li>
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <h5 className="text-sm font-bold mb-4 text-gray-300 font-jakarta">Resources</h5>
            <ul className="space-y-2">
              <li className="text-sm text-white hover:text-[#FF5722] transition-colors duration-300 font-jakarta">
                Documentation
              </li>
              <li className="text-sm text-white hover:text-[#FF5722] transition-colors duration-300 font-jakarta">
                Papers
              </li>
              <li className="text-sm text-white hover:text-[#FF5722] transition-colors duration-300 font-jakarta">
                Press Conferences
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <hr className="border-t border-[rgba(255,255,255,0.32)] mb-8" />

      {/* Footer Bottom */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-gray-400 text-sm font-jakarta">© 2025 BuilderSync</p>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          <button onClick={() => console.log('Terms clicked')} className="text-gray-400 hover:text-white transition-colors duration-300 text-sm font-jakarta">
            Terms of Service
          </button>
          <button onClick={() => console.log('Privacy clicked')} className="text-gray-400 hover:text-white transition-colors duration-300 text-sm font-jakarta">
            Privacy Policy
          </button>
          <button onClick={() => console.log('Cookies clicked')} className="text-gray-400 hover:text-white transition-colors duration-300 text-sm font-jakarta">
            Cookies
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;