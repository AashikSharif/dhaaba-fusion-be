import express from "express";
import User from '../models/user.js';
import { bucket } from '../config/firebase.js';
import path from 'path';
import multer from 'multer';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.put('/:uid', upload.single('profilePic'), async (req, res) => {
  try {
    const { uid } = req.params;
    const { bio } = req.body;

    console.log(`Updating user: ${uid}`);

    // Update bio first
    let updatedUser = await User.findOneAndUpdate(
      { uid: uid },
      { bio },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.file) {
      console.log(`Uploading new profile picture for: ${uid}`);

      const fileName = `users/${uid}${path.extname(req.file.originalname)}`;
      const file = bucket.file(fileName);

      await file.save(req.file.buffer, {
        metadata: { contentType: req.file.mimetype },
      });

      await file.makePublic();
      const imageUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

      // Update user profile picture
      updatedUser = await User.findOneAndUpdate(
        { uid: uid },
        { profilePicture: imageUrl },
        { new: true, runValidators: true }
      );
      console.log(imageUrl);

    }


    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
