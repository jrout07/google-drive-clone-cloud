"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const files_1 = require("../controllers/files");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
const filesController = new files_1.FilesController();
router.use(auth_1.authenticate);
router.post('/upload', upload_1.uploadSingle, upload_1.handleUploadError, filesController.uploadFile.bind(filesController));
router.get('/', filesController.getFiles.bind(filesController));
router.get('/:id', filesController.getFile.bind(filesController));
router.get('/:id/download', filesController.downloadFile.bind(filesController));
router.put('/:id', filesController.updateFile.bind(filesController));
router.delete('/:id', filesController.deleteFile.bind(filesController));
exports.default = router;
//# sourceMappingURL=files.js.map