const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, clearMessages } = require('../controllers/chat.controller');

// Chat routes
router.post('/:id/chat', sendMessage);
router.get('/:id/messages', getMessages);
router.delete('/:id/messages', clearMessages);

module.exports = router;
