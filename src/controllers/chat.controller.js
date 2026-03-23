const Bot = require('../models/Bot');
const Message = require('../models/Message');
const { searchRelevantChunks } = require('../services/vector.service');
const { buildPrompt } = require('../services/prompt.service');
const { chatCompletion } = require('../services/openai.service');

/**
 * Chat Controller
 * Flow: Message → Vector Search → Build Prompt → OpenAI → Save & Return
 */

// POST /api/bots/:id/chat - Gửi message tới bot
const sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // 1. Lấy bot config
    const bot = await Bot.findById(req.params.id);
    if (!bot) {
      return res.status(404).json({
        success: false,
        error: 'Bot not found'
      });
    }

    // Kiểm tra quyền sở hữu
    if (req.user.role !== 'admin' && bot.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to chat with this bot'
      });
    }

    console.log(`💬 Chat with bot: ${bot.name} | Message: ${message.substring(0, 50)}...`);

    // 2. Vector search - tìm context liên quan từ knowledge base
    const relevantChunks = await searchRelevantChunks(bot._id, message);

    // 3. Lấy chat history (10 messages gần nhất)
    const chatHistory = await Message.find({ botId: bot._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    chatHistory.reverse(); // Đảo lại cho đúng thứ tự

    // 4. Build prompt (system + context + history + user message)
    const promptMessages = buildPrompt(bot, message, relevantChunks, chatHistory);

    // 5. Gọi OpenAI
    const aiResponse = await chatCompletion(promptMessages);

    // 6. Lưu user message và bot response
    const [userMsg, assistantMsg] = await Promise.all([
      Message.create({
        botId: bot._id,
        role: 'user',
        content: message
      }),
      Message.create({
        botId: bot._id,
        role: 'assistant',
        content: aiResponse,
        contextUsed: relevantChunks.map(c => c.text.substring(0, 100))
      })
    ]);

    res.json({
      success: true,
      data: {
        message: aiResponse,
        contextChunks: relevantChunks.length,
        messageId: assistantMsg._id
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bots/:id/messages - Lấy lịch sử chat
const getMessages = async (req, res, next) => {
  try {
    const { limit = 50, before } = req.query;

    const query = { botId: req.params.id };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    messages.reverse(); // Trả về đúng thứ tự thời gian

    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/bots/:id/messages - Xoá lịch sử chat
const clearMessages = async (req, res, next) => {
  try {
    await Message.deleteMany({ botId: req.params.id });

    res.json({
      success: true,
      message: 'Chat history cleared'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, getMessages, clearMessages };
