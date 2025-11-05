import express from 'express';
import { UsersController } from '../controllers/users';
import { authenticate } from '../middleware/auth';
import { uploadSingle, handleUploadError } from '../middleware/upload';

const router = express.Router();
const usersController = new UsersController();

// All user routes require authentication
router.use(authenticate);

// Get current user profile
router.get('/profile', usersController.getProfile.bind(usersController));

// Update user profile
router.put('/profile', usersController.updateProfile.bind(usersController));

// Upload profile image
router.post('/profile/image', uploadSingle, handleUploadError, usersController.uploadProfileImage.bind(usersController));

// Download user data
router.get('/download-data', usersController.downloadUserData.bind(usersController));

// Delete account
router.delete('/account', usersController.deleteAccount.bind(usersController));

export default router;
