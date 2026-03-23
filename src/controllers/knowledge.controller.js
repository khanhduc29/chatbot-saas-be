const Bot = require('../models/Bot');
const Document = require('../models/Document');
const { processTextToChunks, processPdfToChunks } = require('../services/embedding.service');
const cloudinary = require('../services/cloudinary.service');

/**
 * Knowledge Controller
 * Xử lý upload knowledge base cho bot
 * Files được lưu trên Cloudinary theo folder: chatbot-saas/{botId}/
 */

// POST /api/bots/:id/knowledge - Upload text knowledge
const uploadKnowledge = async (req, res, next) => {
  try {
    const bot = await Bot.findById(req.params.id);
    if (!bot) {
      return res.status(404).json({
        success: false,
        error: 'Bot not found'
      });
    }

    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text content is required'
      });
    }

    console.log(`📝 Processing knowledge for bot: ${bot.name}`);

    // Process text → chunks → embeddings
    const chunks = await processTextToChunks(text);

    // Upload to Cloudinary (non-blocking, không fail nếu lỗi)
    let fileUrl = '';
    let cloudinaryPublicId = '';
    try {
      const uploadResult = await cloudinary.uploadText(text, bot._id.toString(), 'text-knowledge');
      fileUrl = uploadResult.url;
      cloudinaryPublicId = uploadResult.publicId;
    } catch (err) {
      console.warn('⚠️ Cloudinary upload skipped:', err.message);
    }

    // Save document
    const document = await Document.create({
      botId: bot._id,
      source: 'text',
      content: text,
      fileUrl,
      cloudinaryPublicId,
      chunks
    });

    res.status(201).json({
      success: true,
      data: {
        id: document._id,
        chunksCount: chunks.length,
        source: 'text',
        fileUrl
      },
      message: `Successfully processed ${chunks.length} chunks`
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/bots/:id/knowledge/pdf - Upload PDF knowledge
const uploadPdfKnowledge = async (req, res, next) => {
  try {
    const bot = await Bot.findById(req.params.id);
    if (!bot) {
      return res.status(404).json({
        success: false,
        error: 'Bot not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'PDF file is required'
      });
    }

    console.log(`📄 Processing PDF for bot: ${bot.name} - ${req.file.originalname}`);

    // Process PDF → chunks → embeddings
    const chunks = await processPdfToChunks(req.file.buffer);

    // Extract text from PDF for storage
    const pdfParse = require('pdf-parse');
    const pdfData = await pdfParse(req.file.buffer);

    // Upload PDF to Cloudinary
    let fileUrl = '';
    let cloudinaryPublicId = '';
    try {
      const uploadResult = await cloudinary.uploadPdf(
        req.file.buffer,
        bot._id.toString(),
        req.file.originalname
      );
      fileUrl = uploadResult.url;
      cloudinaryPublicId = uploadResult.publicId;
    } catch (err) {
      console.warn('⚠️ Cloudinary PDF upload skipped:', err.message);
    }

    // Save document
    const document = await Document.create({
      botId: bot._id,
      source: 'pdf',
      originalName: req.file.originalname,
      content: pdfData.text,
      fileUrl,
      cloudinaryPublicId,
      chunks
    });

    res.status(201).json({
      success: true,
      data: {
        id: document._id,
        chunksCount: chunks.length,
        source: 'pdf',
        fileName: req.file.originalname,
        fileUrl
      },
      message: `Successfully processed ${chunks.length} chunks from PDF`
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bots/:id/knowledge - Lấy danh sách documents
const getKnowledge = async (req, res, next) => {
  try {
    const documents = await Document.find({ botId: req.params.id })
      .select('-chunks.embedding') // Exclude embedding vectors (quá lớn)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: documents.length,
      data: documents.map(doc => ({
        id: doc._id,
        source: doc.source,
        originalName: doc.originalName,
        chunksCount: doc.chunks.length,
        contentPreview: doc.content.substring(0, 200) + '...',
        fileUrl: doc.fileUrl || '',
        createdAt: doc.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/bots/:id/knowledge/:docId - Xoá document
const deleteKnowledge = async (req, res, next) => {
  try {
    const document = await Document.findOneAndDelete({
      _id: req.params.docId,
      botId: req.params.id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Xoá file trên Cloudinary nếu có
    if (document.cloudinaryPublicId) {
      await cloudinary.deleteFile(document.cloudinaryPublicId);
    }

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bots/:id/knowledge/:docId - Xem chi tiết document (preview)
const getDocumentDetail = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.docId,
      botId: req.params.id
    }).select('-chunks.embedding');

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: document._id,
        source: document.source,
        originalName: document.originalName,
        content: document.content,
        fileUrl: document.fileUrl || '',
        chunks: document.chunks.map((chunk, i) => ({
          index: i + 1,
          text: chunk.text
        })),
        chunksCount: document.chunks.length,
        createdAt: document.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bots/:id/knowledge/:docId/download - Tải document dạng text
const downloadDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.docId,
      botId: req.params.id
    }).select('content source originalName');

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const fileName = document.originalName || `document-${document._id}.txt`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(document.content);
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadKnowledge, uploadPdfKnowledge, getKnowledge, deleteKnowledge, getDocumentDetail, downloadDocument };
