const cloudinary = require('cloudinary').v2;

/**
 * Cloudinary Service
 * Upload và quản lý files trên Cloudinary
 * Mỗi bot có folder riêng: chatbot-saas/{botId}/
 */

// Config từ env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload text content lên Cloudinary dưới dạng .txt file
 * @param {string} content - Nội dung text
 * @param {string} botId - Bot ID (dùng làm folder)
 * @param {string} fileName - Tên file
 * @returns {Object} { url, publicId, size }
 */
const uploadText = async (content, botId, fileName = 'document') => {
  try {
    // Tạo data URI từ text content
    const base64Content = Buffer.from(content, 'utf-8').toString('base64');
    const dataUri = `data:text/plain;base64,${base64Content}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `chatbot-saas/${botId}`,
      public_id: `${fileName}_${Date.now()}`,
      resource_type: 'raw'
    });

    console.log(`☁️ Uploaded text to Cloudinary: ${result.secure_url}`);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      size: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error.message);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Upload PDF buffer lên Cloudinary
 * @param {Buffer} buffer - PDF file buffer
 * @param {string} botId - Bot ID
 * @param {string} originalName - Tên file gốc
 * @returns {Object} { url, publicId, size }
 */
const uploadPdf = async (buffer, botId, originalName = 'document.pdf') => {
  try {
    // Tạo data URI từ buffer
    const base64Content = buffer.toString('base64');
    const dataUri = `data:application/pdf;base64,${base64Content}`;

    // Tên file không có extension
    const cleanName = originalName.replace(/\.pdf$/i, '');

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `chatbot-saas/${botId}`,
      public_id: `${cleanName}_${Date.now()}`,
      resource_type: 'raw'
    });

    console.log(`☁️ Uploaded PDF to Cloudinary: ${result.secure_url}`);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      size: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary PDF upload error:', error.message);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Xoá file trên Cloudinary
 * @param {string} publicId - Public ID của file
 */
const deleteFile = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    console.log(`🗑️ Deleted from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error('Cloudinary delete error:', error.message);
    // Không throw - xoá Cloudinary fail không nên block flow
  }
};

/**
 * Xoá toàn bộ folder của bot trên Cloudinary
 * @param {string} botId - Bot ID
 */
const deleteBotFolder = async (botId) => {
  try {
    await cloudinary.api.delete_resources_by_prefix(`chatbot-saas/${botId}/`, {
      resource_type: 'raw'
    });
    await cloudinary.api.delete_folder(`chatbot-saas/${botId}`);
    console.log(`🗑️ Deleted Cloudinary folder for bot: ${botId}`);
  } catch (error) {
    console.error('Cloudinary folder delete error:', error.message);
  }
};

module.exports = { uploadText, uploadPdf, deleteFile, deleteBotFolder };
