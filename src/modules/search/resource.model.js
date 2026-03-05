import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      index: true
    },

    value: {
      type: String,
      required: true
    },

    sourceUrl: String,

    searchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Search",
      index: true
    },

    metadata: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

resourceSchema.index(
  { type: 1, value: 1, searchId: 1 },
  { unique: true }
);

export default mongoose.model("Resource", resourceSchema);