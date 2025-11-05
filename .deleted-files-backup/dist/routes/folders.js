"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const folders_1 = require("../controllers/folders");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const foldersController = new folders_1.FoldersController();
router.use(auth_1.authenticate);
router.post('/', foldersController.createFolder.bind(foldersController));
router.get('/', foldersController.getFolders.bind(foldersController));
router.get('/:id', foldersController.getFolder.bind(foldersController));
router.put('/:id', foldersController.updateFolder.bind(foldersController));
router.delete('/:id', foldersController.deleteFolder.bind(foldersController));
exports.default = router;
//# sourceMappingURL=folders.js.map