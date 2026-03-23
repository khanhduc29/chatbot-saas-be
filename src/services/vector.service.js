const Document = require('../models/Document');
const { createLocalEmbedding, localSimilarity } = require('./embedding.service');

/**
 * Vector Search Service (Local TF-IDF version)
 * Tìm chunks liên quan nhất bằng keyword similarity
 * Không cần API call, hoạt động hoàn toàn local
 */

/**
 * Search relevant chunks cho một bot dựa trên query
 * @param {string} botId - Bot ID
 * @param {string} query - User query
 * @param {number} topK - Số chunks tối đa trả về
 * @returns {Array<{text: string, score: number}>} Relevant chunks sorted by score
 */
const searchRelevantChunks = async (botId, query, topK = 5) => {
  // Bước 1: Kiểm tra bot có documents không
  const documents = await Document.find({ botId }).select('chunks');

  if (documents.length === 0) {
    console.log('📭 No knowledge base documents found, skipping search');
    return [];
  }

  // Bước 2: Tạo local embedding cho query
  const queryEmb = createLocalEmbedding(query);

  // Bước 3: Tính similarity cho mỗi chunk
  const scoredChunks = [];

  for (const doc of documents) {
    for (const chunk of doc.chunks) {
      // chunk.embedding lưu dưới dạng object {tokens, freq, tokenCount}
      const chunkEmb = chunk.embedding;
      const score = localSimilarity(queryEmb, chunkEmb);

      scoredChunks.push({
        text: chunk.text,
        score
      });
    }
  }

  // Bước 4: Sort theo score và lấy top K
  scoredChunks.sort((a, b) => b.score - a.score);

  const SIMILARITY_THRESHOLD = 0.1; // Threshold thấp hơn cho TF-IDF
  const relevantChunks = scoredChunks
    .filter(chunk => chunk.score > SIMILARITY_THRESHOLD)
    .slice(0, topK);

  console.log(`🔍 Found ${relevantChunks.length} relevant chunks (threshold: ${SIMILARITY_THRESHOLD})`);

  return relevantChunks;
};

module.exports = { searchRelevantChunks };
