import React, { useEffect, useRef, useState } from 'react';

const HowItWorks = () => {
  const headerRef = useRef(null);
  const card1Ref = useRef(null);
  const card2Ref = useRef(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (headerRef.current) observer.observe(headerRef.current);
    if (card1Ref.current) observer.observe(card1Ref.current);
    if (card2Ref.current) observer.observe(card2Ref.current);

    return () => observer.disconnect();
  }, []);

  // Function to toggle the video popup
  const toggleVideoPopup = () => {
    setShowVideo(!showVideo);
    
    // Prevent body scrolling when popup is open
    if (!showVideo) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  };

  return (
    <div className="bg-white p-8 max-w-6xl mx-auto">
      {/* Header Section */}
      <div 
        ref={headerRef}
        className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12 opacity-0 translate-y-10 transition-all duration-700 ease-out"
      >
        <div className="md:w-1/2 w-full">
          <h1 className="text-4xl md:text-5xl font-bold text-black leading-tight text-center md:text-left">
            Provide the Best Service with Out-of-the-Box Solutions
          </h1>
        </div>
        <div className="md:w-1/2">
          <p className="text-gray-600 text-lg">
            We are dedicated to transforming the construction industry by connecting clients with verified, high-quality companies and simplifying project management through AI automation. Our platform enhances collaboration, reduces costs, and ensures reliable project outcomes.
          </p>
        </div>
      </div>

      {/* Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-6 lg:gap-8">
        {/* First card */}
        <div 
          ref={card1Ref}
          className="bg-gray-400 rounded-lg p-10 relative mb-12 md:mb-0 h-60 flex flex-col justify-between opacity-0 translate-y-10 transition-all duration-700 ease-out"
          style={{ transitionDelay: '200ms' }}
        >
          <div className="text-4xl font-bold text-white leading-tight">
            HOW WE<br />
            WORK FOR<br />
            <span className="text-5xl">Stakeholders</span>
          </div>
          
          <div className="absolute -bottom-6 -left-6">
            <div 
              onClick={toggleVideoPopup}
              className="bg-orange-600 text-white rounded-full w-24 h-24 flex items-center justify-center border-4 border-white shadow-lg cursor-pointer hover:bg-orange-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Second card */}
        <div 
          ref={card2Ref}
          className="bg-gray-400 rounded-lg p-10 relative h-60 flex flex-col justify-between opacity-0 translate-y-10 transition-all duration-700 ease-out"
          style={{ transitionDelay: '400ms' }}
        >
          <div className="text-4xl font-bold text-white leading-tight">
            HOW WE<br />
            WORK FOR<br />
            <span className="text-5xl">Companies</span>
          </div>
          
          <div className="absolute -bottom-6 -right-6">
            <div 
              onClick={toggleVideoPopup}
              className="bg-orange-600 text-white rounded-full w-24 h-24 flex items-center justify-center border-4 border-white shadow-lg cursor-pointer hover:bg-orange-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Video Popup */}
      {showVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg p-2 w-full max-w-5xl mx-4">
            <button 
              onClick={toggleVideoPopup}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 focus:outline-none transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="responsive-iframe-container">
              <iframe 
                className="w-full aspect-video"
                src="https://www.youtube.com/embed/whMs3SMGu1Y" 
                title="Construction Project Management Software | TriBuild" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HowItWorks;