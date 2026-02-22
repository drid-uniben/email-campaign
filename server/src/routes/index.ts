import { Router } from 'express';
import adminRoutes from './admin.routes';
import authRoutes from './auth.routes';

const router = Router();

// Mount route groups
router.use('/admin', adminRoutes);
router.use('/auth', authRoutes);

// Root route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Email Campaign and Unit Management System API is running',
  });
});

export default router;
