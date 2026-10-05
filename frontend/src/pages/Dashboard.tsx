import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CourseCard from "../components/CourseCard";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";

import {
  getAnnouncementsByCourse,
  getAssignmentsByCourse,
  getCourseProgress,
  getMyCourses,
} from "../services/api";

import type { Announcement } from "../types/announcement";
import type { Course } from "../types/course";
import type { Assignment } from "../types/assignment";

interface DashboardAssignment extends Assignment {
  courseName: string;
  courseId: string;
  submitted?: boolean;
}

interface DashboardAnnouncement extends Announcement {
  courseName: string;
}

interface StudentProgress {
  courseId: string;
  courseName: string;
  totalAssignments: number;
  submittedCount: number;
  gradedCount: number;
  gradePercentage: number;
}

interface TeacherProgress {
  courseId: string;
  courseName: string;
  pendingSubmissions: number;
}

function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";

  const [courses, setCourses] = useState<Course[]>([]);

  const [upcomingAssignments, setUpcomingAssignments] = useState<
    DashboardAssignment[]
  >([]);

  const [recentAnnouncements, setRecentAnnouncements] = useState<
    DashboardAnnouncement[]
  >([]);

  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);

  const [teacherProgress, setTeacherProgress] = useState<TeacherProgress[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const courseData = await getMyCourses();

        setCourses(courseData);

        if (courseData.length === 0) {
          return;
        }

        /*
         * Load dashboard information from the existing
         * course/assignment/progress/announcement APIs.
         */
        const dashboardData = await Promise.all(
          courseData.map(async (course) => {
            const [assignments, announcements, progress] = await Promise.all([
              getAssignmentsByCourse(course._id).catch(() => []),
              getAnnouncementsByCourse(course._id).catch(() => []),
              getCourseProgress(course._id).catch(() => null),
            ]);

            return {
              course,
              assignments,
              announcements,
              progress,
            };
          }),
        );

        /*
         * UPCOMING ASSIGNMENTS
         */
        const assignmentList: DashboardAssignment[] = [];

        dashboardData.forEach(({ course, assignments, progress }) => {
          const submittedAssignmentIds = new Set<string>();

          if (isStudent && progress?.assignmentProgress) {
            progress.assignmentProgress.forEach(
              (item: { assignmentId: string; submitted: boolean }) => {
                if (item.submitted) {
                  submittedAssignmentIds.add(String(item.assignmentId));
                }
              },
            );
          }

          assignments.forEach((assignment) => {
            const dueDate = new Date(assignment.dueDate);

            if (
              dueDate.getTime() >= Date.now() &&
              !(isStudent && submittedAssignmentIds.has(String(assignment._id)))
            ) {
              assignmentList.push({
                ...assignment,
                courseName: course.title,
                courseId: course._id,
                submitted: submittedAssignmentIds.has(String(assignment._id)),
              });
            }
          });
        });

        assignmentList.sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        );

        setUpcomingAssignments(assignmentList.slice(0, 5));

        /*
         * RECENT ANNOUNCEMENTS
         */
        const announcementList: DashboardAnnouncement[] = [];

        dashboardData.forEach(({ course, announcements }) => {
          announcements.forEach((announcement) => {
            announcementList.push({
              ...announcement,
              courseName: course.title,
            });
          });
        });

        announcementList.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setRecentAnnouncements(announcementList.slice(0, 5));

        /*
         * STUDENT PROGRESS
         */
        if (isStudent) {
          const progressList: StudentProgress[] = [];

          dashboardData.forEach(({ course, progress }) => {
            if (!progress) {
              return;
            }

            progressList.push({
              courseId: course._id,
              courseName: course.title,
              totalAssignments: progress.totalAssignments || 0,
              submittedCount: progress.submittedCount || 0,
              gradedCount: progress.gradedCount || 0,
              gradePercentage: progress.gradePercentage || 0,
            });
          });

          setStudentProgress(progressList);
        }

        /*
         * TEACHER PENDING SUBMISSIONS
         */
        if (isTeacher) {
          const progressList: TeacherProgress[] = [];

          dashboardData.forEach(({ course, progress }) => {
            if (!progress) {
              return;
            }

            const submissions = progress.submissions || [];

            const pendingSubmissions = submissions.filter(
              (submission: { grade?: number | null }) =>
                submission.grade === null || submission.grade === undefined,
            ).length;

            progressList.push({
              courseId: course._id,
              courseName: course.title,
              pendingSubmissions,
            });
          });

          setTeacherProgress(progressList);
        }
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Unable to load your dashboard.";

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [isStudent, isTeacher]);

  const activeCourses = courses.filter((course) => course.status === "active");

  const archivedCourses = courses.filter(
    (course) => course.status === "archived",
  );

  const totalPendingSubmissions = teacherProgress.reduce(
    (total, course) => total + course.pendingSubmissions,
    0,
  );

  const coursesWithGrades = studentProgress.filter(
    (course) => course.gradedCount > 0,
  );

  const averageGrade =
    coursesWithGrades.length > 0
      ? Math.round(
          coursesWithGrades.reduce(
            (total, course) => total + course.gradePercentage,
            0,
          ) / coursesWithGrades.length,
        )
      : 0;

  const totalStudentAssignments = studentProgress.reduce(
    (total, course) => total + course.totalAssignments,
    0,
  );

  const totalStudentSubmitted = studentProgress.reduce(
    (total, course) => total + course.submittedCount,
    0,
  );

  return (
    <div className="dashboard-page">
      {/* HEADER */}
      <section className="dashboard-header">
        <div>
          <p className="page-eyebrow">Dashboard</p>

          <h1>Welcome back, {user?.name || "User"} 👋</h1>

          <p className="dashboard-subtitle">
            {isTeacher
              ? "Here's an overview of your classes and student activity."
              : "Here's what's happening with your learning today."}
          </p>
        </div>

        <div className="dashboard-header-actions">
          {isTeacher ? (
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate("/courses/create")}
            >
              + Create Course
            </button>
          ) : (
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate("/courses/join")}
            >
              + Join Course
            </button>
          )}
        </div>
      </section>

      {/* STATS */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📚</div>

          <div>
            <span>Total Courses</span>
            <strong>{courses.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>

          <div>
            <span>Active Courses</span>
            <strong>{activeCourses.length}</strong>
          </div>
        </div>

        {isStudent ? (
          <>
            <div className="stat-card">
              <div className="stat-icon">📝</div>

              <div>
                <span>Assignments Submitted</span>
                <strong>
                  {totalStudentSubmitted}/{totalStudentAssignments}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📈</div>

              <div>
                <span>Average Grade</span>
                <strong>
                  {coursesWithGrades.length > 0 ? `${averageGrade}%` : "—"}
                </strong>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-icon">📦</div>

              <div>
                <span>Archived</span>
                <strong>{archivedCourses.length}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⏳</div>

              <div>
                <span>Pending Reviews</span>
                <strong>{totalPendingSubmissions}</strong>
              </div>
            </div>
          </>
        )}
      </section>

      {/* COURSES */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>My Courses</h2>

            <p>
              {isTeacher
                ? "Courses you are teaching."
                : "Courses you are enrolled in."}
            </p>
          </div>

          {courses.length > 0 && (
            <button
              type="button"
              className="text-button"
              onClick={() => navigate("/courses")}
            >
              View all →
            </button>
          )}
        </div>

        {loading && <Loading />}

        {!loading && error && (
          <div className="error-box">
            <strong>Unable to load dashboard</strong>

            <p>{error}</p>

            <button
              type="button"
              className="secondary-button"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <EmptyState
            title="No courses yet"
            message={
              isTeacher
                ? "Create your first course to get started."
                : "Join a course using the course join code."
            }
            action={
              isTeacher ? (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => navigate("/courses/create")}
                >
                  Create Course
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => navigate("/courses/join")}
                >
                  Join Course
                </button>
              )
            }
          />
        )}

        {!loading && !error && courses.length > 0 && (
          <div className="course-grid">
            {courses.slice(0, 6).map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* DASHBOARD ACTIVITY */}
      {!loading && !error && courses.length > 0 && (
        <div className="dashboard-activity-grid">
          {/* UPCOMING ASSIGNMENTS */}
          <section className="dashboard-section dashboard-panel">
            <div className="section-heading">
              <div>
                <h2>Upcoming Assignments</h2>

                <p>
                  {isTeacher
                    ? "Assignments with upcoming deadlines."
                    : "Assignments you still need to complete."}
                </p>
              </div>
            </div>

            {upcomingAssignments.length === 0 ? (
              <div className="dashboard-empty-state">
                <span>🎉</span>
                <p>
                  {isTeacher
                    ? "No upcoming assignments."
                    : "You're all caught up!"}
                </p>
              </div>
            ) : (
              <div className="dashboard-list">
                {upcomingAssignments.map((assignment) => (
                  <div
                    className="dashboard-list-item"
                    key={`${assignment.courseId}-${assignment._id}`}
                  >
                    <div className="dashboard-list-main">
                      <strong>{assignment.title}</strong>

                      <span>{assignment.courseName}</span>
                    </div>

                    <div className="dashboard-list-meta">
                      <small>
                        Due {new Date(assignment.dueDate).toLocaleDateString()}
                      </small>

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          navigate(`/assignments/${assignment._id}`)
                        }
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* RECENT ANNOUNCEMENTS */}
          <section className="dashboard-section dashboard-panel">
            <div className="section-heading">
              <div>
                <h2>Recent Announcements</h2>

                <p>Latest updates from your courses.</p>
              </div>
            </div>

            {recentAnnouncements.length === 0 ? (
              <div className="dashboard-empty-state">
                <span>📢</span>

                <p>No announcements yet.</p>
              </div>
            ) : (
              <div className="dashboard-list">
                {recentAnnouncements.map((announcement) => (
                  <div
                    className="dashboard-list-item announcement-dashboard-item"
                    key={announcement._id}
                  >
                    <div className="dashboard-list-main">
                      <strong>{announcement.courseName}</strong>

                      <span>{announcement.content}</span>

                      <small>
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </small>
                    </div>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        navigate(
                          `/courses/${announcement.course}/announcements`,
                        )
                      }
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* STUDENT PROGRESS */}
      {!loading && !error && isStudent && studentProgress.length > 0 && (
        <section className="dashboard-section dashboard-panel">
          <div className="section-heading">
            <div>
              <h2>My Progress</h2>

              <p>Track your assignment progress and grades across courses.</p>
            </div>
          </div>

          <div className="dashboard-progress-list">
            {studentProgress.map((progress) => (
              <div className="dashboard-progress-item" key={progress.courseId}>
                <div className="dashboard-progress-header">
                  <strong>{progress.courseName}</strong>

                  <span>
                    {progress.gradedCount > 0
                      ? `${progress.gradePercentage}%`
                      : "Not graded yet"}
                  </span>
                </div>

                <div className="dashboard-progress-bar">
                  <div
                    style={{
                      width: `${Math.min(progress.gradePercentage, 100)}%`,
                    }}
                  />
                </div>

                <div className="dashboard-progress-footer">
                  <span>
                    {progress.submittedCount}/{progress.totalAssignments}{" "}
                    assignments submitted
                  </span>

                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      navigate(`/courses/${progress.courseId}/progress`)
                    }
                  >
                    View Progress →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TEACHER PENDING SUBMISSIONS */}
      {!loading && !error && isTeacher && teacherProgress.length > 0 && (
        <section className="dashboard-section dashboard-panel">
          <div className="section-heading">
            <div>
              <h2>Pending Submissions</h2>

              <p>Student submissions waiting for grading.</p>
            </div>

            <span className="dashboard-count-badge">
              {totalPendingSubmissions}
            </span>
          </div>

          <div className="dashboard-progress-list">
            {teacherProgress.map((progress) => (
              <div className="dashboard-progress-item" key={progress.courseId}>
                <div className="dashboard-progress-header">
                  <strong>{progress.courseName}</strong>

                  <span>{progress.pendingSubmissions} pending</span>
                </div>

                <div className="dashboard-progress-footer">
                  <span>Review student submissions</span>

                  <button
                    type="button"
                    className="text-button"
                    onClick={() => navigate(`/courses/${progress.courseId}`)}
                  >
                    Open Course →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Dashboard;
