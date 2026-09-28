const express = require("express");
const router = express.Router();

const {
  createAssignment,
  getAssignmentsByCourse,
  getAssignment,
  deleteAssignment,
} = require("../controllers/assignmentController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createAssignment);

router.get("/course/:courseId", protect, getAssignmentsByCourse);

router.get("/:id", protect, getAssignment);

router.delete("/:id", protect, deleteAssignment);

module.exports = router;