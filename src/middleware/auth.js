import passport from "passport";

// Strict role authorization guard (for author-only actions like POST /posts)
function requireAuthor(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }

  if (req.user.role !== "AUTHOR") {
    return res.status(403).json({
      message: "Forbidden. You must be an author to perform this action.",
    });
  }

  next();
}

// Optional authentication guard (for public routes that adapt when logged in, e.g. GET /posts/:id)
function optionalAuth(req, res, next) {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (user) {
      req.user = user; // Attach user if token is valid
    }

    next();
  })(req, res, next);
}

export { requireAuthor, optionalAuth };
