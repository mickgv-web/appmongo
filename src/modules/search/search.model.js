import mongoose from "mongoose";

const searchSchema = new mongoose.Schema(
  {
    query: { type: String, required: true },
    normalizedQuery: { type: String, required: true, unique: true },
    lastUpdatedAt: Date,
    status: {
      type: String,
      enum: ["idle", "processing"],
      default: "idle",
    },
    lastStrategySummary: {
      type: Object,
      default: {},
    },
    lastHttpFailures: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

export default mongoose.model("Search", searchSchema);
