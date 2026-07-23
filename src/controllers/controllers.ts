import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";

import prisma from "../lib/prisma.js";

function home(req: Request, res: Response) {
  return res.status(200).json({
    message: "Welcome to Nzube's Blog API",
    docs: "Please refer to the README.md file at https://github.com/nzubeifechukwu/blog-api-ts for how to set up your environment and test the API endpoints.",
    endpoints: { user: "/users", posts: "/posts", comments: "/comments" },
  });
}

async function createUser(req: Request, res: Response, next: NextFunction) {
  const { email, name, password, role } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || Role.READER, // defaults to READER if not provided
      },
    });

    // Don't send the password back in the response
    const { password: _, ...user } = newUser;

    return res
      .status(201)
      .json({ message: "User registered successfully.", user });
  } catch (error) {
    next(error); // Pass to error handler
  }
}

async function loginUser(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      `${process.env.SECRET}`,
      { expiresIn: "1h" },
    );

    // Don't send the password in the response
    const { password: _, ...loggedInUser } = user;
    return res
      .status(200)
      .json({ message: "Login successful.", token, user: loggedInUser });
  } catch (error) {
    next(error);
  }
}

async function createPost(req, res, next) {
  const { title, content, published } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required." });
  }

  try {
    const newPost = await prisma.post.create({
      data: {
        title,
        content,
        published: published === true || published === "true",
        authorId: req.user.id,
      },
    });

    return res
      .status(201)
      .json({ message: "Post created successfully.", post: newPost });
  } catch (error) {
    next(error);
  }
}

async function updateRole(req, res, next) {
  const { role } = req.body;

  const validRoles = ["READER", "AUTHOR"];
  if (!role || !validRoles.includes(role.toUpperCase())) {
    return res
      .status(400)
      .json({ message: "Invalid role. Choose either 'READER' or 'AUTHOR'." });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id }, // req.user.id is available because this route will be protected by JWT
      data: { role: role.toUpperCase() },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return res.status(200).json({
      message: `Role successfully updated to ${updatedUser.role}.`,
      user: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
}

async function getPublishedPosts(req, res, next) {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" }, // Show newest posts first
    });

    return res.status(200).json({ count: posts.length, posts: posts });
  } catch (error) {
    next(error);
  }
}

async function getPostById(req, res, next) {
  const { id } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
      include: {
        author: { select: { id: true, name: true, role: true } },
        comments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Article not found." });
    }

    // Only author can see an unpublished post
    if (!post.published) {
      // If user isn't logged in, or logged-in user isn't the author
      if (!req.user || req.user.id !== post.authorId) {
        return res.status(403).json({
          message: "Cannot read an unpublished draft.",
        });
      }
    }

    return res.status(200).json({ post });
  } catch (error) {
    next(error);
  }
}

async function createComment(req, res, next) {
  const { content } = req.body;
  const { id: postId } = req.params; // Rename "id" to "postId"

  if (!content || content.trim() === "") {
    return res.status(400).json({ message: "Comment cannot be empty." });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) },
    });
    if (!post) {
      return res.status(404).json({ message: "Article doesn't exist." });
    }
    if (!post.published && post.authorId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Cannot comment on an unpublished draft." });
    }

    const newComment = await prisma.comment.create({
      data: { content, postId: parseInt(postId), authorId: req.user.id },
    });

    return res
      .status(201)
      .json({ message: "Comment added successfully.", comment: newComment });
  } catch (error) {
    next(error);
  }
}

async function updatePost(req, res, next) {
  const { id } = req.params;
  const { title, content, published } = req.body;

  try {
    const post = await prisma.post.findUnique({ where: { id: parseInt(id) } });

    if (!post) {
      return res.status(404).json({ message: "Article not found." });
    }

    if (post.authorId !== req.user.id) {
      return res.status(403).json({
        message: "Forbidden! You are not authorized to edit this article.",
      });
    }

    const updateData = {};
    if (title !== undefined) {
      updateData.title = title;
    }
    if (content !== undefined) {
      updateData.content = content;
    }
    if (published !== undefined) {
      updateData.published = published === true || published === "true"; // Save as a Boolean true/false
    }

    const updatedPost = await prisma.post.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return res.status(200).json({
      message: "Post updated successfully.",
      post: updatedPost,
    });
  } catch (error) {
    next(error);
  }
}

async function deletePost(req, res, next) {
  const { id } = req.params;

  try {
    const post = await prisma.post.findUnique({ where: { id: parseInt(id) } });

    if (!post) {
      return res.status(404).json({ message: "Article not found." });
    }

    if (post.authorId !== req.user.id) {
      return res.status(403).json({
        message: "Forbidden! You are not authorized to delete this article.",
      });
    }

    await prisma.post.delete({
      where: { id: parseInt(id) },
      include: { comments: true },
    });

    return res.status(200).json({ message: "Post deleted successfully." });
  } catch (error) {
    next(error);
  }
}

async function deleteComment(req, res, next) {
  const { id } = req.params;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(id) },
      include: { post: { select: { authorId: true } } },
    });
    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    if (
      comment.authorId === req.user.id ||
      comment.post.authorId === req.user.id
    ) {
      await prisma.comment.delete({ where: { id: parseInt(id) } });
      return res.status(200).json({ message: "Comment deleted successfully." });
    } else {
      return res.status(403).json({
        message: "Forbidden! You are not authorized to delete this comment.",
      });
    }
  } catch (error) {
    next(error);
  }
}

export {
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
};
