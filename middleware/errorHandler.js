function errorHandler(err, req, res, next) {
  console.error("❌ Error:", err.stack || err.message || err);

  // Handle Prisma-specific request errors
  if (err.code && err.code.startsWith("P20")) {
    return res.status(400).json({
      error: "DatabaseError",
      message: "A database constraint or query rule was violated.",
      code: err.code,
    });
  }

  // Handle generic system/runtime errors
  const statusCode = err.status || 500; // Default to 500 Internal Server Error if no status code is set

  return res.status(statusCode).json({
    error: err.name || "InternalServerError",
    message: err.message || "An unexpected error occurred.",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined, // Expose stack trace only in development
  });
}

module.exports = errorHandler;
