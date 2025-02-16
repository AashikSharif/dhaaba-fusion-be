import express from "express";
import connectDB from "./config/db.js"; // ✅ Fix: Now it should work
import authRoutes from "./routes/auth.js";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();

// ✅ Connect to MongoDB
connectDB();

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
