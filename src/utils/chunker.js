/**
 * Text Chunker Utility
 * Chia nội dung thành các chunks nhỏ để embedding hiệu quả
 * 
 * Strategy: Split theo paragraphs trước, rồi merge thành chunks ~500 chars
 * với overlap ~100 chars để giữ context giữa các chunks
 */

const CHUNK_SIZE = 500;      // ~500 ký tự per chunk
const CHUNK_OVERLAP = 100;   // overlap giữa các chunks

/**
 * Chia text thành chunks với overlap
 * @param {string} text - Nội dung cần chia
 * @param {Object} options - { chunkSize, chunkOverlap }
 * @returns {string[]} Array of text chunks
 */
const chunkText = (text, options = {}) => {
  const {
    chunkSize = CHUNK_SIZE,
    chunkOverlap = CHUNK_OVERLAP
  } = options;

  if (!text || text.trim().length === 0) {
    return [];
  }

  // Clean text: normalize whitespace
  const cleanedText = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  // Nếu text ngắn hơn chunk size, trả về nguyên
  if (cleanedText.length <= chunkSize) {
    return [cleanedText];
  }

  // Split theo paragraphs trước
  const paragraphs = cleanedText.split(/\n\n+/);
  const chunks = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;

    // Nếu paragraph quá dài, split theo sentences
    if (trimmedParagraph.length > chunkSize) {
      // Flush current chunk nếu có
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      // Split long paragraph theo sentences
      const sentences = trimmedParagraph.match(/[^.!?]+[.!?]+/g) || [trimmedParagraph];
      let sentenceChunk = '';

      for (const sentence of sentences) {
        if ((sentenceChunk + ' ' + sentence).length > chunkSize && sentenceChunk) {
          chunks.push(sentenceChunk.trim());
          // Overlap: giữ phần cuối của chunk trước
          const words = sentenceChunk.split(' ');
          const overlapWords = Math.ceil(words.length * (chunkOverlap / chunkSize));
          sentenceChunk = words.slice(-overlapWords).join(' ') + ' ' + sentence;
        } else {
          sentenceChunk = sentenceChunk ? sentenceChunk + ' ' + sentence : sentence;
        }
      }

      if (sentenceChunk) {
        currentChunk = sentenceChunk;
      }
    } else {
      // Merge paragraphs vào chunk
      if ((currentChunk + '\n\n' + trimmedParagraph).length > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        // Overlap: giữ vài câu cuối
        const lastSentences = currentChunk.split(/[.!?]+/).slice(-2).join('. ');
        currentChunk = lastSentences.length < chunkOverlap
          ? lastSentences + '\n\n' + trimmedParagraph
          : trimmedParagraph;
      } else {
        currentChunk = currentChunk
          ? currentChunk + '\n\n' + trimmedParagraph
          : trimmedParagraph;
      }
    }
  }

  // Flush remaining
  if (currentChunk && currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

module.exports = { chunkText };
