import express from 'express';
import validateCreateUser from "../middleware/validateCreateUser.js";
import {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    patchUser,
    deleteUser
} from "../controllers/user.controller.js";
import validatePatchUser from '../middleware/validatePatchUser.js';
const router = express.Router();

router.post("/", validateCreateUser, createUser);

router.get("/", getUsers);

router.get("/:id", getUserById);

router.put("/:id", updateUser);

router.patch("/:id", validatePatchUser, patchUser);

router.delete("/:id", deleteUser);

export default router;