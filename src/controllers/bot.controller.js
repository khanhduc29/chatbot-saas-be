const Bot = require('../models/Bot');
const Document = require('../models/Document');
const Message = require('../models/Message');
const cloudinary = require('../services/cloudinary.service');

/**
 * Bot Controller - CRUD operations
 */

// POST /api/bots - Tạo bot mới
const createBot = async (req, res, next) => {
  try {
    const { name, description, type, systemPrompt } = req.body;

    const bot = await Bot.create({
      name,
      description,
      type,
      systemPrompt
    });

    res.status(201).json({
      success: true,
      data: bot
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bots - Lấy danh sách bots
const getBots = async (req, res, next) => {
  try {
    const bots = await Bot.find().sort({ createdAt: -1 });

    // Đếm số documents và messages cho mỗi bot
    const botsWithStats = await Promise.all(
      bots.map(async (bot) => {
        const [docCount, msgCount] = await Promise.all([
          Document.countDocuments({ botId: bot._id }),
          Message.countDocuments({ botId: bot._id })
        ]);

        return {
          ...bot.toObject(),
          stats: {
            documents: docCount,
            messages: msgCount
          }
        };
      })
    );

    res.json({
      success: true,
      count: botsWithStats.length,
      data: botsWithStats
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bots/:id - Lấy chi tiết bot
const getBot = async (req, res, next) => {
  try {
    const bot = await Bot.findById(req.params.id);

    if (!bot) {
      return res.status(404).json({
        success: false,
        error: 'Bot not found'
      });
    }

    // Lấy stats
    const [docCount, msgCount] = await Promise.all([
      Document.countDocuments({ botId: bot._id }),
      Message.countDocuments({ botId: bot._id })
    ]);

    res.json({
      success: true,
      data: {
        ...bot.toObject(),
        stats: { documents: docCount, messages: msgCount }
      }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/bots/:id - Cập nhật bot
const updateBot = async (req, res, next) => {
  try {
    const { name, description, type, systemPrompt } = req.body;

    const bot = await Bot.findByIdAndUpdate(
      req.params.id,
      { name, description, type, systemPrompt, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!bot) {
      return res.status(404).json({
        success: false,
        error: 'Bot not found'
      });
    }

    res.json({
      success: true,
      data: bot
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/bots/:id - Xoá bot + documents + messages
const deleteBot = async (req, res, next) => {
  try {
    const bot = await Bot.findById(req.params.id);

    if (!bot) {
      return res.status(404).json({
        success: false,
        error: 'Bot not found'
      });
    }

    // Xoá tất cả data liên quan + Cloudinary folder
    await Promise.all([
      Document.deleteMany({ botId: bot._id }),
      Message.deleteMany({ botId: bot._id }),
      Bot.findByIdAndDelete(bot._id),
      cloudinary.deleteBotFolder(bot._id.toString())
    ]);

    res.json({
      success: true,
      message: 'Bot and all related data deleted'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBot, getBots, getBot, updateBot, deleteBot };
