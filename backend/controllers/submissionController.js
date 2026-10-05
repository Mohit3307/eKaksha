const mongoose = require("mongoose");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Course = require("../models/Course");
const getGridFSBucket = require("../config/gridfs");

const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { textResponse, attachments } = req.body;

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

    const course = await Course.findById(assignment.course);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    const isStudent = course.students.some(
      (studentId) =>
        studentId.toString() === req.user._id.toString()
    );

    if (!isStudent) {
      return res.status(403).json({
        message: "You are not enrolled in this course",
      });
    }

    const existingSubmission = await Submission.findOne({
      assignment: assignment._id,
      student: req.user._id,
    });

    if (existingSubmission) {
      return res.status(409).json({
        message: "Assignment already submitted",
      });
    }

    const isLate = new Date() > new Date(assignment.dueDate);

    const submission = await Submission.create({
      assignment: assignment._id,
      student: req.user._id,
      textResponse: textResponse || "",
      attachments: Array.isArray(attachments) ? attachments : [],
      isLate,
      submittedAt: new Date(),
    });

    return res.status(201).json(submission);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to submit assignment",
    });
  }
};

const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({
      student: req.user._id,
    })
      .populate("assignment")
      .sort({ createdAt: -1 });

    return res.status(200).json(submissions);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch submissions",
    });
  }
};

const getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

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

    if (
      assignment.createdBy.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const submissions = await Submission.find({
      assignment: assignment._id,
    })
      .populate("student", "name email")
      .sort({ createdAt: 1 });

    return res.status(200).json(submissions);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch submissions",
    });
  }
};

const gradeSubmission = async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const { submissionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({
        message: "Invalid submission id",
      });
    }

    if (
      grade === undefined ||
      grade === null ||
      Number.isNaN(Number(grade))
    ) {
      return res.status(400).json({
        message: "Grade is required",
      });
    }

    const submission = await Submission.findById(
      submissionId
    ).populate("assignment");

    if (!submission) {
      return res.status(404).json({
        message: "Submission not found",
      });
    }

    if (
      submission.assignment.createdBy.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const numericGrade = Number(grade);

    if (
      numericGrade < 0 ||
      numericGrade > submission.assignment.totalMarks
    ) {
      return res.status(400).json({
        message: `Grade must be between 0 and ${submission.assignment.totalMarks}`,
      });
    }

    submission.grade = numericGrade;
    submission.feedback = feedback || "";
    submission.gradedAt = new Date();

    await submission.save();

    return res.status(200).json(submission);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to grade submission",
    });
  }
};

/*
 * Upload an attachment to an existing submission.
 *
 * Only the student who owns the submission can upload files.
 */
const uploadSubmissionAttachment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({
        message: "Invalid assignment id",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found",
      });
    }

    const course = await Course.findById(assignment.course);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    const isStudent = course.students.some(
      (studentId) =>
        studentId.toString() === req.user._id.toString()
    );

    if (!isStudent) {
      return res.status(403).json({
        message: "You are not enrolled in this course",
      });
    }

    const submission = await Submission.findOne({
      assignment: assignment._id,
      student: req.user._id,
    });

    if (!submission) {
      return res.status(404).json({
        message:
          "Submission not found. Submit the assignment first.",
      });
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
          courseId: course._id.toString(),
          assignmentId: assignment._id.toString(),
          submissionId: submission._id.toString(),
          resourceType: "submission",
        },
      }
    );

    uploadStream.end(req.file.buffer);

    uploadStream.on("finish", async () => {
      try {
        submission.attachments.push(fileId.toString());

        await submission.save();

        return res.status(201).json({
          message:
            "Submission attachment uploaded successfully",
          fileId: fileId.toString(),
          fileName: req.file.originalname,
          contentType: req.file.mimetype,
          size: req.file.size,
          assignmentId: assignment._id.toString(),
          submissionId: submission._id.toString(),
        });
      } catch (error) {
        console.error(
          "Failed to save submission attachment reference:",
          error
        );

        try {
          await bucket.delete(fileId);
        } catch (deleteError) {
          console.error(
            "Failed to clean up GridFS file:",
            deleteError
          );
        }

        return res.status(500).json({
          message:
            "File uploaded but failed to attach it to submission",
        });
      }
    });

    uploadStream.on("error", (error) => {
      console.error("GridFS upload error:", error);

      if (!res.headersSent) {
        return res.status(500).json({
          message:
            "Failed to upload submission attachment",
        });
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to upload submission attachment",
    });
  }
};

module.exports = {
  submitAssignment,
  getMySubmissions,
  getAssignmentSubmissions,
  gradeSubmission,
  uploadSubmissionAttachment,
};