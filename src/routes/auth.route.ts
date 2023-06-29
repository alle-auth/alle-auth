import { Router } from 'express';
import { signup, signin, signout, getProfile, forgotPassword, verifyOtp, 
    resetPassword } from '../controllers/auth.controller';

const router = Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/signout', signout);
router.post('/me', getProfile);
router.post('/forgot', forgotPassword);
router.post('/verify', verifyOtp);
router.post('/reset', resetPassword);

export default router;
