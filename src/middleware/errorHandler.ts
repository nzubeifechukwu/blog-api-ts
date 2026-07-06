import { Request, Response, NextFunction } from "express";

interface AppError extends Error {
  status?: number;
  statusCode?: number;
  code?: string; // Captures Prisma code strings like "P2002"
}

function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
  const statusCode = err.status || err.statusCode || 500; // Default to 500 Internal Server Error if no status code is set

  return res.status(statusCode).json({
    error: err.name || "InternalServerError",
    message: err.message || "An unexpected error occurred.",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined, // Expose stack trace only in development
  });
}

export default errorHandler;
