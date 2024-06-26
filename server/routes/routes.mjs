import { csrfController } from "../controllers/auth/csrf.controller.mjs";
import express from "express";
import { likeController } from "../controllers/like/like.controller.mjs";
import { userVerificationMiddleware } from "../middlewares/user.verification.middleware.mjs";

export const routes = express.Router();

routes.post("/post/like", userVerificationMiddleware, likeController);

routes.get("/auth/csrf-token", csrfController);
