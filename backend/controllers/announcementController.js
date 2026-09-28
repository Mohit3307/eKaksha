const mongoose = require("mongoose");
const Announcement = require("../models/Announcement");
const Course = require("../models/Course");

const createAnnouncement = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { content, attachments } = req.body;

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Announcement content is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the course teacher can create announcements" });
    }

    const announcement = await Announcement.create({
      course: courseId,
      author: req.user._id,
      content,
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    await announcement.populate("author", "name email");

    return res.status(201).json(announcement);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create announcement" });
  }
};

const getAnnouncementsByCourse = async (req, res) => {
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

    const announcements = await Announcement.find({ course: courseId })
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json(announcements);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch announcements" });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid announcement id" });
    }

    const announcement = await Announcement.findById(id).populate("course");

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    if (announcement.course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await announcement.deleteOne();

    return res.status(200).json({ message: "Announcement deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete announcement" });
  }
};

module.exports = {
  createAnnouncement,
  getAnnouncementsByCourse,
  deleteAnnouncement,
};
