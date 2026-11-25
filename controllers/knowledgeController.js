const knowledgeService = require('../services/knowledgeService');

exports.overview = (req, res) => res.json(knowledgeService.overview());
