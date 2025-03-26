import React from 'react';
import Header from './Header';
import Hero from './Hero';
import FeaturesSection from './Features';
import FAQSection from './FAQ';
import CallToAction from './CallToAction';
import Footer from './Footer';
import HowItWorks from './HowItWorks';
import BenefitsSection from './Benefits';


function LandingPage() {
  return (
    <div className="relative">
      <Header />
      <Hero />
      <HowItWorks />
      <FeaturesSection />
      <FAQSection />
      <BenefitsSection />
      <CallToAction />
      <Footer   />
    </div>
  );
}

export default LandingPage;