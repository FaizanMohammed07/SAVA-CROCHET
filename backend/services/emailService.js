const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      const mailOptions = {
        from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
        to,
        subject,
        html,
        text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId} to ${to}`);
      return info;
    } catch (error) {
      logger.error(`Email send error: ${error.message}`);
      throw error;
    }
  }

  async sendVerificationEmail(user, token) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#fdf6f0;padding:30px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:20px;">
          <h1 style="color:#8B4513;margin:0;">🧶 SAVA CROCHETS</h1>
        </div>
        <h2 style="color:#333;">Welcome, ${user.firstName}!</h2>
        <p style="color:#555;font-size:16px;">Thank you for joining SAVA CROCHETS. Please verify your email address to get started.</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="${verifyUrl}" style="background:#8B4513;color:white;padding:14px 30px;text-decoration:none;border-radius:8px;font-size:16px;">Verify Email</a>
        </div>
        <p style="color:#888;font-size:13px;">This link expires in 24 hours. If you didn't create an account, please ignore this email.</p>
      </div>
    `;
    return this.sendEmail({
      to: user.email,
      subject: "Verify Your Email - SAVA CROCHETS",
      html,
    });
  }

  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#fdf6f0;padding:30px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:20px;">
          <h1 style="color:#8B4513;margin:0;">🧶 SAVA CROCHETS</h1>
        </div>
        <h2 style="color:#333;">Password Reset</h2>
        <p style="color:#555;font-size:16px;">Hi ${user.firstName}, you requested a password reset. Click below to set a new password.</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="${resetUrl}" style="background:#8B4513;color:white;padding:14px 30px;text-decoration:none;border-radius:8px;font-size:16px;">Reset Password</a>
        </div>
        <p style="color:#888;font-size:13px;">This link expires in 15 minutes. If you didn't request this, please ignore this email.</p>
      </div>
    `;
    return this.sendEmail({
      to: user.email,
      subject: "Password Reset - SAVA CROCHETS",
      html,
    });
  }

  async sendOrderConfirmationEmail(user, order) {
    const html = `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#fdf6f0;padding:30px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:20px;">
          <h1 style="color:#8B4513;margin:0;">🧶 SAVA CROCHETS</h1>
        </div>
        <h2 style="color:#333;">Order Confirmed! 🎉</h2>
        <p style="color:#555;">Hi ${user.firstName}, your order <strong>${order.orderNumber}</strong> has been confirmed.</p>
        <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;">
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Items:</strong> ${order.items.length}</p>
          <p><strong>Total:</strong> ₹${order.totalAmount.toLocaleString()}</p>
          <p><strong>Status:</strong> ${order.status}</p>
        </div>
        <p style="color:#555;">We'll notify you when your handcrafted items are shipped!</p>
      </div>
    `;
    return this.sendEmail({
      to: user.email,
      subject: `Order Confirmed - ${order.orderNumber} | SAVA CROCHETS`,
      html,
    });
  }

  async sendOrderStatusUpdateEmail(user, order) {
    const statusMessages = {
      confirmed: "Your order has been confirmed! ✅",
      processing: "Your handcrafted items are being prepared! 🧶",
      shipped: "Your order has been shipped! 📦",
      out_for_delivery: "Your order is out for delivery! 🚚",
      delivered: "Your order has been delivered! 🎉",
      cancelled: "Your order has been cancelled.",
    };

    const html = `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#fdf6f0;padding:30px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:20px;">
          <h1 style="color:#8B4513;margin:0;">🧶 SAVA CROCHETS</h1>
        </div>
        <h2 style="color:#333;">Order Update</h2>
        <p style="color:#555;font-size:16px;">${statusMessages[order.status] || `Order status: ${order.status}`}</p>
        <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;">
          <p><strong>Order:</strong> ${order.orderNumber}</p>
          <p><strong>Status:</strong> ${order.status.replace(/_/g, " ").toUpperCase()}</p>
          ${order.trackingNumber ? `<p><strong>Tracking:</strong> ${order.trackingNumber}</p>` : ""}
        </div>
      </div>
    `;
    return this.sendEmail({
      to: user.email,
      subject: `Order Update - ${order.orderNumber} | SAVA CROCHETS`,
      html,
    });
  }

  async sendReservationUpdateEmail(user, reservation, message) {
    const html = `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#fdf6f0;padding:30px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:20px;">
          <h1 style="color:#8B4513;margin:0;">🧶 SAVA CROCHETS</h1>
        </div>
        <h2 style="color:#333;">Custom Order Update</h2>
        <p style="color:#555;">${message}</p>
        <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;">
          <p><strong>Reservation:</strong> ${reservation.reservationNumber}</p>
          <p><strong>Status:</strong> ${reservation.status.replace(/_/g, " ").toUpperCase()}</p>
          ${reservation.estimatedPrice ? `<p><strong>Estimated Price:</strong> ₹${reservation.estimatedPrice.toLocaleString()}</p>` : ""}
        </div>
      </div>
    `;
    return this.sendEmail({
      to: user.email,
      subject: `Custom Order Update - ${reservation.reservationNumber} | SAVA CROCHETS`,
      html,
    });
  }
}

module.exports = new EmailService();
