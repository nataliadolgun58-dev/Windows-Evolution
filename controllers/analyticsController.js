const analyticsService = require('../services/analyticsService');

exports.overview = (req, res) => res.json(analyticsService.overview());
