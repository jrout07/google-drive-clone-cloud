import express from 'express';
import { FilesController } from '../controllers/files';
import { authenticate } from '../middleware/auth';
import { uploadSingle, handleUploadError } from '../middleware/upload';

const router = express.Router();
const filesController = new FilesController();

// All file routes require authentication
router.use(authenticate);

// Upload file
router.post('/upload', uploadSingle, handleUploadError, filesController.uploadFile.bind(filesController));

// Get files (with optional folder and search filters)
router.get('/', filesController.getFiles.bind(filesController));

// Get specific file details
router.get('/:id', filesController.getFile.bind(filesController));

// Download file
router.get('/:id/download', filesController.downloadFile.bind(filesController));

// Update file
router.put('/:id', filesController.updateFile.bind(filesController));

// Delete file
router.delete('/:id', filesController.deleteFile.bind(filesController));

export default router;
