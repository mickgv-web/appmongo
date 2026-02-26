import mongoose from "mongoose";

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Mongo connected");
  } catch (error) {
    console.error("Mongo error:", error);
    process.exit(1);
  }
}