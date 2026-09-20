const Course = require("../models/Course");

const POPULATE_FIELDS = "name email";

// Generates a random 6-character alphanumeric code, e.g. "A3F9K2"
const generateJoinCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// @route  POST /api/courses
// @access Private (teacher only)
const createCourse = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Course title is required" });
    }

    let joinCode;
    let codeExists = true;
    while (codeExists) {
      joinCode = generateJoinCode();
      codeExists = await Course.findOne({ joinCode });
    }

    const course = await Course.create({
      title,
      description,
      category,
      teacher: req.user._id,
      joinCode,
    });

    return res.status(201).json(course);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error while creating course" });
  }
};

// @route  POST /api/courses/join
// @access Private (student only)
const joinCourse = async (req, res) => {
  try {
    const { joinCode } = req.body;

    if (!joinCode) {
      return res.status(400).json({ message: "Join code is required" });
    }

    const course = await Course.findOne({ joinCode });

    if (!course) {
      return res.status(404).json({ message: "Invalid join code" });
    }

    if (course.students.includes(req.user._id)) {
      return res.status(409).json({ message: "You are already enrolled in this course" });
    }

    course.students.push(req.user._id);
    await course.save();

    return res.status(200).json(course);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error while joining course" });
  }
};

// @route  GET /api/courses
// @access Private
const getMyCourses = async (req, res) => {
  try {
    let courses;

    if (req.user.role === "teacher") {
      courses = await Course.find({ teacher: req.user._id })
        .populate("teacher", POPULATE_FIELDS)
        .populate("students", POPULATE_FIELDS);
    } else {
      courses = await Course.find({ students: req.user._id })
        .populate("teacher", POPULATE_FIELDS)
        .populate("students", POPULATE_FIELDS);
    }

    return res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error while fetching courses" });
  }
};

// @route  GET /api/courses/:id
// @access Private
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("teacher", POPULATE_FIELDS)
      .populate("students", POPULATE_FIELDS);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.status(200).json(course);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error while fetching course" });
  }
};

// @route  PUT /api/courses/:id/roster
// @access Private (teacher only, must own the course)
const manageRoster = async (req, res) => {
  try {
    const { studentId, action } = req.body; // action: "add" or "remove"

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You do not own this course" });
    }

    if (action === "add") {
      if (!course.students.includes(studentId)) {
        course.students.push(studentId);
      }
    } else if (action === "remove") {
      course.students = course.students.filter(
        (id) => id.toString() !== studentId
      );
    } else {
      return res.status(400).json({ message: "Action must be 'add' or 'remove'" });
    }

    await course.save();
    await course.populate("teacher", POPULATE_FIELDS);
    await course.populate("students", POPULATE_FIELDS);

    return res.status(200).json(course);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error while updating roster" });
  }
};

// @route  PUT /api/courses/:id/archive
// @access Private (teacher only, must own the course)
const archiveCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You do not own this course" });
    }

    course.status = course.status === "active" ? "archived" : "active";
    await course.save();

    return res.status(200).json(course);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error while archiving course" });
  }
};

module.exports = {
  createCourse,
  joinCourse,
  getMyCourses,
  getCourseById,
  manageRoster,
  archiveCourse,
};