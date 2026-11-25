const featureService = require('../services/featureService');

exports.matrix = (req, res) => res.json(featureService.matrix());
