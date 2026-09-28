const express = require("express");
const router = express.Router();

const {
  addComment,
  getComments,
  deleteComment,
} = require("../controllers/commentController");

const { protect } = require("../middleware/authMiddleware");

router.post("/announcement/:announcementId", protect, addComment);
router.get("/announcement/:announcementId", protect, getComments);
router.delete("/:id", protect, deleteComment);

module.exports = router;
