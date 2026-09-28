const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');

exports.submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);

    if (!assignment) {
      return res.status(404).json({
        message: 'Assignment not found'
      });
    }

    // Prevent submissions after the deadline.
    if (new Date() > new Date(assignment.dueDate)) {
      return res.status(400).json({
        message: 'Assignment deadline has passed'
      });
    }

    // Prevent duplicate submission.
    const existingSubmission = await Submission.findOne({
      assignment: assignment._id,
      student: req.user.id
    });

    if (existingSubmission) {
      return res.status(409).json({
        message: 'Assignment already submitted'
      });
    }

    const submission = await Submission.create({
      assignment: assignment._id,
      student: req.user.id,
      content: req.body.content || ''
    });

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to submit assignment',
      error: error.message
    });
  }
};

exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({
      student: req.user.id
    })
      .populate('assignment')
      .sort({ createdAt: -1 });

    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch submissions',
      error: error.message
    });
  }
};

exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);

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

    const submissions = await Submission.find({
      assignment: assignment._id
    })
      .populate('student', 'name email')
      .sort({ createdAt: 1 });

    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch submissions',
      error: error.message
    });
  }
};


exports.gradeSubmission = async (req, res) => {
  try {
    const { score, feedback } = req.body;

    if (
      score === undefined ||
      Number(score) < 0 ||
      Number(score) > 100
    ) {
      return res.status(400).json({
        message: 'Score must be between 0 and 100'
      });
    }

    const submission = await Submission.findById(
      req.params.submissionId
    ).populate('assignment');

    if (!submission) {
      return res.status(404).json({
        message: 'Submission not found'
      });
    }

    if (
      submission.assignment.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: 'Not authorized'
      });
    }

    submission.score = Number(score);
    submission.feedback = feedback || '';
    submission.graded = true;

    await submission.save();

    res.status(200).json(submission);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to grade submission',
      error: error.message
    });
  }
};