import mongoose from "mongoose";

const likePerUserSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true, ref: "User" },
  },
  { timestamps: true }
);

const likeSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "posts" },
    likes: [likePerUserSchema],
    totalLikes: { type: Number },
  },
  { timestamps: true }
);

export const LikeModel = mongoose.model("Like", likeSchema);
