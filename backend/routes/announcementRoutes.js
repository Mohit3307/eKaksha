const express = require("express");

const router = express.Router();

const {
  createAnnouncement,
  getAnnouncementsByCourse,
  deleteAnnouncement,
  uploadAnnouncementAttachment,
} = require("../controllers/announcementController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

router.post(
  "/course/:courseId",
  protect,
  authorizeRoles("teacher"),
  createAnnouncement
);

router.get(
  "/course/:courseId",
  protect,
  getAnnouncementsByCourse
);

router.post(
  "/:id/attachments",
  protect,
  authorizeRoles("teacher"),
  upload.single("file"),
  uploadAnnouncementAttachment
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("teacher"),
  deleteAnnouncement
);

module.exports = router;