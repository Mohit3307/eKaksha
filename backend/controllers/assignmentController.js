const Assignment = require('../models/Assignment');
const Course = require('../models/Course');

exports.createAssignment = async (req, res) => {
  try {
    const { title, description, course, dueDate } = req.body;

    if (!title || !description || !course || !dueDate) {
      return res.status(400).json({
        message: 'title, description, course and dueDate are required'
      });
    }

    const existingCourse = await Course.findById(course);

    if (!existingCourse) {
      return res.status(404).json({
        message: 'Course not found'
      });
    }

    const assignment = await Assignment.create({
      title,
      description,
      course,
      dueDate,
      createdBy: req.user.id
    });

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create assignment',
      error: error.message
    });
  }
};
exports.getAssignmentsByCourse = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      course: req.params.courseId
    })
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1 });

    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch assignments',
      error: error.message
    });
  }
};

exports.getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('course')
      .populate('createdBy', 'name email');

    if (!assignment) {
      return res.status(404).json({
        message: 'Assignment not found'
      });
    }

    res.status(200).json(assignment);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch assignment',
      error: error.message
    });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        message: 'Assignment not found'
      });
    }

    if (assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized'
      });
    }

    await assignment.deleteOne();

    res.status(200).json({
      message: 'Assignment deleted'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete assignment',
      error: error.message
    });
  }
};