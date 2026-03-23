const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, clearMessages } = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth');

// Tất cả chat routes cần đăng nhập
router.use(protect);

// Chat routes
router.post('/:id/chat', sendMessage);
router.get('/:id/messages', getMessages);
router.delete('/:id/messages', clearMessages);

module.exports = router;
