const mongoose = require("mongoose");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Course = require("../models/Course");

const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { textResponse, attachments } = req.body;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ message: "Invalid assignment id" });
    }

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const course = await Course.findById(assignment.course);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const isStudent = course.students.some(
      (studentId) => studentId.toString() === req.user._id.toString()
    );

    if (!isStudent) {
      return res.status(403).json({ message: "You are not enrolled in this course" });
    }

    const existingSubmission = await Submission.findOne({
      assignment: assignment._id,
      student: req.user._id,
    });

    if (existingSubmission) {
      return res.status(409).json({ message: "Assignment already submitted" });
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
    return res.status(500).json({ message: "Failed to submit assignment" });
  }
};

const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user._id })
      .populate("assignment")
      .sort({ createdAt: -1 });

    return res.status(200).json(submissions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch submissions" });
  }
};

const getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ message: "Invalid assignment id" });
    }

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (assignment.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const submissions = await Submission.find({ assignment: assignment._id })
      .populate("student", "name email")
      .sort({ createdAt: 1 });

    return res.status(200).json(submissions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch submissions" });
  }
};

const gradeSubmission = async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const { submissionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({ message: "Invalid submission id" });
    }

    if (grade === undefined || grade === null || Number.isNaN(Number(grade))) {
      return res.status(400).json({ message: "Grade is required" });
    }

    const submission = await Submission.findById(submissionId).populate("assignment");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (submission.assignment.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const numericGrade = Number(grade);

    if (numericGrade < 0 || numericGrade > submission.assignment.totalMarks) {
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
    return res.status(500).json({ message: "Failed to grade submission" });
  }
};

module.exports = {
  submitAssignment,
  getMySubmissions,
  getAssignmentSubmissions,
  gradeSubmission,
};
