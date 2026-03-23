const express = require('express');
const cors = require('cors');
const botRoutes = require('./routes/bot.routes');
const chatRoutes = require('./routes/chat.routes');
const knowledgeRoutes = require('./routes/knowledge.routes');
const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ==================== Middleware ====================
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Cho phép upload text lớn
app.use(express.urlencoded({ extended: true }));

// ==================== Routes ====================
app.use('/api/auth', authRoutes);
app.use('/api/bots', botRoutes);
app.use('/api/bots', chatRoutes);
app.use('/api/bots', knowledgeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== Error Handler ====================
app.use(errorHandler);

module.exports = app;
