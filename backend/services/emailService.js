const nodemailer = require("nodemailer");

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    }
  });
};

const sendContactEmail = async (contactData, recipientEmail) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"DriveNow Contact" <contact@drivenow.com>',
      to: recipientEmail,
      subject: `Contact Form: ${contactData.subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${contactData.name}</p>
        <p><strong>Email:</strong> ${contactData.email}</p>
        <p><strong>Phone:</strong> ${contactData.phone || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${contactData.message}</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return {
      messageId: info.messageId,
      previewURL: nodemailer.getTestMessageUrl(info)
    };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = {
  sendContactEmail,
};