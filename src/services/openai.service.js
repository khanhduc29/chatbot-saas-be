const OpenAI = require('openai');

/**
 * Groq Client - sử dụng OpenAI SDK với Groq base URL
 * Groq cung cấp API tương thích OpenAI nên dùng chung SDK
 */
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
});

/**
 * Gọi Groq Chat Completion (llama-3.3-70b-versatile)
 * @param {Array} messages - Array of {role, content}
 * @param {Object} options - temperature, max_tokens,...
 * @returns {string} response text
 */
const chatCompletion = async (messages, options = {}) => {
  const {
    model = process.env.CHAT_MODEL || 'llama-3.3-70b-versatile',
    temperature = 0.7,
    maxTokens = 1024
  } = options;

  try {
    const response = await groq.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Groq Chat Error:', error.message);
    throw new Error(`Groq API error: ${error.message}`);
  }
};

module.exports = { chatCompletion };
