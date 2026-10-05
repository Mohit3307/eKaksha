const express = require("express");

const router = express.Router();

const {
  createAssignment,
  getAssignmentsByCourse,
  getAssignment,
  deleteAssignment,
  uploadAssignmentAttachment,
} = require("../controllers/assignmentController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

router.post(
  "/",
  protect,
  authorizeRoles("teacher"),
  createAssignment
);

router.get(
  "/course/:courseId",
  protect,
  getAssignmentsByCourse
);

router.post(
  "/:id/attachments",
  protect,
  authorizeRoles("teacher"),
  upload.single("file"),
  uploadAssignmentAttachment
);

router.get(
  "/:id",
  protect,
  getAssignment
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("teacher"),
  deleteAssignment
);

module.exports = router;