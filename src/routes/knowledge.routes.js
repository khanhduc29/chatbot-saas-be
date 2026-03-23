const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  uploadKnowledge,
  uploadPdfKnowledge,
  getKnowledge,
  deleteKnowledge,
  getDocumentDetail,
  downloadDocument
} = require('../controllers/knowledge.controller');

// Multer config cho PDF upload (in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Knowledge routes
router.post('/:id/knowledge', uploadKnowledge);           // Upload text
router.post('/:id/knowledge/pdf', upload.single('file'), uploadPdfKnowledge); // Upload PDF
router.get('/:id/knowledge', getKnowledge);                // List documents
router.get('/:id/knowledge/:docId', getDocumentDetail);    // Preview document
router.get('/:id/knowledge/:docId/download', downloadDocument); // Download document
router.delete('/:id/knowledge/:docId', deleteKnowledge);   // Delete document

module.exports = router;
