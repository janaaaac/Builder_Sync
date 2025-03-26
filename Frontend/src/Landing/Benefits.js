import React, { useEffect, useRef } from "react";

const BenefitsSection = () => {
  const headerRef = useRef(null);
  const cardsRef = useRef([]);

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

    if (headerRef.current) {
      observer.observe(headerRef.current);
    }

    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-[#FFFFFF] py-16 px-6 sm:px-12 lg:px-32 font-jakarta">
      {/* Header Section */}
      <div 
        ref={headerRef}
        className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12 opacity-0 translate-y-10 transition-all duration-700 ease-out"
      >
        {/* Left Header */}
        <div className="lg:w-1/2 text-center lg:text-left">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#3E3E3E] font-jakarta">
            The Benefits of Choosing Our Platform
          </h2>
        </div>

        {/* Right Header */}
        <div className="lg:w-1/2 flex flex-col gap-6">
          <p className="text-[#3E3E3E] text-lg text-center lg:text-left font-jakarta">
            Briefly introduce the benefits of using the platform for both clients and construction companies, focusing on how it improves trust, efficiency, and automation in construction project management.
          </p>
          <button className="self-center lg:self-start px-8 py-3 bg-[#EA540C] text-white rounded-full hover:bg-[#D94A0A] transition-all duration-300 transform hover:scale-105 font-jakarta">
            See more
          </button>
        </div>
      </div>

      {/* Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((_, index) => (
          <div
            key={index}
            ref={(el) => (cardsRef.current[index] = el)}
            className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-500 relative group border border-[#EA540C] opacity-0 translate-y-10"
            style={{ transitionDelay: `${index * 200}ms` }}
          >
            {index === 0 && (
              <>
                <h3 className="text-xl font-bold text-[#3E3E3E] mb-4 font-jakarta">
                  Verified Construction Companies
                </h3>
                <p className="text-[#3E3E3E] mb-8 font-jakarta">
                  Connect with verified and reliable construction firms, ensuring your projects are in trustworthy hands.
                </p>
              </>
            )}
            {index === 1 && (
              <>
                <h3 className="text-xl font-bold text-[#3E3E3E] mb-4 font-jakarta">
                  Efficient Project Management
                </h3>
                <p className="text-[#3E3E3E] mb-8 font-jakarta">
                  Centralized tools to manage timelines, budgets, and tasks in one place for streamlined efficiency.
                </p>
              </>
            )}
            {index === 2 && (
              <>
                <h3 className="text-xl font-bold text-[#3E3E3E] mb-4 font-jakarta">
                  Automated Cost Estimation
                </h3>
                <p className="text-[#3E3E3E] mb-8 font-jakarta">
                  Save time and reduce errors with automated, AI-powered quantity surveying for precise budgets.
                </p>
              </>
            )}
            <button className="absolute bottom-6 right-6 bg-[#EA540C] text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#D94A0A] transition-all duration-300 transform hover:scale-110 font-jakarta">
              →
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BenefitsSection;