import express from 'express';
import adminController from '../controllers/admin.controller';
import unitController from '../controllers/admin/unit.controller';
import dynamicEmailController from '../controllers/admin/dynamicEmail.controller';
import { authenticateAdminToken, rateLimiter } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const adminRateLimiter = rateLimiter(2000, 60 * 60 * 1000);

// Email Attachments Configuration
const getEmailAttachmentsPath = (): string => {
  if (process.env.NODE_ENV === 'production') {
    return path.join(__dirname, '..', 'uploads', 'email-attachments');
  } else {
    return path.join(process.cwd(), 'src', 'uploads', 'email-attachments');
  }
};

const emailAttachmentStorage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    const uploadPath = getEmailAttachmentsPath();
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `attachment-${uniqueSuffix}${extension}`);
  },
});

const emailAttachmentFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and DOCX files are allowed.'));
  }
};

const emailAttachmentUpload = multer({
  storage: emailAttachmentStorage,
  fileFilter: emailAttachmentFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

// --- User Management Routes ---
router.get('/users', authenticateAdminToken, adminRateLimiter, adminController.getUsers);
router.post('/users/add-interns', authenticateAdminToken, adminRateLimiter, adminController.addInterns);
router.patch('/users/:id/status', authenticateAdminToken, adminRateLimiter, adminController.updateUserStatus);
router.delete('/users/:id', authenticateAdminToken, adminRateLimiter, adminController.deleteUser);

// --- Unit Management Routes ---
router.get('/units', authenticateAdminToken, adminRateLimiter, unitController.getAllUnits);
router.get('/units/:id', authenticateAdminToken, adminRateLimiter, unitController.getUnitById);
router.post('/units', authenticateAdminToken, adminRateLimiter, unitController.createUnit);
router.patch('/units/:id', authenticateAdminToken, adminRateLimiter, unitController.updateUnit);
router.delete('/units/:id', authenticateAdminToken, adminRateLimiter, unitController.deleteUnit);

// --- Email Campaign Routes ---
router.get('/campaign/recipients', authenticateAdminToken, adminRateLimiter, dynamicEmailController.getRecipients);
router.post('/campaign/preview', authenticateAdminToken, adminRateLimiter, emailAttachmentUpload.array('attachments', 5), dynamicEmailController.previewEmail);
router.post('/campaign/send', authenticateAdminToken, adminRateLimiter, emailAttachmentUpload.array('attachments', 5), dynamicEmailController.sendCampaign);

export default router;
