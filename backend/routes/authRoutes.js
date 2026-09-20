const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
} = require("../controllers/authController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Private routes (require valid JWT via `protect`)
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// Example of a role-restricted route (teacher-only)
router.get("/teacher-only", protect, authorizeRoles("teacher"), (req, res) => {
  res.json({ message: `Welcome teacher ${req.user.name}` });
});

module.exports = router;
