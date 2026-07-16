import express from 'express';

const router = express.Router();

import * as authController from '../controllers/auth.controller.js';
import { validateRegisterUser } from '../middleware/validateRegisterUser.js';

router.post("/register", validateRegisterUser, authController.registerUser);

import { validateLoginUser } from '../middleware/validateLoginUser.js';

router.post("/login", validateLoginUser, authController.loginUser);

export default router;