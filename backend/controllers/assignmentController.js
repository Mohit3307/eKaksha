const mongoose = require("mongoose");
const Assignment = require("../models/Assignment");
const Course = require("../models/Course");

const createAssignment = async (req, res) => {
  try {
    const { title, description, course, dueDate, totalMarks, attachments } = req.body;

    if (!title || !description || !course || !dueDate) {
      return res.status(400).json({
        message: "title, description, course and dueDate are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(course)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const numericTotalMarks =
      totalMarks === undefined ? 100 : Number(totalMarks);

    if (!Number.isFinite(numericTotalMarks) || numericTotalMarks <= 0) {
      return res.status(400).json({
        message: "totalMarks must be a positive number",
      });
    }

    const existingCourse = await Course.findById(course);

    if (!existingCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (existingCourse.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You do not own this course" });
    }

    const assignment = await Assignment.create({
      title,
      description,
      course,
      dueDate,
      totalMarks: numericTotalMarks,
      attachments: Array.isArray(attachments) ? attachments : [],
      createdBy: req.user._id,
    });

    return res.status(201).json(assignment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create assignment" });
  }
};

const getAssignmentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const isTeacher = course.teacher.toString() === req.user._id.toString();
    const isStudent = course.students.some(
      (studentId) => studentId.toString() === req.user._id.toString()
    );

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ message: "You are not a member of this course" });
    }

    const assignments = await Assignment.find({ course: courseId })
      .populate("createdBy", "name email")
      .sort({ dueDate: 1 });

    return res.status(200).json(assignments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch assignments" });
  }
};

const getAssignment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid assignment id" });
    }

    const assignment = await Assignment.findById(req.params.id)
      .populate("course")
      .populate("createdBy", "name email");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const course = assignment.course;
    const isTeacher = course.teacher.toString() === req.user._id.toString();
    const isStudent = course.students.some(
      (studentId) => studentId.toString() === req.user._id.toString()
    );

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ message: "You are not a member of this course" });
    }

    return res.status(200).json(assignment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch assignment" });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid assignment id" });
    }

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (assignment.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await assignment.deleteOne();

    return res.status(200).json({ message: "Assignment deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete assignment" });
  }
};

module.exports = {
  createAssignment,
  getAssignmentsByCourse,
  getAssignment,
  deleteAssignment,
};
