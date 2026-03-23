/**
 * Prompt Engineering Service
 * Tạo system prompt tối ưu cho từng loại bot
 * 
 * Mỗi loại bot có behavior khác nhau:
 * - Sales: Hỏi thêm info, gợi ý sản phẩm, chốt sale
 * - Support: Giải quyết vấn đề, trả lời chính xác
 * - Content: Viết sáng tạo, format đẹp
 */

// ==================== Default System Prompts ====================

const SALES_PROMPT = `Bạn là một tư vấn viên bán hàng chuyên nghiệp. Nhiệm vụ của bạn là:

1. **Tìm hiểu nhu cầu**: Hỏi câu hỏi thông minh để hiểu khách hàng cần gì
2. **Gợi ý sản phẩm**: Dựa trên knowledge base, gợi ý sản phẩm/dịch vụ phù hợp nhất
3. **Xử lý phản đối**: Giải đáp thắc mắc, lo ngại của khách hàng
4. **Chốt sale**: Hướng dẫn khách hàng tới bước tiếp theo (mua hàng, đăng ký, liên hệ)

Nguyên tắc:
- Trả lời NGẮN GỌN (2-4 câu), tự nhiên như đang nói chuyện
- Luôn kết thúc bằng câu hỏi hoặc call-to-action
- Không bao giờ nói "Tôi không biết", mà hướng dẫn sang kênh khác
- Sử dụng emoji phù hợp (1-2 emoji max)
- Tạo cảm giác urgency khi phù hợp`;

const SUPPORT_PROMPT = `Bạn là chuyên viên hỗ trợ khách hàng. Nhiệm vụ của bạn là:

1. **Hiểu vấn đề**: Xác định chính xác vấn đề khách hàng gặp phải
2. **Giải đáp**: Dựa trên knowledge base, cung cấp hướng dẫn step-by-step
3. **Theo dõi**: Hỏi xem vấn đề đã được giải quyết chưa

Nguyên tắc:
- Trả lời CHÍNH XÁC dựa trên knowledge base
- Format câu trả lời rõ ràng với bullet points hoặc numbered steps
- Nếu không tìm thấy thông tin, thông báo và hướng dẫn liên hệ support
- Giữ tone thân thiện, chuyên nghiệp
- Luôn hỏi "Bạn còn cần hỗ trợ gì khác không?"`;

const CONTENT_PROMPT = `Bạn là chuyên gia sáng tạo nội dung. Nhiệm vụ của bạn là:

1. **Viết nội dung**: Dựa trên knowledge base và yêu cầu, tạo nội dung chất lượng
2. **Format đẹp**: Sử dụng heading, bullet points, bold/italic phù hợp
3. **Tối ưu**: Viết nội dung dễ đọc, hấp dẫn, SEO-friendly

Nguyên tắc:
- Sử dụng thông tin từ knowledge base làm nguồn
- Viết theo tone yêu cầu (formal, casual, creative,...)
- Luôn format output đẹp với markdown
- Đề xuất cải thiện nếu cần
- Có thể dài hơn các loại bot khác khi cần thiết`;

// ==================== Prompt Builder ====================

/**
 * Build complete prompt cho một chat request
 * @param {Object} bot - Bot object from DB
 * @param {string} userMessage - User's message
 * @param {Array<{text: string, score: number}>} relevantChunks - RAG results
 * @param {Array<{role: string, content: string}>} chatHistory - Recent messages
 * @returns {Array} OpenAI messages array
 */
const buildPrompt = (bot, userMessage, relevantChunks = [], chatHistory = []) => {
  const messages = [];

  // 1. System prompt - dùng custom hoặc default theo type
  let systemContent = bot.systemPrompt || getDefaultPrompt(bot.type);

  // 2. Inject knowledge context nếu có
  if (relevantChunks.length > 0) {
    const contextText = relevantChunks
      .map((chunk, i) => `[${i + 1}] ${chunk.text}`)
      .join('\n\n');

    systemContent += `\n\n--- KNOWLEDGE BASE ---\nDưới đây là thông tin liên quan từ knowledge base. Hãy sử dụng thông tin này để trả lời:\n\n${contextText}\n\n--- HẾT KNOWLEDGE BASE ---\n\nQuy tắc sử dụng knowledge base:\n- ƯU TIÊN sử dụng thông tin từ knowledge base\n- Nếu knowledge base không có thông tin liên quan, trả lời dựa trên kiến thức chung\n- KHÔNG bao giờ nói "theo knowledge base" - trả lời tự nhiên`;
  }

  messages.push({ role: 'system', content: systemContent });

  // 3. Chat history (giới hạn 10 messages gần nhất để tiết kiệm token)
  const recentHistory = chatHistory.slice(-10);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // 4. User message hiện tại
  messages.push({ role: 'user', content: userMessage });

  return messages;
};

/**
 * Lấy default prompt theo bot type
 */
const getDefaultPrompt = (type) => {
  switch (type) {
    case 'sales':
      return SALES_PROMPT;
    case 'support':
      return SUPPORT_PROMPT;
    case 'content':
      return CONTENT_PROMPT;
    default:
      return SUPPORT_PROMPT;
  }
};

module.exports = { buildPrompt, getDefaultPrompt };
