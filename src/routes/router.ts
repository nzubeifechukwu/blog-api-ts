import { Router } from "express";
import passport from "passport";

import {
  home,
  createUser,
  loginUser,
  createPost,
  updateRole,
  getPublishedPosts,
  getPostById,
  createComment,
  updatePost,
  deletePost,
  deleteComment,
} from "../controllers/controllers.js";
import { requireAuthor, optionalAuth } from "../middleware/auth.js";
import {
  idParamValidator,
  signUpValidator,
  postValidator,
  commentValidator,
} from "../middleware/validators.js";

const router = Router();

// Public routes
router.get("/", home);
router.get("/posts", getPublishedPosts);
router.get(
  "/posts/:id",
  optionalAuth, // allows authors to see their unpublished drafts
  idParamValidator,
  getPostById,
);

// Authentication & Registration
router.post("/users", signUpValidator, createUser);
router.post("/login", loginUser);

// Protected routes
router.post(
  "/posts",
  passport.authenticate("jwt", { session: false }), // Authenticate the user (Verify token & set req.user)
  requireAuthor, // Check if the user has the AUTHOR role
  postValidator,
  createPost,
);
router.patch(
  "/users/role",
  passport.authenticate("jwt", { session: false }),
  updateRole,
);
router.post(
  "/posts/:id/comments",
  passport.authenticate("jwt", { session: false }),
  idParamValidator,
  commentValidator,
  createComment,
);
router.patch(
  "/posts/:id",
  passport.authenticate("jwt", { session: false }),
  idParamValidator,
  updatePost,
);
router.delete(
  "/posts/:id",
  passport.authenticate("jwt", { session: false }),
  idParamValidator,
  deletePost,
);
router.delete(
  "/comments/:id",
  passport.authenticate("jwt", { session: false }),
  idParamValidator,
  deleteComment,
);

export default router;
