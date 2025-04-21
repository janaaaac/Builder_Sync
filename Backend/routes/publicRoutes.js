const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');

// Public route to get a company's portfolio
router.get('/portfolio/:companyId', portfolioController.getCompanyPortfolio);

// Add other public routes as needed

module.exports = router;
