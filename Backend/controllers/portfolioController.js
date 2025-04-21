const Portfolio = require('../models/Portfolio');
const Company = require('../models/Company');

// Get company portfolio
exports.getPortfolio = async (req, res) => {
  try {
    const companyId = req.user._id;
    
    let portfolio = await Portfolio.findOne({ companyId });
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    console.error('Error getting portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Create or update portfolio
exports.savePortfolio = async (req, res) => {
  try {
    const companyId = req.user._id;
    const portfolioData = req.body;
    
    // Find existing portfolio or create new one
    let portfolio = await Portfolio.findOne({ companyId });
    
    if (portfolio) {
      // Update existing portfolio
      // Use specific section updates based on what was submitted
      if (portfolioData.hero) portfolio.hero = portfolioData.hero;
      if (portfolioData.projects) portfolio.projects = portfolioData.projects;
      if (portfolioData.services) portfolio.services = portfolioData.services;
      if (portfolioData.statistics) portfolio.statistics = portfolioData.statistics;
      if (portfolioData.contact) portfolio.contact = portfolioData.contact;
      
      await portfolio.save();
    } else {
      // Create new portfolio
      portfolio = new Portfolio({
        companyId,
        ...portfolioData
      });
      
      await portfolio.save();
      
      // Update company record to indicate portfolio exists
      await Company.findByIdAndUpdate(companyId, { hasPortfolio: true });
    }
    
    res.status(200).json({
      success: true,
      data: portfolio,
      message: 'Portfolio saved successfully'
    });
  } catch (error) {
    console.error('Error saving portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update specific section of portfolio
exports.updateSection = async (req, res) => {
  try {
    const companyId = req.user._id;
    const { section } = req.params;
    const sectionData = req.body;
    
    // Validate section parameter
    const validSections = ['hero', 'projects', 'services', 'statistics', 'contact', 'whyChooseUs'];
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid section'
      });
    }
    
    let portfolio = await Portfolio.findOne({ companyId });
    
    if (!portfolio) {
      // Create new portfolio with just this section
      portfolio = new Portfolio({
        companyId,
        [section]: sectionData
      });
      
      await portfolio.save();
      
      // Update company record to indicate portfolio exists
      await Company.findByIdAndUpdate(companyId, { hasPortfolio: true });
    } else {
      // Update just the specified section
      portfolio[section] = sectionData;
      await portfolio.save();
    }
    
    res.status(200).json({
      success: true,
      data: portfolio,
      message: `${section} section updated successfully`
    });
  } catch (error) {
    console.error(`Error updating ${req.params.section} section:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Add a project to portfolio
exports.addProject = async (req, res) => {
  try {
    const companyId = req.user._id;
    const projectData = req.body;

    // Ensure images and team are arrays if not present
    if (!Array.isArray(projectData.images)) projectData.images = [];
    if (!Array.isArray(projectData.team)) projectData.team = [];

    let portfolio = await Portfolio.findOne({ companyId });

    if (!portfolio) {
      portfolio = new Portfolio({
        companyId,
        projects: [projectData]
      });

      // Update company record to indicate portfolio exists
      await Company.findByIdAndUpdate(companyId, { hasPortfolio: true });
    } else {
      portfolio.projects.push(projectData);
    }

    await portfolio.save();

    res.status(200).json({
      success: true,
      data: portfolio.projects,
      message: 'Project added successfully'
    });
  } catch (error) {
    console.error('Error adding project:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete a project
exports.deleteProject = async (req, res) => {
  try {
    const companyId = req.user._id;
    const { projectId } = req.params;
    
    const portfolio = await Portfolio.findOne({ companyId });
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }
    
    portfolio.projects = portfolio.projects.filter(
      project => project._id.toString() !== projectId
    );
    
    await portfolio.save();
    
    res.status(200).json({
      success: true,
      data: portfolio.projects,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Similar methods for services and statistics
// Add a service to portfolio
exports.addService = async (req, res) => {
  try {
    const companyId = req.user._id;
    const serviceData = req.body;
    
    let portfolio = await Portfolio.findOne({ companyId });
    
    if (!portfolio) {
      portfolio = new Portfolio({
        companyId,
        services: [serviceData]
      });
      
      // Update company record to indicate portfolio exists
      await Company.findByIdAndUpdate(companyId, { hasPortfolio: true });
    } else {
      portfolio.services.push(serviceData);
    }
    
    await portfolio.save();
    
    res.status(200).json({
      success: true,
      data: portfolio.services,
      message: 'Service added successfully'
    });
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete a service
exports.deleteService = async (req, res) => {
  try {
    const companyId = req.user._id;
    const { serviceId } = req.params;
    
    const portfolio = await Portfolio.findOne({ companyId });
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }
    
    portfolio.services = portfolio.services.filter(
      service => service._id.toString() !== serviceId
    );
    
    await portfolio.save();
    
    res.status(200).json({
      success: true,
      data: portfolio.services,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Add a statistic to portfolio
exports.addStatistic = async (req, res) => {
  try {
    const companyId = req.user._id;
    const statData = req.body;
    
    // Validate required fields
    if (!statData.value || !statData.label) {
      return res.status(400).json({
        success: false,
        message: 'Value and label are required for statistics'
      });
    }
    
    // Set default icon if not provided
    if (!statData.icon) {
      // Assign default icons based on type if available
      if (statData.type === 'experience') statData.icon = 'Trophy';
      else if (statData.type === 'projects') statData.icon = 'Building2';
      else if (statData.type === 'team') statData.icon = 'Users2';
      else if (statData.type === 'satisfaction') statData.icon = 'Award';
      else statData.icon = 'Trophy'; // Default fallback
    }
    
    let portfolio = await Portfolio.findOne({ companyId });
    
    if (!portfolio) {
      portfolio = new Portfolio({
        companyId,
        statistics: [statData]
      });
      
      // Update company record to indicate portfolio exists
      await Company.findByIdAndUpdate(companyId, { hasPortfolio: true });
    } else {
      // Check if a statistic with the same label already exists
      const existingStatIndex = portfolio.statistics.findIndex(
        stat => stat.label.toLowerCase() === statData.label.toLowerCase()
      );
      
      if (existingStatIndex >= 0) {
        // Update existing statistic instead of adding a new one
        portfolio.statistics[existingStatIndex] = {
          ...portfolio.statistics[existingStatIndex].toObject(),
          ...statData
        };
      } else {
        // Add new statistic
        portfolio.statistics.push(statData);
      }
    }
    
    await portfolio.save();
    
    res.status(200).json({
      success: true,
      data: portfolio.statistics,
      message: 'Statistic added successfully'
    });
  } catch (error) {
    console.error('Error adding statistic:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete a statistic
exports.deleteStatistic = async (req, res) => {
  try {
    const companyId = req.user._id;
    const { statId } = req.params;
    
    const portfolio = await Portfolio.findOne({ companyId });
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }
    
    portfolio.statistics = portfolio.statistics.filter(
      stat => stat._id.toString() !== statId
    );
    
    await portfolio.save();
    
    res.status(200).json({
      success: true,
      data: portfolio.statistics,
      message: 'Statistic deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting statistic:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get portfolio by company ID (public route)
exports.getCompanyPortfolio = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const portfolio = await Portfolio.findOne({ companyId });
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    console.error('Error getting company portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update portfolio data
exports.updatePortfolio = async (req, res) => {
  try {
    const userId = req.user.id;
    const portfolioData = req.body;
    
    // Ensure the whyChooseUs section is properly processed
    if (portfolioData.whyChooseUs) {
      // Make sure nested objects like heading, subheading, and features are preserved
      // Check if features is an array of objects with icon, title, desc properties
      if (portfolioData.whyChooseUs.features && Array.isArray(portfolioData.whyChooseUs.features)) {
        // Ensure each feature has the required properties
        portfolioData.whyChooseUs.features = portfolioData.whyChooseUs.features.map(feature => ({
          icon: feature.icon || 'Star',
          title: feature.title || '',
          desc: feature.desc || ''
        }));
      }
    }
    
    // Find and update the portfolio for this user
    const portfolio = await Portfolio.findOneAndUpdate(
      { userId: userId },
      portfolioData,
      { new: true, upsert: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Portfolio updated successfully',
      data: portfolio
    });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update portfolio',
      error: error.message
    });
  }
};

// Update a single project in the portfolio
exports.updateProject = async (req, res) => {
  try {
    const companyId = req.user._id;
    const { projectId } = req.params;
    const updatedData = req.body;

    let portfolio = await Portfolio.findOne({ companyId });
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }

    const projectIndex = portfolio.projects.findIndex(
      project => project._id.toString() === projectId
    );
    if (projectIndex === -1) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Update the project fields
    portfolio.projects[projectIndex] = {
      ...portfolio.projects[projectIndex].toObject(),
      ...updatedData
    };

    await portfolio.save();

    res.status(200).json({
      success: true,
      data: portfolio.projects[projectIndex],
      message: 'Project updated successfully'
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get a single project by ID
exports.getProjectById = async (req, res) => {
  try {
    const companyId = req.user._id;
    const { projectId } = req.params;

    const portfolio = await Portfolio.findOne({ companyId });
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found' });
    }

    const project = portfolio.projects.find(
      project => project._id.toString() === projectId
    );
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
