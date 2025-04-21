// import React, { useState } from 'react';
// import { 
//     ArrowLeft, 
//     Plus, 
//     X, 
//     Building,
//     MapPin,
//     Calendar,
//     Upload,
//     Bed,
//     Bath,
//     Square,
//     DollarSign,
//     User,
//     Mail,
//     Phone,
//     Briefcase
//   } from 'lucide-react';
  
//   const ProjectForm = () => {
//     const [images, setImages] = useState([]);
//     const [formData, setFormData] = useState({
//       title: '',
//       description: '',
//       location: '',
//       year: new Date().getFullYear(),
//       area: '',
//       bedrooms: '',
//       bathrooms: '',
//       duration: '',
//       investment: '',
//       features: [],
//       images: [],
//       teamMembers: []
//     });
  
//     const [previewImages, setPreviewImages] = useState([]);
//     const [newFeature, setNewFeature] = useState('');
//     const [newTeamMember, setNewTeamMember] = useState({
//       name: '',
//       role: '',
//       email: '',
//       phone: '',
//       experience: '',
//       image: null,
//       imagePreview: ''
//     });
  
//     const handleImageChange = (e) => {
//       const files = Array.from(e.target.files);
      
//       // Create preview URLs
//       const newPreviewImages = files.map(file => ({
//         url: URL.createObjectURL(file),
//         title: file.name
//       }));
      
//       setPreviewImages(prev => [...prev, ...newPreviewImages]);
//       setFormData(prev => ({
//         ...prev,
//         images: [...prev.images, ...files]
//       }));
//     };
  
//     const removeImage = (index) => {
//       setPreviewImages(prev => prev.filter((_, i) => i !== index));
//       setFormData(prev => ({
//         ...prev,
//         images: prev.images.filter((_, i) => i !== index)
//       }));
//     };
  
//     const handleTeamMemberImage = (e) => {
//       const file = e.target.files[0];
//       if (file) {
//         setNewTeamMember(prev => ({
//           ...prev,
//           image: file,
//           imagePreview: URL.createObjectURL(file)
//         }));
//       }
//     };
  
//     const addTeamMember = () => {
//       if (newTeamMember.name && newTeamMember.role) {
//         setFormData(prev => ({
//           ...prev,
//           teamMembers: [...prev.teamMembers, newTeamMember]
//         }));
//         setNewTeamMember({
//           name: '',
//           role: '',
//           email: '',
//           phone: '',
//           experience: '',
//           image: null,
//           imagePreview: ''
//         });
//       }
//     };
  
//     const removeTeamMember = (index) => {
//       setFormData(prev => ({
//         ...prev,
//         teamMembers: prev.teamMembers.filter((_, i) => i !== index)
//       }));
//     };
  
//     const addFeature = () => {
//       if (newFeature.trim()) {
//         setFormData(prev => ({
//           ...prev,
//           features: [...prev.features, newFeature.trim()]
//         }));
//         setNewFeature('');
//       }
//     };
  
//     const removeFeature = (index) => {
//       setFormData(prev => ({
//         ...prev,
//         features: prev.features.filter((_, i) => i !== index)
//       }));
//     };
  
//     const handleSubmit = (e) => {
//       e.preventDefault();
//       console.log('Form Data:', formData);
//       // Handle form submission
//     };
  
//     return (
//       <div className="min-h-screen bg-gray-50">
//         {/* Header */}
//         <header className="bg-white shadow-sm">
//           <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
//             <div className="text-2xl font-bold text-orange-600">BuilderSync</div>
//             <a 
//               href="/"
//               className="flex items-center text-gray-600 hover:text-orange-600 transition-colors"
//             >
//               <ArrowLeft className="w-4 h-4 mr-2" />
//               Back to Projects
//             </a>
//           </div>
//         </header>
  
//         <div className="max-w-4xl mx-auto px-4 py-12">
//           <div className="bg-white rounded-2xl shadow-xl p-8">
//             <h1 className="text-3xl font-bold mb-8">Add New Project</h1>
            
//             <form onSubmit={handleSubmit} className="space-y-8">
//               {/* Basic Information */}
//               <div className="space-y-6">
//                 <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
                
//                 <div>
//                   <label className="block text-gray-700 mb-2">Project Title</label>
//                   <input
//                     type="text"
//                     value={formData.title}
//                     onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
//                     className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
//                     placeholder="e.g., Modern Two-Story Luxury Residence"
//                     required
//                   />
//                 </div>
  
