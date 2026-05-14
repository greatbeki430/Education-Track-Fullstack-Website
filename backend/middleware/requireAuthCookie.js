import jwt from "jsonwebtoken";

/**
 * Middleware to verify JWT token from httpOnly cookie OR Authorization header
 * Attaches decoded user info to req.user if valid
 */
export function requireAuthCookie(req, res, next) {
  // Try to get token from cookie first
  let token = req.cookies?.access_token;

  // If no cookie, try Authorization header (for backward compatibility)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  // No token found
  if (!token) {
    return res.status(401).json({
      error: "Not authenticated. Please login first.",
    });
  }

  try {
    // Verify token signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user data to request
    req.user = decoded;

    next();
  } catch (error) {
    // Token is invalid, expired, or tampered with
    return res.status(401).json({
      error: "Invalid or expired token. Please login again.",
    });
  }
}
