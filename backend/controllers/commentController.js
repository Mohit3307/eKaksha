const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Announcement = require("../models/Announcement");
const Course = require("../models/Course");

const userCanAccessCourse = (course, userId) => {
  if (course.teacher.toString() === userId.toString()) return true;

  return course.students.some(
    (studentId) => studentId.toString() === userId.toString()
  );
};

const addComment = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const { text } = req.body;

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(announcementId)) {
      return res.status(400).json({ message: "Invalid announcement id" });
    }

    const announcement = await Announcement.findById(announcementId);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    const course = await Course.findById(announcement.course);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!userCanAccessCourse(course, req.user._id)) {
      return res.status(403).json({ message: "You are not a member of this course" });
    }

    const comment = await Comment.create({
      announcement: announcementId,
      author: req.user._id,
      text,
    });

    await comment.populate("author", "name email");

    return res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to add comment" });
  }
};

const getComments = async (req, res) => {
  try {
    const { announcementId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(announcementId)) {
      return res.status(400).json({ message: "Invalid announcement id" });
    }

    const announcement = await Announcement.findById(announcementId);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    const course = await Course.findById(announcement.course);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!userCanAccessCourse(course, req.user._id)) {
      return res.status(403).json({ message: "You are not a member of this course" });
    }

    const comments = await Comment.find({ announcement: announcementId })
      .populate("author", "name email")
      .sort({ createdAt: 1 });

    return res.status(200).json(comments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch comments" });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid comment id" });
    }

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const announcement = await Announcement.findById(comment.announcement);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    const course = await Course.findById(announcement.course);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const isCommentAuthor = comment.author.toString() === req.user._id.toString();
    const isCourseTeacher = course.teacher.toString() === req.user._id.toString();

    if (!isCommentAuthor && !isCourseTeacher) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await comment.deleteOne();

    return res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete comment" });
  }
};

module.exports = {
  addComment,
  getComments,
  deleteComment,
};
