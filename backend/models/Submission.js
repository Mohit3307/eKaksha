const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      default: "",
    },

    fileUrl: {
      type: String,
      default: null,
    },

    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    feedback: {
      type: String,
      default: "",
    },

    graded: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Submission", submissionSchema);
