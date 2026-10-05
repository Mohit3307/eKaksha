const mongoose = require("mongoose");
const getGridFSBucket = require("../config/gridfs");
const Course = require("../models/Course");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Announcement = require("../models/Announcement");

const canAccessCourse = (course, user) => {
  if (course.teacher.toString() === user._id.toString()) {
    return true;
  }

  return course.students.some(
    (studentId) => studentId.toString() === user._id.toString()
  );
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const { courseId, assignmentId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        message: "courseId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        message: "Invalid course id",
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    // User must belong to the course.
    if (!canAccessCourse(course, req.user)) {
      return res.status(403).json({
        message: "You are not a member of this course",
      });
    }

    // If an assignment ID was provided, verify it belongs to this course.
    if (assignmentId) {
      if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
        return res.status(400).json({
          message: "Invalid assignment id",
        });
      }

      const assignment = await Assignment.findById(assignmentId);

      if (!assignment) {
        return res.status(404).json({
          message: "Assignment not found",
        });
      }

      if (assignment.course.toString() !== courseId) {
        return res.status(400).json({
          message: "Assignment does not belong to this course",
        });
      }
    }

    const bucket = getGridFSBucket();

    const fileId = new mongoose.Types.ObjectId();

    const uploadStream = bucket.openUploadStreamWithId(
      fileId,
      req.file.originalname,
      {
        contentType: req.file.mimetype,
        metadata: {
          uploadedBy: req.user._id.toString(),
          courseId,
          assignmentId: assignmentId || null,
        },
      }
    );

    uploadStream.end(req.file.buffer);

    uploadStream.on("finish", () => {
      return res.status(201).json({
        message: "File uploaded successfully",
        fileId: fileId.toString(),
        fileName: req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size,
      });
    });

    uploadStream.on("error", (error) => {
      console.error("GridFS upload error:", error);

      if (!res.headersSent) {
        return res.status(500).json({
          message: "Failed to upload file",
        });
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to upload file",
    });
  }
};

const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        message: "Invalid file id",
      });
    }

    const bucket = getGridFSBucket();
    const objectId = new mongoose.Types.ObjectId(fileId);

    const files = await bucket.find({ _id: objectId }).toArray();

    if (!files.length) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    const file = files[0];

    const courseId = file.metadata?.courseId;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(403).json({
        message: "File access information is missing",
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    if (!canAccessCourse(course, req.user)) {
      return res.status(403).json({
        message: "You are not allowed to access this file",
      });
    }

    res.setHeader(
      "Content-Type",
      file.contentType || "application/octet-stream"
    );

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(file.filename)}"`
    );

    const downloadStream = bucket.openDownloadStream(objectId);

    downloadStream.on("error", (error) => {
      console.error("GridFS download error:", error);

      if (!res.headersSent) {
        return res.status(500).json({
          message: "Failed to download file",
        });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to download file",
    });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        message: "Invalid file id",
      });
    }

    const bucket = getGridFSBucket();
    const objectId = new mongoose.Types.ObjectId(fileId);

    const files = await bucket.find({ _id: objectId }).toArray();

    if (!files.length) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    const file = files[0];

    const uploadedBy = file.metadata?.uploadedBy;

    if (!uploadedBy) {
      return res.status(403).json({
        message: "File ownership information is missing",
      });
    }

    // Only the person who uploaded the file can delete it.
    if (uploadedBy !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only delete files you uploaded",
      });
    }

    await bucket.delete(objectId);

    return res.status(200).json({
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to delete file",
    });
  }
};

module.exports = {
  uploadFile,
  downloadFile,
  deleteFile,
};