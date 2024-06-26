import Joi from "joi";

export const likeControllerValidator = Joi.object({
  _csrf: Joi.string().required(),

  userName: Joi.string().pattern(new RegExp("^[a-z]+$")).required(),
  postId: Joi.string().required(),

  userData: Joi.object().required(),
});
