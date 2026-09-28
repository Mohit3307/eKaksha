const mongoose = require("mongoose");
const Course = require("../models/Course");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");

const getCourseProgress = async (req, res) => {
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

    const assignments = await Assignment.find({ course: courseId }).sort({ dueDate: 1 });

    if (isTeacher) {
      const submissions = await Submission.find({
        assignment: { $in: assignments.map((assignment) => assignment._id) },
      }).populate("student", "name email");

      return res.status(200).json({
        courseId,
        totalAssignments: assignments.length,
        submissions,
      });
    }

    const submissions = await Submission.find({
      assignment: { $in: assignments.map((assignment) => assignment._id) },
      student: req.user._id,
    });

    const submissionMap = new Map(
      submissions.map((submission) => [submission.assignment.toString(), submission])
    );

    let submittedCount = 0;
    let gradedCount = 0;
    let marksObtained = 0;
    let totalGradedMarks = 0;

    const assignmentProgress = assignments.map((assignment) => {
      const submission = submissionMap.get(assignment._id.toString());

      if (submission) {
        submittedCount += 1;
      }

      if (submission && submission.grade !== null) {
        gradedCount += 1;
        marksObtained += submission.grade;
        totalGradedMarks += assignment.totalMarks;
      }

      return {
        assignmentId: assignment._id,
        title: assignment.title,
        totalMarks: assignment.totalMarks,
        dueDate: assignment.dueDate,
        submitted: Boolean(submission),
        isLate: submission ? submission.isLate : false,
        grade: submission ? submission.grade : null,
        feedback: submission ? submission.feedback : "",
        gradedAt: submission ? submission.gradedAt : null,
      };
    });

    const totalAssignments = assignments.length;
    const submissionPercentage = totalAssignments
      ? Math.round((submittedCount / totalAssignments) * 100)
      : 0;
    const gradePercentage = totalGradedMarks
      ? Math.round((marksObtained / totalGradedMarks) * 100)
      : 0;

    return res.status(200).json({
      courseId,
      totalAssignments,
      submittedCount,
      gradedCount,
      submissionPercentage,
      marksObtained,
      totalGradedMarks,
      gradePercentage,
      assignmentProgress,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to calculate course progress" });
  }
};

module.exports = { getCourseProgress };
