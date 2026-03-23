const mongoose = require('mongoose');

/**
 * Document Schema
 * Lưu knowledge base cho mỗi bot
 * Mỗi document được chia thành nhiều chunks, mỗi chunk có embedding vector
 * 
 * Cấu trúc chunks[] cho phép vector search hiệu quả:
 * - text: nội dung chunk gốc
 * - embedding: vector 1536 chiều (text-embedding-3-small)
 */
const chunkSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  embedding: {
    type: mongoose.Schema.Types.Mixed, // TF-IDF object: {tokens, freq, tokenCount}
    required: true
  }
}, { _id: true });

const documentSchema = new mongoose.Schema({
  botId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot',
    required: [true, 'Bot ID is required'],
    index: true
  },
  source: {
    type: String,
    enum: ['text', 'pdf'],
    default: 'text'
  },
  originalName: {
    type: String,
    default: ''
  },
  // Nội dung gốc (trước khi chunking)
  content: {
    type: String,
    required: true
  },
  // Cloudinary storage
  fileUrl: {
    type: String,
    default: '' // URL file trên Cloudinary
  },
  cloudinaryPublicId: {
    type: String,
    default: '' // Public ID để delete
  },
  // Chunks đã embedding
  chunks: [chunkSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Document', documentSchema);
