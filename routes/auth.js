import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js"; // ✅ Ensure correct import
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/register", upload.single("profilePicture"), registerUser);
router.post("/login", loginUser); // ✅ Fix: loginUser is now correctly imported

export default router;
