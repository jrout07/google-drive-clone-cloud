import express from 'express';
import { FoldersController } from '../controllers/folders';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const foldersController = new FoldersController();

// All folder routes require authentication
router.use(authenticate);

// Create folder
router.post('/', foldersController.createFolder.bind(foldersController));

// Get folders (with optional parent filter and tree view)
router.get('/', foldersController.getFolders.bind(foldersController));

// Get specific folder (with optional contents)
router.get('/:id', foldersController.getFolder.bind(foldersController));

// Download folder as ZIP
router.get('/:id/download', foldersController.downloadFolder.bind(foldersController));

// Update folder
router.put('/:id', foldersController.updateFolder.bind(foldersController));

// Delete folder
router.delete('/:id', foldersController.deleteFolder.bind(foldersController));

export default router;
