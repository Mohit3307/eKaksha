const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies the JWT and attaches the logged-in user to req.user
const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  // Normal API requests:
  // Authorization: Bearer <token>
  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];
  }

  // Direct browser file requests:
  // /files/:fileId?token=<token>
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      message: "Not authorized, no token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        message: "User no longer exists",
      });
    }

    next();
  } catch (error) {
    console.error(error.message);

    return res.status(401).json({
      message: "Not authorized, token invalid or expired",
    });
  }
};

// Restricts access to specific roles, e.g. authorizeRoles("teacher")
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Requires role: ${roles.join(" or ")}`,
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorizeRoles,
};