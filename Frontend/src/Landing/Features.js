import React, { useState, useEffect, useRef } from 'react';

const FeaturesSection = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [cardAnimations, setCardAnimations] = useState(false);

  // Refs for scroll animation elements
  const featuresRef = useRef(null);
  const testimonialRef = useRef(null);
  const sectionTitleRef = useRef(null);
  const tabsRef = useRef(null);

  const testimonials = [
    "They thoroughly analyze our industry and target audience, allowing them to develop customized campaigns that effectively reach and engage our customers. Their creative ideas and cutting-edge techniques have helped us stay ahead of the competition.",
    "Their attention to detail and innovative approach to digital marketing has significantly improved our brand's presence. We highly recommend their services to anyone looking to elevate their business.",
    "The team consistently delivers high-quality results, and their strategic thinking has led to measurable improvements in our campaigns. We value their expertise and collaborative approach.",
    "Working with them has been an absolute pleasure. They are responsive, professional, and always go the extra mile to ensure the success of our projects.",
    "Their data-driven approach to marketing is unmatched. We have seen remarkable growth since we started working with them, and we are excited to continue this partnership.",
  ];

  // Handle scroll animations
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      
      // Animate features section when scrolled into view
      if (featuresRef.current) {
        const featuresSectionPosition = featuresRef.current.offsetTop;
        if (scrollPosition > featuresSectionPosition + 100) {
          setCardAnimations(true);
        }
      }

      // Animate section title when scrolled into view
      if (sectionTitleRef.current) {
        const titlePosition = sectionTitleRef.current.offsetTop;
        if (scrollPosition > titlePosition) {
          sectionTitleRef.current.classList.add('scale-105');
        }
      }

      // Animate tabs when scrolled into view
      if (tabsRef.current) {
        const tabsPosition = tabsRef.current.offsetTop;
        if (scrollPosition > tabsPosition) {
          tabsRef.current.classList.add('opacity-100');
          tabsRef.current.classList.remove('opacity-0');
        }
      }

      // Animate testimonial when scrolled into view
      if (testimonialRef.current) {
        const testimonialPosition = testimonialRef.current.offsetTop;
        if (scrollPosition > testimonialPosition) {
          testimonialRef.current.classList.add('opacity-100', 'translate-x-0');
          testimonialRef.current.classList.remove('opacity-0', '-translate-x-4');
        }
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Initial check for elements already in viewport on load
    handleScroll();

    // Clean up event listener
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animation control for testimonials
  const handleNextTestimonial = () => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      setAnimating(false);
    }, 300);
  };

  const handlePrevTestimonial = () => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
      setAnimating(false);
    }, 300);
  };

  const handleTabClick = (tab) => {
    if (tab === activeTab) return;
    setAnimating(true);
    setTimeout(() => {
      setActiveTab(tab);
      // Reset card animations first
      setCardAnimations(false);
      // Then trigger animations after a short delay
      setTimeout(() => setCardAnimations(true), 50);
      setAnimating(false);
    }, 300);
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Features Section */}
      <div ref={featuresRef} className="bg-[#3E3E3E] text-white py-12 px-6 md:px-12 rounded-3xl mb-10 transition-all duration-500 ease-in-out">
        {/* Section Title */}
        <h2 ref={sectionTitleRef} className="text-3xl md:text-4xl font-semibold text-center mb-10 transition-all duration-500 ease-in-out">
          Key Features of Our Construction<br />Management Platform
        </h2>

        {/* Tabs */}
        <div ref={tabsRef} className="flex justify-center gap-4 mb-12 transition-opacity duration-500 opacity-0">
          <button
            className={`px-6 py-3 rounded-full border border-gray-500 transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'stakeholder'
                ? 'bg-orange-600 text-white'
                : 'bg-transparent text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => handleTabClick('stakeholder')}
          >
            For Client
          </button>
          <button
            className={`px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'company'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => handleTabClick('company')}
          >
            Companies
          </button>
        </div>

        {/* Features Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-opacity duration-300 ${animating ? 'opacity-0' : 'opacity-100'}`}>
          {activeTab === 'company' && (
            <>
              <div
                className={`relative rounded-3xl flex flex-col justify-between h-64 overflow-hidden transition-all duration-500 ease-in-out ${cardAnimations ? 'transform-none opacity-100' : 'translate-y-10 opacity-0'}`}
                style={{
                  backgroundImage: 'url("https://i.pinimg.com/736x/f2/f3/7c/f2f37c8ab0549416a4b4712eb1805594.jpg")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-black/40 z-0" />
                <div className="relative z-10 p-6 flex flex-col h-full">
                  <div>
                    <div className="h-1 w-16 bg-white mb-2 transition-all duration-300 ease-in-out hover:w-24"></div>
                    <h3 className="text-xl font-medium mb-4 text-white drop-shadow">Trusted Contractor Connections</h3>
                  </div>
                  {/* <p className="text-white mt-auto drop-shadow">Ai Wave - Ai Chatbot Mobile App</p> */}
                </div>
              </div>
              <div
                className={`relative rounded-3xl flex flex-col justify-between h-64 overflow-hidden transition-all duration-500 ease-in-out ${cardAnimations ? 'transform-none opacity-100' : 'translate-y-10 opacity-0'}`}
                style={{
                  backgroundImage: 'url("https://img.freepik.com/premium-photo/photo-ai-chip-artificial-intelligence-digital-future-technology-innovation-hand-background_763111-134793.jpg?w=1800")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-black/40 z-0" />
                <div className="relative z-10 p-6 flex flex-col h-full">
                  <div>
                    <div className="h-1 w-16 bg-white mb-2 transition-all duration-300 ease-in-out hover:w-24"></div>
                    <h3 className="text-xl font-medium mb-4 text-white drop-shadow">AI-Powered Quantity Surveying</h3>
                  </div>
                  {/* <p className="text-white mt-auto drop-shadow">Ai Wave - Ai Chatbot Mobile App</p> */}
                </div>
              </div>
              <div
                className={`relative rounded-3xl flex flex-col justify-between h-64 overflow-hidden transition-all duration-500 ease-in-out ${cardAnimations ? 'transform-none opacity-100' : 'translate-y-10 opacity-0'}`}
                style={{
                  backgroundImage: 'url("https://csengineermag.com/wp-content/uploads/2020/02/AdobeStock_242887715-990x0-c-1.webp")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-black/40 z-0" />
                <div className="relative z-10 p-6 flex flex-col h-full">
                  <div>
                    <div className="h-1 w-16 bg-white mb-2 transition-all duration-300 ease-in-out hover:w-24"></div>
                    <h3 className="text-xl font-medium mb-4 text-white drop-shadow">Comprehensive Project Management Tools</h3>
                  </div>
                
                </div>
              </div>
            </>
          )}
          {activeTab === 'stakeholder' && (
            <>
              <div className={`bg-gray-400 p-6 rounded-3xl flex flex-col justify-between h-64 transition-all duration-500 ease-in-out ${cardAnimations ? 'transform-none opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '0ms' }}>
                <div>
                  <div className="h-1 w-16 bg-white mb-2 transition-all duration-300 ease-in-out hover:w-24"></div>
                  <h3 className="text-xl font-medium mb-4">Stakeholder Analytics</h3>
                </div>
                <p className="text-white mt-auto">AI Wave - AI Chatbot for Data Insights</p>
              </div>
              <div className={`bg-gray-400 p-6 rounded-3xl flex flex-col justify-between h-64 transition-all duration-500 ease-in-out ${cardAnimations ? 'transform-none opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '150ms' }}>
                <div>
                  <div className="h-1 w-16 bg-white mb-2 transition-all duration-300 ease-in-out hover:w-24"></div>
                  <h3 className="text-xl font-medium mb-4">Real-Time Project Monitoring</h3>
                </div>
                <p className="text-white mt-auto">App Lancer - Mobile App for Stakeholders</p>
              </div>
              <div className={`bg-gray-400 p-6 rounded-3xl flex flex-col justify-between h-64 transition-all duration-500 ease-in-out ${cardAnimations ? 'transform-none opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '300ms' }}>
                <div>
                  <div className="h-1 w-16 bg-white mb-2 transition-all duration-300 ease-in-out hover:w-24"></div>
                  <h3 className="text-xl font-medium mb-4">Customized Reporting</h3>
                </div>
                <p className="text-white mt-auto">App Lancer - Freelance App for Project Reports</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Testimonial Section */}
      <div className="mb-12">
        <blockquote ref={testimonialRef} className="text-gray-800 text-xl md:text-2xl leading-relaxed mb-6 pl-4 transition-all duration-500 opacity-0 -translate-x-4">
          <span className="text-4xl font-serif">"</span> {testimonials[currentTestimonial]} <span className="text-4xl font-serif">"</span>
        </blockquote>

        {/* Testimonial Navigation */}
        <div className="flex justify-end items-center gap-4">
          <button
            className="bg-white text-black border border-gray-300 p-3 rounded-full hover:bg-gray-100 transition-all duration-300 hover:scale-110"
            onClick={handlePrevTestimonial}
          >
            ←
          </button>
          <span className="text-gray-800 font-medium">{`${String(currentTestimonial + 1).padStart(2, '0')}/05`}</span>
          <button
            className="bg-gray-800 text-white p-3 rounded-full hover:bg-gray-700 transition-all duration-300 hover:scale-110"
            onClick={handleNextTestimonial}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;