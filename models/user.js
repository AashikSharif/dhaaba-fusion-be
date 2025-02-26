import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    uid: { type: String, required: false },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: { type: String },
    bio: { type: String },
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
