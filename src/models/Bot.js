const mongoose = require('mongoose');

/**
 * Bot Schema
 * Mỗi bot có:
 * - name, description: thông tin cơ bản
 * - type: loại bot (sales/support/content) quyết định behavior
 * - systemPrompt: custom prompt người dùng có thể override
 */
const botSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Bot name is required'],
    trim: true,
    maxlength: [100, 'Bot name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  type: {
    type: String,
    enum: {
      values: ['sales', 'support', 'content'],
      message: 'Type must be: sales, support, or content'
    },
    required: [true, 'Bot type is required']
  },
  systemPrompt: {
    type: String,
    default: '' // Nếu rỗng, sẽ dùng default prompt theo type
  },
  // Placeholder cho multi-tenant
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-update updatedAt
botSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Bot', botSchema);
