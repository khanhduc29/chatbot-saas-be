const mongoose = require('mongoose');

/**
 * Message Schema
 * Lưu lịch sử chat theo từng bot
 * role: 'user' | 'assistant' - tương ứng OpenAI format
 */
const messageSchema = new mongoose.Schema({
  botId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot',
    required: [true, 'Bot ID is required'],
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  // Metadata: context đã dùng cho message này (debug purpose)
  contextUsed: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index để query messages theo bot và thời gian
messageSchema.index({ botId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
