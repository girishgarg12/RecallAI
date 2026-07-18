import express from 'express';
import {
    getUsers,
    getUserById,
    updateUser,
    patchUser,
    deleteUser
} from "../controllers/user.controller.js";
import validatePatchUser from '../middleware/validatePatchUser.js';
import authenticate from '../middleware/authenticate.js';
const router = express.Router();

router.get("/", authenticate, getUsers);

router.get("/:id", authenticate, getUserById);

router.put("/:id",authenticate, updateUser);

router.patch("/:id", authenticate, validatePatchUser, patchUser);

router.delete("/:id",authenticate, deleteUser);

export default router;