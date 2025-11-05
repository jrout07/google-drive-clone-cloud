"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../controllers/auth");
const auth_2 = require("../middleware/auth");
const router = express_1.default.Router();
const authController = new auth_1.AuthController();
router.post('/login', authController.login.bind(authController));
router.post('/logout', auth_2.authenticate, authController.logout.bind(authController));
router.get('/verify', authController.verifyToken.bind(authController));
router.get('/me', auth_2.authenticate, authController.verifyToken.bind(authController));
exports.default = router;
//# sourceMappingURL=auth.js.map