import Joi from "joi";

export const likeControllerValidator = Joi.object({
  _csrf: Joi.string().required(),

  userName: Joi.string().pattern(new RegExp("^[a-z]+$")).required(),
  postId: Joi.string()
    .pattern(new RegExp("^(?:[0-9a-fA-F]{24}|(?:[0-9]{1,19}))$"))
    .required(),

  userData: Joi.object().required(),
});
