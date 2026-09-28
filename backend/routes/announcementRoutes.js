const express = require("express");
const router = express.Router();

const {
  createAnnouncement,
  getAnnouncementsByCourse,
  deleteAnnouncement,
} = require("../controllers/announcementController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

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

router.delete(
  "/:id",
  protect,
  authorizeRoles("teacher"),
  deleteAnnouncement
);

module.exports = router;
