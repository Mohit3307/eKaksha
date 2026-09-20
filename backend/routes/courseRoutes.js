const express = require("express");
const router = express.Router();
const {
  createCourse,
  joinCourse,
  getMyCourses,
  getCourseById,
  manageRoster,
  archiveCourse,
} = require("../controllers/courseController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.post("/", protect, authorizeRoles("teacher"), createCourse);
router.post("/join", protect, authorizeRoles("student"), joinCourse);
router.get("/", protect, getMyCourses);
router.get("/:id", protect, getCourseById);
router.put("/:id/roster", protect, authorizeRoles("teacher"), manageRoster);
router.put("/:id/archive", protect, authorizeRoles("teacher"), archiveCourse);

module.exports = router;