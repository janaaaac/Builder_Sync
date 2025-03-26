import React, { useState, useEffect, useRef } from 'react';

const FAQSection = () => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isVisible, setIsVisible] = useState({});
  const faqRefs = useRef([]);

  const faqs = [
    {
      question: "Why is construction management important for my project?",
      answer:
        "Effective construction management ensures that projects are completed on time, within budget, and to the desired quality standards. It involves planning, coordinating, and supervising the construction process, which minimizes risks and improves efficiency.",
    },
    {
      question: "How does your platform help improve my project's visibility?",
      answer:
        "Our platform uses advanced tools and analytics to enhance your project's visibility across all stakeholders and channels.",
    },
    {
      question: "How long does it take to see results from using your platform?",
      answer:
        "Results vary based on your project's scale and needs, but most clients see significant improvements within the first month.",
    },
    {
      question: "How do you measure the success of construction projects?",
      answer:
        "We track metrics like on-time delivery, budget adherence, quality standards, and client satisfaction to gauge project success.",
    },
  ];

  useEffect(() => {
    const observers = faqRefs.current.map((ref, index) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({
              ...prev,
              [index]: true
            }));
          }
        },
        { threshold: 0.1, rootMargin: '50px' }
      );

      if (ref) {
        observer.observe(ref);
      }

      return observer;
    });

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, []);

  const toggleFAQ = (index) => {
    setActiveIndex(index === activeIndex ? -1 : index);
  };

  return (
    <div className="bg-gray-50 py-16 px-6 sm:px-12 font-jakarta">
      <div className="max-w-7xl mx-auto">
        <div className="text-center lg:text-left lg:flex lg:justify-between lg:items-start">
          {/* Left Section */}
          <div className="lg:w-1/2 lg:pr-10 animate-fade-in-up">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 font-jakarta">
              Construction Management FAQs
            </h2>
            <p className="text-gray-600 text-lg mb-8 font-jakarta">
              As a leading construction management platform, we are dedicated to
              providing comprehensive educational resources and answering frequently
              asked questions to help our users.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button className="px-8 py-3 border-2 border-black rounded-full text-black hover:bg-gray-100 transition-colors duration-300 font-jakarta">
                More Questions
              </button>
              <button className="px-8 py-3 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors duration-300 font-jakarta">
                Contact Us
              </button>
            </div>
          </div>

          {/* Right Section */}
          <div className="lg:w-1/2 mt-12 lg:mt-0">
            {faqs.map((faq, index) => (
              <div
                key={index}
                ref={(el) => (faqRefs.current[index] = el)}
                className={`bg-white p-6 rounded-lg shadow-md mb-6 font-jakarta transform transition-all duration-500 ease-out
                  ${isVisible[index] ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
                  ${index === activeIndex ? 'border-l-4 border-orange-600' : ''}
                  hover:scale-[1.02]`}
                style={{
                  transitionDelay: `${index * 150}ms`
                }}
              >
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleFAQ(index)}
                >
                  <h3 className="text-xl font-bold text-gray-900 font-jakarta">
                    {faq.question}
                  </h3>
                  <span 
                    className={`text-2xl font-bold text-gray-700 transform transition-transform duration-300
                      ${index === activeIndex ? 'rotate-45' : 'rotate-0'}`}
                  >
                    +
                  </span>
                </div>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out
                    ${index === activeIndex ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
                >
                  <p className="text-gray-600 text-lg font-jakarta">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQSection;