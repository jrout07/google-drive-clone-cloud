import express from 'express';
import { AuthController } from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const authController = new AuthController();

// Registration route
router.post('/register', authController.register.bind(authController));

// Login route
router.post('/login', authController.login.bind(authController));

// Logout route
router.post('/logout', authenticate, authController.logout.bind(authController));

// Token verification route
router.get('/verify', authController.verifyToken.bind(authController));

// Get current user (same as verify but with different endpoint name)
router.get('/me', authenticate, authController.verifyToken.bind(authController));

export default router;