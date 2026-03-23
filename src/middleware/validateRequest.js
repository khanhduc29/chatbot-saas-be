/**
 * Validate required fields trong request body
 * @param {string[]} fields - Danh sách field bắt buộc
 */
const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter(field => !req.body[field]);

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`
      });
    }
    next();
  };
};

/**
 * Validate bot type
 */
const validateBotType = (req, res, next) => {
  const validTypes = ['sales', 'support', 'content'];

  if (req.body.type && !validTypes.includes(req.body.type)) {
    return res.status(400).json({
      success: false,
      error: `Invalid bot type. Must be one of: ${validTypes.join(', ')}`
    });
  }
  next();
};

module.exports = { validateRequired, validateBotType };