//                 <div>
//                   <label className="block text-gray-700 mb-2">Description</label>
//                   <textarea
//                     value={formData.description}
//                     onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
//                     rows="4"
//                     className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
//                     placeholder="Describe the project..."
//                     required
//                   />
//                 </div>
  
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <label className="block text-gray-700 mb-2">Location</label>
//                     <div className="relative">
//                       <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                       <input
//                         type="text"
//                         value={formData.location}
//                         onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
//                         className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
//                         placeholder="City, Country"
//                         required
//                       />
//                     </div>
//                   </div>
  
//                   <div>
//                     <label className="block text-gray-700 mb-2">Year</label>
//                     <div className="relative">
//                       <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                       <input
//                         type="number"
//                         value={formData.year}
//                         onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
//                         className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
//                         min="1900"
//                         max="2100"
//                         required
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>
  
//               {/* Project Specifications */}
//               <div className="space-y-6">
//                 <h2 className="text-xl font-semibold text-gray-900">Project Specifications</h2>
                
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div>
//                     <label className="block text-gray-700 mb-2">Area (sq ft)</label>
//                     <div className="relative">
//                       <Square className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                       <input
//                         type="number"
//                         value={formData.area}
//                         onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
//                         className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
//                         placeholder="2500"
//                         required
//                       />
//                     </div>
//                   </div>
  
//                   <div>
//                     <label className="block text-gray-700 mb-2">Duration (months)</label>
//                     <input
//                       type="number"
//                       value={formData.duration}
//                       onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
//                       className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
//                       placeholder="8"
//                       required
//                     />
//                   </div>
  
//                   <div>
//                     <label className="block text-gray-700 mb-2">Bedrooms</label>
//                     <div className="relative">
//                       <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                       <input
//                         type="number"
//                         value={formData.bedrooms}
//                         onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
//                         className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
//                         placeholder="5"
//                         required
//                       />
//                     </div>
//                   </div>
  
//                   <div>
//                     <label className="block text-gray-700 mb-2">Bathrooms</label>
//                     <div className="relative">
//                       <Bath className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                       <input
//                         type="number"
//                         value={formData.bathrooms}
//                         onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
//                         className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
//                         placeholder="4.5"
//                         step="0.5"
//                         required
//                       />
//                     </div>
//                   </div>
//                 </div>
  
//                 <div>
//                   <label className="block text-gray-700 mb-2">Investment (LKR)</label>
//                   <div className="relative">
//                     <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                     <input
//                       type="number"
//                       value={formData.investment}
//                       onChange={(e) => setFormData(prev => ({ ...prev, investment: e.target.value }))}
//                       className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
//                       placeholder="125000000"
//                       required
//                     />
//                   </div>
//                 </div>
//               </div>
  
//               {/* Features */}
//               <div className="space-y-6">
//                 <h2 className="text-xl font-semibold text-gray-900">Key Features</h2>
                
//                 <div className="space-y-4">
//                   <div className="flex gap-2">
//                     <input
//                       type="text"
//                       value={newFeature}
//                       onChange={(e) => setNewFeature(e.target.value)}
//                       className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
//                       placeholder="Add a feature..."
//                     />
//                     <button
//                       type="button"
//                       onClick={addFeature}
//                       className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
//                     >
//                       <Plus className="w-5 h-5" />
//                     </button>
//                   </div>
  
//                   <div className="space-y-2">
//                     {formData.features.map((feature, index) => (
//                       <div 
//                         key={index}
//                         className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
//                       >
//                         <span>{feature}</span>
//                         <button
//                           type="button"
//                           onClick={() => removeFeature(index)}
//                           className="text-red-500 hover:text-red-600"
//                         >
//                           <X className="w-4 h-4" />
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
  
//               {/* Team Members */}
//               <div className="space-y-6">
//                 <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
                
//                 <div className="space-y-6">
//                   {/* Add New Team Member Form */}
//                   <div className="bg-gray-50 rounded-lg p-6 space-y-4">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-gray-700 mb-2">Name</label>
//                         <div className="relative">
//                           <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                           <input
//                             type="text"
//                             value={newTeamMember.name}
//                             onChange={(e) => setNewTeamMember(prev => ({ ...prev, name: e.target.value }))}
//                             className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
//                             placeholder="Full Name"
//                           />
//                         </div>
//                       </div>
  
//                       <div>
//                         <label className="block text-gray-700 mb-2">Role</label>
//                         <div className="relative">
//                           <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
//                           <select
//                             value={newTeamMember.role}
//                             onChange={(e) => setNewTeamMember(prev => ({ ...prev, role: e.target.value }))}
//                             className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all appearance-none"
//                           >
//                             <option value="">Select Role</option>
//                             <option value="Architecture">Architecture</option>
//                             <option value="Project Manager">Project Manager</option>
//                             <option value="Engineer">Engineer</option>
//                             <option value="QS">Quantity Surveyor (QS)</option>
//                           </select>
//                           <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
//                             <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
//                             </svg>
//                           </div>
//                         </div>
//                       </div>
  
