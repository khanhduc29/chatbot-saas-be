const { chunkText } = require('../utils/chunker');

/**
 * Local Embedding Service
 * Dùng TF-IDF (Term Frequency - Inverse Document Frequency) thay vì API
 * Ưu điểm: Miễn phí, không cần API key, hoạt động offline
 * Nhược điểm: Chất lượng thấp hơn OpenAI embedding (nhưng đủ cho MVP)
 */

/**
 * Tokenize text thành từ (đơn giản, hỗ trợ tiếng Việt)
 */
const tokenize = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')  // Giữ Unicode letters + numbers
    .split(/\s+/)
    .filter(word => word.length > 1);     // Bỏ từ 1 ký tự
};

/**
 * Tạo TF vector cho text
 * @param {string} text
 * @param {string[]} vocabulary - Global vocabulary
 * @returns {number[]} TF vector
 */
const createTfVector = (text, vocabulary) => {
  const tokens = tokenize(text);
  const tokenCount = tokens.length || 1;
  const freq = {};

  tokens.forEach(t => { freq[t] = (freq[t] || 0) + 1; });

  return vocabulary.map(word => (freq[word] || 0) / tokenCount);
};

/**
 * Tạo embedding cho một text dựa trên vocabulary
 * Sử dụng TF-IDF style nhưng đơn giản hóa
 * @param {string} text
 * @returns {number[]} embedding vector
 */
const createLocalEmbedding = (text) => {
  const tokens = tokenize(text);
  const freq = {};
  const tokenCount = tokens.length || 1;

  tokens.forEach(t => { freq[t] = (freq[t] || 0) + 1; });

  // Trả về object thay vì fixed-size vector
  // Vector search sẽ dùng cách khác để so sánh
  return { tokens, freq, tokenCount };
};

/**
 * Tính similarity giữa query và chunk bằng keyword overlap
 * Dùng Jaccard + TF weighted similarity
 * @param {Object} queryEmb - Query embedding {tokens, freq, tokenCount}
 * @param {Object} chunkEmb - Chunk embedding {tokens, freq, tokenCount}
 * @returns {number} similarity score (0-1)
 */
const localSimilarity = (queryEmb, chunkEmb) => {
  const queryTokens = new Set(queryEmb.tokens);
  const chunkTokens = new Set(chunkEmb.tokens);

  // Tính overlap
  let matchScore = 0;
  let totalWeight = 0;

  for (const token of queryTokens) {
    const qFreq = queryEmb.freq[token] / queryEmb.tokenCount;
    totalWeight += qFreq;

    if (chunkTokens.has(token)) {
      const cFreq = chunkEmb.freq[token] / chunkEmb.tokenCount;
      matchScore += qFreq * (1 + Math.log(1 + cFreq * chunkEmb.tokenCount));
    }
  }

  if (totalWeight === 0) return 0;
  return matchScore / totalWeight;
};

/**
 * Process text thành chunks có local embedding
 * @param {string} text - Nội dung gốc
 * @returns {Array<{text: string, embedding: Object}>} Chunks with embeddings
 */
const processTextToChunks = async (text) => {
  const chunks = chunkText(text);

  if (chunks.length === 0) {
    throw new Error('No content to process after chunking');
  }

  console.log(`📦 Created ${chunks.length} chunks from text`);

  // Tạo local embeddings (instant, no API call)
  const result = chunks.map(chunkText => ({
    text: chunkText,
    embedding: createLocalEmbedding(chunkText)
  }));

  console.log(`🔢 Local embeddings created for ${result.length} chunks`);
  return result;
};

/**
 * Process PDF buffer thành chunks có embedding
 */
const processPdfToChunks = async (pdfBuffer) => {
  const pdfParse = require('pdf-parse');
  const pdfData = await pdfParse(pdfBuffer);

  if (!pdfData.text || pdfData.text.trim().length === 0) {
    throw new Error('PDF has no extractable text');
  }

  console.log(`📄 Extracted ${pdfData.text.length} chars from PDF`);
  return processTextToChunks(pdfData.text);
};

module.exports = { processTextToChunks, processPdfToChunks, createLocalEmbedding, localSimilarity };
