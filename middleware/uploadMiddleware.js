import multer from "multer";
import path from "path";

// Configure storage (storing files in memory for Firebase upload)
const storage = multer.memoryStorage();

// File type validation function
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        return cb(new Error("Only JPEG, JPG, and PNG images are allowed"));
    }
};

// Initialize Multer
const upload = multer({ storage, fileFilter });

export default upload;
