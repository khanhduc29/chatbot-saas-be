const express = require('express');
const router = express.Router();
const { createBot, getBots, getBot, updateBot, deleteBot } = require('../controllers/bot.controller');
const { validateRequired, validateBotType } = require('../middleware/validateRequest');

// CRUD routes cho bot
router.post('/', validateRequired(['name', 'type']), validateBotType, createBot);
router.get('/', getBots);
router.get('/:id', getBot);
router.put('/:id', validateBotType, updateBot);
router.delete('/:id', deleteBot);

module.exports = router;
