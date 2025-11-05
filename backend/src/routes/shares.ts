import express from 'express';
import { SharesController } from '../controllers/shares';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const sharesController = new SharesController();

// All share routes require authentication
router.use(authenticate);

// Create share
router.post('/', sharesController.createShare.bind(sharesController));

// Get user's shares
router.get('/', sharesController.getShares.bind(sharesController));

// Get shared resource by token (public endpoint)
router.post('/shared/:token', sharesController.getSharedResource.bind(sharesController));

// Delete share
router.delete('/:id', sharesController.deleteShare.bind(sharesController));

export default router;
