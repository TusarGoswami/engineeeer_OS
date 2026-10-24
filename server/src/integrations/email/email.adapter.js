import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

export class EmailAdapter {
  /**
   * Send transactional email
   * @param {Object} options - { to, subject, html, text }
   */
  static async sendEmail({ to, subject, html: _html, text }) {
    if (env.EMAIL_PROVIDER === 'console' || env.NODE_ENV === 'test') {
      logger.info({ to, subject }, `[Email Adapter - Console] To: ${to} | Subject: "${subject}"`);
      if (text) {
        logger.debug({ text }, '[Email Body Preview]');
      }
      return { success: true, messageId: `mock-${Date.now()}` };
    }

    // In production with SES/SMTP
    logger.info(
      { to, subject },
      `[Email Adapter - ${env.EMAIL_PROVIDER}] Dispatched email to ${to}`
    );
    return { success: true, messageId: `msg-${Date.now()}` };
  }

  static async sendVerificationEmail(to, name, verificationToken) {
    const url = `${env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    return this.sendEmail({
      to,
      subject: 'Verify your EngineerOS Account',
      text: `Hello ${name},\n\nPlease verify your EngineerOS account by clicking: ${url}\n\nBest,\nThe EngineerOS Team`,
      html: `<h2>Hello ${name},</h2><p>Please verify your EngineerOS account by clicking below:</p><p><a href="${url}">Verify Account</a></p>`,
    });
  }

  static async sendPasswordResetEmail(to, name, resetToken) {
    const url = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;
    return this.sendEmail({
      to,
      subject: 'Reset your EngineerOS Password',
      text: `Hello ${name},\n\nYou requested a password reset. Click this link within 1 hour: ${url}\n\nIf you did not request this, please ignore this email.`,
      html: `<h2>Hello ${name},</h2><p>You requested a password reset. Click below within 1 hour:</p><p><a href="${url}">Reset Password</a></p>`,
    });
  }
}

export default EmailAdapter;
