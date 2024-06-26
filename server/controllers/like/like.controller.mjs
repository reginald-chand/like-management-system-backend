import { LikeModel } from "../../models/like/like.model.mjs";
import { likeControllerValidator } from "../../validators/like/like.controller.validator.mjs";
import { logger } from "../../configs/logger.config.mjs";
import mongoose from "mongoose";

export const likeController = async (request, response) => {
  const { error, value } = likeControllerValidator.validate(request.body);

  if (error) {
    return response.status(400).json({ responseMessage: error.message });
  }

  const { userName, postId } = value;

  try {
    let foundLikedUser = false;

    const database = mongoose.connection.db;

    const existingUser = await database
      .collection("users")
      .findOne({ userName: { $eq: userName } });

    if (!existingUser) {
      return response.status(404).json({ responseMessage: "User not found." });
    }

    const existingPosts = await database.collection("posts").find({}).toArray();

    if (existingPosts === null) {
      return response
        .status(500)
        .json({ responseMessage: "Posts model could not be found." });
    }

    for (const post of existingPosts) {
      const existingLikeDocument = await LikeModel.findOne({
        _id: { $eq: post._id },
      });

      if (!existingLikeDocument) {
        await LikeModel.create({ _id: post._id });
      }
    }

    const existingLikers = await LikeModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(postId) } },
      { $unwind: "$likes" },
      { $match: { "likes.userName": userName } },
      { $project: { userName: userName } },
    ]);

    existingLikers.forEach((likedUser) => {
      if (userName === likedUser.userName) {
        foundLikedUser = true;
      }
    });

    if (foundLikedUser) {
      const existingPost = await LikeModel.findOneAndUpdate(
        { _id: { $eq: new mongoose.Types.ObjectId(postId) } },
        { $pull: { likes: { userName: userName } } },
        { new: true, upsert: true }
      );

      if (!existingPost) {
        return response
          .status(404)
          .json({ responseMessage: "Post not found." });
      }

      await LikeModel.findOneAndUpdate(
        { _id: { $eq: new mongoose.Types.ObjectId(postId) } },
        { totalLikes: existingPost.likes.length },
        { new: true, upsert: true }
      );

      return response.status(200).json({ responseMessage: "Unlike" });
    }

    const existingPost = await LikeModel.findOneAndUpdate(
      { _id: { $eq: new mongoose.Types.ObjectId(postId) } },
      { $push: { likes: { userName: userName } } },
      { new: true, upsert: true }
    );

    if (!existingPost) {
      return response.status(404).json({ responseMessage: "Post not found." });
    }

    await LikeModel.findOneAndUpdate(
      { _id: { $eq: new mongoose.Types.ObjectId(postId) } },
      { totalLikes: existingPost.likes.length },
      { new: true, upsert: true }
    );

    return response.status(200).json({ responseMessage: "Like" });
  } catch (error) {
    logger.log({
      level: "error",
      message: error,
      additional: "Internal server error.",
    });

    return response.status(500).json({
      responseMessage: "Internal server error.",
    });
  }
};
