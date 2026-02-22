import { Request, Response } from 'express';
import User from '../../model/user.model';
import Unit from '../../model/unit.model';

import emailService from '../../services/email.service';
import asyncHandler from '../../utils/asyncHandler';
import logger from '../../utils/logger';
import { BadRequestError } from '../../utils/customErrors';

interface AdminAuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

interface RecipientData {
  userId: string;
  name: string;
  email: string;
  role: string;
  unit?: string;
  isApproved: boolean;
}

interface EmailAttachment {
  filename: string;
  path: string;
  contentType: string;
}

class DynamicEmailController {
  // Get recipients with filtering
  getRecipients = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { search, unitId, isApproved } = req.query;

      const query: any = {};

      // Filter by Unit
      if (unitId && unitId !== 'all') {
        if (unitId === 'unassigned') {
          query.unit = { $exists: false };
        } else {
          query.unit = unitId;
        }
      }

      // Filter by Approval Status
      if (isApproved !== undefined && isApproved !== 'all') {
        query.isApproved = isApproved === 'true';
      }

      // Search by name or email
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      // Get users and populate unit
      const users = await User.find(query)
        .select('_id name email role unit isApproved')
        .populate('unit', 'name')
        .lean();

      const recipients: RecipientData[] = users.map((user) => ({
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        unit: (user.unit as any)?.name,
        isApproved: user.isApproved,
      }));

      res.status(200).json({
        success: true,
        data: recipients,
      });
    }
  );

  // Preview email with dynamic variables
  previewEmail = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { recipientIds, subject, headerTitle, bodyContent } = req.body;
      const attachments = req.files as Express.Multer.File[] | undefined;

      let ids: string[] = [];
      if (typeof recipientIds === 'string') {
        try {
          ids = JSON.parse(recipientIds);
        } catch (e) {
          ids = recipientIds.split(',').map((id: string) => id.trim());
        }
      } else if (Array.isArray(recipientIds)) {
        ids = recipientIds;
      }

      if (ids.length === 0) {
        throw new BadRequestError(
          'At least one recipient is required for preview'
        );
      }

      const firstRecipientId = ids[0];
      
      if (!firstRecipientId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestError(`Invalid recipient ID format: ${firstRecipientId}`);
      }

      const user = await User.findById(firstRecipientId).populate('unit', 'name').lean();

      if (!user) {
        throw new BadRequestError('Recipient not found');
      }

      const previewData = {
        name: user.name || 'N/A',
        email: user.email || 'N/A',
        role: user.role || 'N/A',
        unit: (user.unit as any)?.name || 'N/A',
      };

      const processedContent = this.replaceVariables(bodyContent, previewData);
      const fullHtml = this.generateEmailHtml(headerTitle, processedContent);

      const attachmentInfo =
        attachments?.map((file) => ({
          filename: file.originalname,
          size: file.size,
          type: file.mimetype,
        })) || [];

      res.status(200).json({
        success: true,
        data: {
          previewHtml: fullHtml,
          previewRecipient: {
            name: user.name,
            email: user.email,
          },
          attachments: attachmentInfo,
        },
      });
    }
  );

  // Send campaign emails
  sendCampaign = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const adminUser = (req as AdminAuthenticatedRequest).user;
      const { recipientIds, subject, headerTitle, bodyContent } = req.body;
      const attachments = req.files as Express.Multer.File[] | undefined;

      let ids: string[] = [];
      if (typeof recipientIds === 'string') {
        try {
          ids = JSON.parse(recipientIds);
        } catch (e) {
          ids = recipientIds.split(',').map((id: string) => id.trim());
        }
      } else if (Array.isArray(recipientIds)) {
        ids = recipientIds;
      }

      if (ids.length === 0) {
        throw new BadRequestError('At least one recipient is required');
      }

      if (!subject || !bodyContent) {
        throw new BadRequestError('Subject and body content are required');
      }

      const emailAttachments: EmailAttachment[] =
        attachments?.map((file) => ({
          filename: file.originalname,
          path: file.path,
          contentType: file.mimetype,
        })) || [];

      const users = await User.find({
        _id: { $in: ids },
      }).populate('unit', 'name').lean();

      const results = {
        sent: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const user of users) {
        try {
          const recipientData = {
            name: user.name || 'N/A',
            email: user.email || 'N/A',
            role: user.role || 'N/A',
            unit: (user.unit as any)?.name || 'N/A',
          };

          const processedContent = this.replaceVariables(
            bodyContent,
            recipientData
          );
          const fullHtml = this.generateEmailHtml(
            headerTitle,
            processedContent
          );

          await emailService.sendDynamicEmail(
            user.email,
            subject,
            fullHtml,
            emailAttachments
          );
          results.sent++;
        } catch (error) {
          results.failed++;
          results.errors.push(
            `Failed to send to ${user.email}: ${(error as Error).message}`
          );
          logger.error(
            `Failed to send campaign email to ${user.email}:`,
            error
          );
        }
      }

      if (attachments) {
        const fs = await import('fs/promises');
        for (const file of attachments) {
          try {
            await fs.unlink(file.path);
          } catch (error) {
            logger.error(
              `Failed to delete attachment file: ${file.path}`,
              error
            );
          }
        }
      }

      logger.info(
        `Admin ${adminUser.id} sent email campaign to ${results.sent} recipients (${results.failed} failed)${emailAttachments.length > 0 ? ` with ${emailAttachments.length} attachment(s)` : ''}`
      );

      res.status(200).json({
        success: true,
        message: `Email sent to ${results.sent} recipients${results.failed > 0 ? ` (${results.failed} failed)` : ''}`,
        data: results,
      });
    }
  );

  // Helper: Replace dynamic variables
  private replaceVariables(
    template: string,
    data: Record<string, string>
  ): string {
    let result = template;

    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, data[key] || 'N/A');
    });

    return result;
  }

  // Helper: Generate full email HTML with branding
  private generateEmailHtml(headerTitle: string, bodyContent: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      line-height: 1.55;
      color: #212121;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9f9f9;
    }
    .header {
      background: #071936;
      color: #fff;
      padding: 24px 16px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 24px;
      background-color: #ffffff;
      border-radius: 0 0 8px 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .footer {
      background: #faf7f8;
      padding: 16px;
      font-size: 14px;
      color: #444;
      border-top: 1px solid #D9E2EA;
      text-align: center;
      margin-top: 20px;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${headerTitle}</h1>
  </div>
  <div class="content">
    ${bodyContent}
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Admin Portal. All rights reserved.</p>
  </div>
</body>
</html>
    `;
  }
}

export default new DynamicEmailController();
