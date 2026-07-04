const { Router } = require("express");
const passport = require("passport");

const controllers = require("../controllers/controllers");
const { requireAuthor, optionalAuth } = require("../middleware/auth");
const {
  idParamValidator,
  signUpValidator,
  postValidator,
  commentValidator,
} = require("../middleware/validators");

const router = Router();

// Public routes
router.get("/", controllers.home);
router.get("/posts", controllers.getPublishedPosts);
router.get(
  "/posts/:id",
  optionalAuth, // allows authors to see their unpublished drafts
  idParamValidator,
  controllers.getPostById,
);

// Authentication & Registration
router.post("/users", signUpValidator, controllers.createUser);
router.post("/login", controllers.loginUser);

// Protected routes
router.post(
  "/posts",
  passport.authenticate("jwt", { session: false }), // Authenticate the user (Verify token & set req.user)
  requireAuthor, // Check if the user has the AUTHOR role
  postValidator,
  controllers.createPost,
);
router.patch(
  "/users/role",
  passport.authenticate("jwt", { session: false }),
  controllers.updateRole,
);
router.post(
  "/posts/:id/comments",
  passport.authenticate("jwt", { session: false }),
  idParamValidator,
  commentValidator,
  controllers.createComment,
);
router.patch(
  "/posts/:id",
  passport.authenticate("jwt", { session: false }),
  idParamValidator,
  controllers.updatePost,
);
router.delete(
  "/posts/:id",
  passport.authenticate("jwt", { session: false }),
  idParamValidator,
  controllers.deletePost,
);
router.delete(
  "/comments/:id",
  passport.authenticate("jwt", { session: false }),
  idParamValidator,
  controllers.deleteComment,
);

module.exports = router;
