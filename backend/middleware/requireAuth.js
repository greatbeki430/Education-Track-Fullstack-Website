import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  // Try to get token from cookie first (new way)
  let token = req.cookies?.access_token;

  // Fallback to Authorization header (for backward compatibility)
  const authHeader = req.headers.authorization;
  if (!token && authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