//                       <div>
//                         <label className="block text-gray-700 mb-2">Email</label>
//                         <div className="relative">
//                           <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                           <input
//                             type="email"
//                             value={newTeamMember.email}
//                             onChange={(e) => setNewTeamMember(prev => ({ ...prev, email: e.target.value }))}
//                             className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
//                             placeholder="Email Address"
//                           />
//                         </div>
//                       </div>
  
//                       <div>
//                         <label className="block text-gray-700 mb-2">Phone</label>
//                         <div className="relative">
//                           <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                           <input
//                             type="tel"
//                             value={newTeamMember.phone}
//                             onChange={(e) => setNewTeamMember(prev => ({ ...prev, phone: e.target.value }))}
//                             className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
//                             placeholder="Phone Number"
//                           />
//                         </div>
//                       </div>
  
//                       <div>
//                         <label className="block text-gray-700 mb-2">Experience (Years)</label>
//                         <input
//                           type="number"
//                           value={newTeamMember.experience}
//                           onChange={(e) => setNewTeamMember(prev => ({ ...prev, experience: e.target.value }))}
//                           className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
//                           placeholder="Years of Experience"
//                         />
//                       </div>
  
//                       <div>
//                         <label className="block text-gray-700 mb-2">Profile Image</label>
//                         <input
//                           type="file"
//                           accept="image/*"
//                           onChange={handleTeamMemberImage}
//                           className="hidden"
//                           id="team-member-image"
//                         />
//                         <label
//                           htmlFor="team-member-image"
//                           className="block w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors"
//                         >
//                           {newTeamMember.imagePreview ? 'Change Image' : 'Upload Image'}
//                         </label>
//                       </div>
//                     </div>
  
//                     {newTeamMember.imagePreview && (
//                       <div className="relative w-20 h-20">
//                         <img
//                           src={newTeamMember.imagePreview}
//                           alt="Preview"
//                           className="w-full h-full rounded-full object-cover"
//                         />
//                       </div>
//                     )}
  
//                     <button
//                       type="button"
//                       onClick={addTeamMember}
//                       className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-colors"
//                     >
//                       Add Team Member
//                     </button>
//                   </div>
  
//                   {/* Team Members List */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     {formData.teamMembers.map((member, index) => (
//                       <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 relative">
//                         <button
//                           type="button"
//                           onClick={() => removeTeamMember(index)}
//                           className="absolute top-2 right-2 text-red-500 hover:text-red-600"
//                         >
//                           <X className="w-4 h-4" />
//                         </button>
  
//                         <div className="flex items-center space-x-4">
//                           {member.imagePreview && (
//                             <img
//                               src={member.imagePreview}
//                               alt={member.name}
//                               className="w-16 h-16 rounded-full object-cover"
//                             />
//                           )}
//                           <div>
//                             <h3 className="font-medium text-gray-900">{member.name}</h3>
//                             <p className="text-orange-600">{member.role}</p>
//                             <div className="text-sm text-gray-500 mt-1">
//                               {member.experience} years experience
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
  
//               {/* Image Upload */}
//               <div className="space-y-6">
//                 <h2 className="text-xl font-semibold text-gray-900">Project Images</h2>
                
//                 <div className="space-y-4">
//                   <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
//                     <input
//                       type="file"
//                       multiple
//                       accept="image/*"
//                       onChange={handleImageChange}
//                       className="hidden"
//                       id="image-upload"
//                     />
//                     <label
//                       htmlFor="image-upload"
//                       className="flex flex-col items-center justify-center cursor-pointer"
//                     >
//                       <Upload className="w-12 h-12 text-gray-400 mb-4" />
//                       <span className="text-gray-600">Click to upload images</span>
//                       <span className="text-gray-400 text-sm mt-1">PNG, JPG up to 10MB</span>
//                     </label>
//                   </div>
  
//                   {previewImages.length > 0 && (
//                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                       {previewImages.map((image, index) => (
//                         <div key={index} className="relative group">
//                           <img
//                             src={image.url}
//                             alt={`Preview ${index + 1}`}
//                             className="w-full h-32 object-cover rounded-lg"
//                           />
//                           <button
//                             type="button"
//                             onClick={() => removeImage(index)}
//                             className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
//                           >
//                             <X className="w-4 h-4" />
//                           </button>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>
  
//               {/* Submit Button */}
//               <button
//                 type="submit"
//                 className="w-full bg-orange-600 text-white py-4 px-6 rounded-lg hover:bg-orange-700 transition-colors font-medium"
//               >
//                 Create Project
//               </button>
//             </form>
//           </div>
//         </div>
//       </div>
//     );
//   };
  
//   export default ProjectForm;