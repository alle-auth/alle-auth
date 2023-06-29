import { Router } from 'express';
import auth from '../middlewares/auth';
import authRoutes from './auth.route';
import userRoutes from './user.route';

const router = Router();

// UNAUTHENTICATED ROUTES
router.use('/auth', authRoutes);

// AUTHENTICATED ROUTES
router.use(auth);
router.use('/users', userRoutes);

export default router;
