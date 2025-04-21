const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema({
  fullName: String,
  jobRole: String,
  image: String
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  category: String,
  description: String,
  image: String, // for backward compatibility
  images: [String], // support multiple images
  location: String,
  completionYear: String,
  details: [String],
  price: String,
  team: [TeamMemberSchema] // add team array
}, { _id: true });

const WhyChooseUsFeatureSchema = new mongoose.Schema({
  icon: { type: String, default: "Star" },
  title: String,
  desc: String
}, { _id: false });

// Update the statistics schema
const StatisticSchema = new mongoose.Schema({
  value: String,
  label: String,
  icon: String,
  type: String // Add this field for categorization (experience, projects, team, satisfaction)
}, { _id: true });

const PortfolioSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  hero: {
    mainHeading: String,
    subHeading: String,
    description: String,
    backgroundImage: String
  },
  projects: [ProjectSchema], // use the updated schema
  services: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    icon: String
  }],
  statistics: [StatisticSchema],
  contact: {
    phone: String,
    email: String,
    address: String,
    workingHours: String,
    socialMedia: {
      facebook: String,
      linkedin: String,
      instagram: String
    }
  },
  whyChooseUs: {
    heading: { type: String, default: "Why Choose Us" },
    subheading: { type: String, default: "Excellence in Construction, Committed to Quality" },
    image: { type: String },
    features: [WhyChooseUsFeatureSchema]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
PortfolioSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);
