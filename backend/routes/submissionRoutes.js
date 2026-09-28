const express = require("express");
const router = express.Router();

const {
  submitAssignment,
  getMySubmissions,
  getAssignmentSubmissions,
  gradeSubmission,
} = require("../controllers/submissionController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.post(
  "/assignment/:assignmentId",
  protect,
  authorizeRoles("student"),
  submitAssignment
);

router.get(
  "/mine",
  protect,
  authorizeRoles("student"),
  getMySubmissions
);

router.get(
  "/assignment/:assignmentId",
  protect,
  authorizeRoles("teacher"),
  getAssignmentSubmissions
);

router.put(
  "/:submissionId/grade",
  protect,
  authorizeRoles("teacher"),
  gradeSubmission
);

// Keep PATCH working too so existing Postman requests do not break.
router.patch(
  "/:submissionId/grade",
  protect,
  authorizeRoles("teacher"),
  gradeSubmission
);

module.exports = router;
