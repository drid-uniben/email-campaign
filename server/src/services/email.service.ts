import nodemailer, { Transporter } from 'nodemailer';
import logger from '../utils/logger';
import validateEnv from '../utils/validateEnv';

validateEnv();

class EmailService {
  private transporter: Transporter;
  private emailFrom: string;

  constructor() {
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    ) {
      throw new Error(
        'SMTP configuration must be defined in environment variables'
      );
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    this.emailFrom = process.env.EMAIL_FROM || '';

    if (!this.emailFrom) {
      throw new Error('EMAIL_FROM must be defined in environment variables');
    }
  }

  async sendDynamicEmail(
    to: string,
    subject: string,
    htmlContent: string,
    attachments?: Array<{ filename: string; path: string; contentType: string }>
  ): Promise<void> {
    try {
      const mailOptions: any = {
        from: this.emailFrom,
        to,
        subject,
        html: htmlContent,
      };

      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments.map((att) => ({
          filename: att.filename,
          path: att.path,
          contentType: att.contentType,
        }));
      }

      await this.transporter.sendMail(mailOptions);
      logger.info(
        `Dynamic email sent to: ${to}${attachments?.length ? ` with ${attachments.length} attachment(s)` : ''}`
      );
    } catch (error) {
      logger.error(
        'Failed to send dynamic email:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }
}

export default new EmailService();
