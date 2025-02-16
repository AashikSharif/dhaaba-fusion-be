import mongoose from "mongoose"; // ✅ Add this line
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "../config/firebase-config.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import dotenv from "dotenv";
dotenv.config();

// ✅ Ensure loginUser is correctly defined
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "Invalid Credentials" });

        // Compare Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

        // Generate JWT Token
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });

    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// ✅ Ensure registerUser is also exported

// REGISTER USER
export const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user exists
        let userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ msg: "User already exists" });

        // Generate a UID automatically
        const uid = new mongoose.Types.ObjectId().toString(); // ✅ Auto-generate UID

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // // Upload Profile Picture to Firebase
        // const file = req.file;
        // console.log(req.file);
        // if (!file) return res.status(400).json({ msg: "Profile picture is required" });

        // const storageRef = ref(storage, `users/${username}.jpg`);
        // const result = await uploadBytes(storageRef, file.buffer);
        // const profilePicURL = await getDownloadURL(result);

        // Create User in MongoDB
        const user = new User({ uid, username, email, password: hashedPassword//, profilePicture: profilePicURL 
        });
        await user.save();

        res.status(201).json({ msg: "User registered successfully", uid });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};