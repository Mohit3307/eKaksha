const express = require("express");
const router = express.Router();

const {
  submitAssignment,
  getMySubmissions,
  getAssignmentSubmissions,
  gradeSubmission,
} = require("../controllers/submissionController");

const { protect } = require("../middleware/authMiddleware");

router.post(
  "/assignment/:assignmentId",
  protect,
  submitAssignment
);

router.get(
  "/mine",
  protect,
  getMySubmissions
);

router.get(
  "/assignment/:assignmentId",
  protect,
  getAssignmentSubmissions
);

router.patch(
  "/:submissionId/grade",
  protect,
  gradeSubmission
);

module.exports = router;