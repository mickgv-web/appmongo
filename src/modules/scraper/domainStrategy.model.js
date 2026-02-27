import mongoose from "mongoose";

const domainStrategySchema = new mongoose.Schema(
  {
    domain: { type: String, unique: true },
    preferredStrategy: {
      type: String,
      enum: ["http", "browser"],
      default: "http",
    },
    lastUpdatedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("DomainStrategy", domainStrategySchema);