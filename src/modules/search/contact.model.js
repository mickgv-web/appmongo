import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    email: String,
    phone: String,
    sourceUrl: String,
    searchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Search",
      index: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Contact", contactSchema);