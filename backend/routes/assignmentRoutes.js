const express = require("express");
const router = express.Router();

const {
  createAssignment,
  getAssignmentsByCourse,
  getAssignment,
  deleteAssignment,
} = require("../controllers/assignmentController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.post("/", protect, authorizeRoles("teacher"), createAssignment);
router.get("/course/:courseId", protect, getAssignmentsByCourse);
router.get("/:id", protect, getAssignment);
router.delete("/:id", protect, authorizeRoles("teacher"), deleteAssignment);

module.exports = router;
