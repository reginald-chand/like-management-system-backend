import { LikeModel } from "../../models/like/like.model.mjs";
import { likeControllerValidator } from "../../validators/like/like.controller.validator.mjs";
import { logger } from "../../configs/logger.config.mjs";
import mongoose from "mongoose";
import { redisClient } from "../../configs/redis.client.config.mjs";

export const likeController = async (request, response) => {
  const { error, value } = likeControllerValidator.validate(request.body);

  if (error) {
    return response.status(400).json({ responseMessage: error.message });
  }

  const { userName, postId, csrfToken, userData } = value;

  try {
    const userSession = await redisClient.hGetAll(userData.email);

    if (csrfToken !== userSession.csrfToken) {
      return response.status(401).json({ responseMessage: "UnAuthorized." });
    }

    const database = mongoose.connection.db;

    const existingUser = await database
      .collection("users")
      .findOne({ userName: { $eq: userName } });

    if (existingUser === null || !existingUser) {
      return response.status(404).json({ responseMessage: "User not found." });
    }

    const existingPosts = await database.collection("posts").find({}).toArray();

    if (existingPosts === null || existingPosts.length === 0) {
      return response.status(404).json({ responseMessage: "Post not found." });
    }

    const existingPostIds = new Set(
      existingPosts.map((post) => post._id.toString())
    );

    if (!existingPostIds.has(postId.toString())) {
      return response.status(404).json({ responseMessage: "Post not found." });
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

    const foundLikedUser = existingLikers.some(
      (likedUser) => userName === likedUser.userName
    );

    if (foundLikedUser) {
      await LikeModel.findOneAndUpdate(
        { _id: { $eq: new mongoose.Types.ObjectId(postId) } },
        { $pull: { likes: { userName: userName } }, $inc: { totalLikes: -1 } },
        { new: true, upsert: true }
      );

      return response.status(200).json({ responseMessage: "Unlike." });
    }

    await LikeModel.findOneAndUpdate(
      { _id: { $eq: new mongoose.Types.ObjectId(postId) } },
      { $push: { likes: { userName: userName } }, $inc: { totalLikes: 1 } },
      { new: true, upsert: true }
    );

    return response.status(200).json({ responseMessage: "Liked." });
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
