const { body, param, validationResult } = require("express-validator");

function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "fail",
      errors: errors
        .array()
        .map((err) => ({ field: err.path, message: err.msg })),
    });
  }

  next();
}

const signUpValidator = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long.")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter and one special character.",
    ),
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name field cannot be left blank."),
  validateRequest,
];

const postValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Article title is required.")
    .isLength({ max: 100 })
    .withMessage("Titles must be under 100 characters."),
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Article content body cannot be empty."),
  validateRequest,
];

const commentValidator = [
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Comment text cannot be empty."),
  validateRequest,
];

const idParamValidator = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("The provided ID must be a valid positive integer."),
  validateRequest,
];

module.exports = {
  signUpValidator,
  postValidator,
  commentValidator,
  idParamValidator,
};
