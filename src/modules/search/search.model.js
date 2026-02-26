import mongoose from "mongoose";

const searchSchema = new mongoose.Schema(
  {
    query: { type: String, required: true },
    normalizedQuery: { type: String, required: true, unique: true },
    lastUpdatedAt: Date,
    status: { type: String, default: "idle" }
  },
  { timestamps: true }
);

export default mongoose.model("Search", searchSchema);