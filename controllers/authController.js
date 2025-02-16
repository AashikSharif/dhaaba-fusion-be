import mongoose from "mongoose"; // ✅ Add this line
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from 'path';
dotenv.config();

import { bucket } from "../config/firebase.js";
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(email, password);

        // Check if user exists
        const user = await User.findOne({ email });
        console.log(user);
        if (!user) return res.status(400).json({ msg: "Invalid Credentials" });

        // Compare Password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(isMatch);
        if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

        // Generate JWT Token
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" }, (err, token) => {
            if (err) throw err;
            console.log("done");
            res.json({ user });
        });

    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};


// REGISTER USER
export const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        console.log("here");

        // Check if user exists
        let userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ msg: "User already exists" });

        // Generate a UID automatically
        const uid = new mongoose.Types.ObjectId().toString();

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User in MongoDB (optionally add an imageUrl field in your User model)
        const user = new User({
            uid,
            email,
            username,
            password: hashedPassword,
        });
        await user.save();

        // If an image file is uploaded, process the upload
        if (req.file) {
            // Define a unique file name within the 'users' folder
            const fileName = `users/${uid}${path.extname(req.file.originalname)}`;
            const file = bucket.file(fileName);

            // Upload the file buffer to Firebase Storage
            await file.save(req.file.buffer, {
                metadata: { contentType: req.file.mimetype },
            });

            // (Optional) Make the file public so you can access it via URL
            await file.makePublic();
            const imageUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

            // Update the user document with the image URL if desired
            user.imageUrl = imageUrl;
            const newUser = await user.save();

            return res.status(201).json({ user: newUser });
        }

        res.status(201).json({ msg: "User registered successfully", user });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};
