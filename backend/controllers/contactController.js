const { sendContactEmail } = require("../services/emailService");

/**
 * Handle contact form submission
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, subject, and message",
      });
    }

    // Email validation (simple regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Get recipient email from environment variables or use default
    const recipientEmail = process.env.CONTACT_EMAIL || "admin@drivenow.com";

    const emailResult = await sendContactEmail(
      { name, email, phone, subject, message },
      recipientEmail
    );

    // Send back success response with email info
    res.status(200).json({
      success: true,
      message: "Contact form submitted successfully",
      data: {
        messageId: emailResult.messageId,
        // Only include preview URL in development (for Ethereal)
        previewURL:
          process.env.NODE_ENV !== "production"
            ? emailResult.previewURL
            : undefined,
      },
    });
  } catch (error) {
    console.error("Contact form submission error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process contact form submission",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

module.exports = {
  submitContactForm,
};
