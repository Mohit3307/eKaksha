const express = require("express");

const router = express.Router();

const {
  uploadFile,
  downloadFile,
  deleteFile,
} = require("../controllers/fileController");

const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post(
  "/upload",
  protect,
  upload.single("file"),
  uploadFile
);

router.get(
  "/:fileId",
  protect,
  downloadFile
);

router.delete(
  "/:fileId",
  protect,
  deleteFile
);

module.exports = router;