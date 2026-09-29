import { useNavigate } from "react-router-dom";

import type { Course } from "../types/course";

interface CourseCardProps {
  course: Course;
}

function CourseCard({
  course,
}: CourseCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="course-card"
      onClick={() =>
        navigate(`/courses/${course._id}`)
      }
    >
      <div className="course-card-top">
        <div className="course-icon">
          📘
        </div>

        <span
          className={`course-status ${
            course.status === "active"
              ? "active"
              : "archived"
          }`}
        >
          {course.status === "active"
            ? "Active"
            : "Archived"}
        </span>
      </div>

      <h3>{course.title}</h3>

      <p className="course-description">
        {course.description ||
          "No course description available."}
      </p>

      {course.category && (
        <span className="course-category">
          {course.category}
        </span>
      )}

      <div className="course-card-footer">
        <span>
          👨‍🏫{" "}
          {course.teacher?.name ||
            "Teacher"}
        </span>

        <span className="course-arrow">
          →
        </span>
      </div>
    </div>
  );
}

export default CourseCard;