import { MapPin, Phone, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import ClientSidebar from './clientSidebar';

const ProjectCard = ({ image, name, price }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ y: -5 }}
    transition={{ duration: 0.3 }}
    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
  >
    <div className="relative h-48 overflow-hidden">
      <img src={image} alt={name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-gray-900">{name}</h3>
      <p className="text-sm text-gray-500 mt-1">Project Description</p>
      <p className="text-orange-500 font-medium mt-2">{price}</p>
    </div>
  </motion.div>
);

const ConstructionProfile = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const projects = [
    {
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
      name: 'Modern Villa Project',
      price: 'LKR 100,000,000.00'
    },
    {
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
      name: 'Luxury Residence',
      price: 'LKR 100,000,000.00'
    },
    {
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
      name: 'Contemporary House',
      price: 'LKR 100,000,000.00'
    }
  ];
  console.log("Rendering ClientSidebar...");

  return (
    <div className="min-h-screen bg-gray-50 flex font-['Plus_Jakarta_Sans']">
      <ClientSidebar onCollapseChange={setIsCollapsed} />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="relative">
          <div className="h-64 bg-gradient-to-r from-orange-600 to-orange-300 relative overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <Star className="absolute top-20 right-40 text-white/20 w-8 h-8" />
              <Star className="absolute top-40 left-1/4 text-white/20 w-6 h-6" />
              <Star className="absolute bottom-20 right-1/3 text-white/20 w-4 h-4" />
            </motion.div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative -mt-24">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="bg-white rounded-full w-32 h-32 border-4 border-white shadow-lg overflow-hidden"
              >
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4"
                  alt="Company Logo"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Access Engineering PLC</h1>
                  <div className="mt-2 flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">No.72, 3rd Street, Colombo 07, Sri Lanka.</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">+94 000 000 000</span>
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[#EA540C] text-white px-6 py-2 rounded-2xl font-medium hover:bg-orange-600 transition-colors"
                >
                  Send a proposal
                </motion.button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Our Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <ProjectCard
                key={index}
                image={project.image}
                name={project.name}
                price={project.price}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConstructionProfile;