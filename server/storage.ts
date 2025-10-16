import type {
  User,
  InsertUser,
  Course,
  InsertCourse,
  Enrollment,
  InsertEnrollment,
  Assignment,
  InsertAssignment,
  Submission,
  InsertSubmission,
  Grade,
  InsertGrade,
  CourseWithTeacher,
  EnrollmentWithCourse,
  AssignmentWithCourse,
  SubmissionWithDetails,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Course methods
  getCourse(id: string): Promise<Course | undefined>;
  getCourseWithTeacher(id: string): Promise<CourseWithTeacher | undefined>;
  getAllCourses(): Promise<CourseWithTeacher[]>;
  getCoursesByTeacher(teacherId: string): Promise<CourseWithTeacher[]>;
  createCourse(course: InsertCourse): Promise<Course>;

  // Enrollment methods
  getEnrollment(id: string): Promise<Enrollment | undefined>;
  getEnrollmentsByCourse(courseId: string): Promise<Enrollment[]>;
  getEnrollmentsByStudent(studentId: string): Promise<EnrollmentWithCourse[]>;
  getStudentsByCourse(courseId: string): Promise<User[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  isStudentEnrolled(studentId: string, courseId: string): Promise<boolean>;

  // Assignment methods
  getAssignment(id: string): Promise<Assignment | undefined>;
  getAssignmentWithCourse(id: string): Promise<AssignmentWithCourse | undefined>;
  getAssignmentsByCourse(courseId: string): Promise<Assignment[]>;
  getAssignmentsByStudent(studentId: string): Promise<AssignmentWithCourse[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;

  // Submission methods
  getSubmission(id: string): Promise<Submission | undefined>;
  getSubmissionByAssignmentAndStudent(assignmentId: string, studentId: string): Promise<SubmissionWithDetails | undefined>;
  getSubmissionsByAssignment(assignmentId: string): Promise<SubmissionWithDetails[]>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;

  // Grade methods
  getGrade(id: string): Promise<Grade | undefined>;
  getGradeBySubmission(submissionId: string): Promise<Grade | undefined>;
  createGrade(grade: InsertGrade): Promise<Grade>;

  // Stats methods
  getTeacherStats(teacherId: string): Promise<{
    totalStudents: number;
    pendingSubmissions: number;
    totalAssignments: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private courses: Map<string, Course>;
  private enrollments: Map<string, Enrollment>;
  private assignments: Map<string, Assignment>;
  private submissions: Map<string, Submission>;
  private grades: Map<string, Grade>;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.enrollments = new Map();
    this.assignments = new Map();
    this.submissions = new Map();
    this.grades = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  // Course methods
  async getCourse(id: string): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCourseWithTeacher(id: string): Promise<CourseWithTeacher | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;

    const teacher = await this.getUser(course.teacherId);
    if (!teacher) return undefined;

    return { ...course, teacher };
  }

  async getAllCourses(): Promise<CourseWithTeacher[]> {
    const courses = Array.from(this.courses.values());
    const coursesWithTeachers: CourseWithTeacher[] = [];

    for (const course of courses) {
      const teacher = await this.getUser(course.teacherId);
      if (teacher) {
        coursesWithTeachers.push({ ...course, teacher });
      }
    }

    return coursesWithTeachers;
  }

  async getCoursesByTeacher(teacherId: string): Promise<CourseWithTeacher[]> {
    const teacher = await this.getUser(teacherId);
    if (!teacher) return [];

    const courses = Array.from(this.courses.values()).filter(
      (course) => course.teacherId === teacherId
    );

    return courses.map((course) => ({ ...course, teacher }));
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = randomUUID();
    const course: Course = { ...insertCourse, id, createdAt: new Date() };
    this.courses.set(id, course);
    return course;
  }

  // Enrollment methods
  async getEnrollment(id: string): Promise<Enrollment | undefined> {
    return this.enrollments.get(id);
  }

  async getEnrollmentsByCourse(courseId: string): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      (enrollment) => enrollment.courseId === courseId
    );
  }

  async getEnrollmentsByStudent(studentId: string): Promise<EnrollmentWithCourse[]> {
    const enrollments = Array.from(this.enrollments.values()).filter(
      (enrollment) => enrollment.studentId === studentId
    );

    const enrollmentsWithCourses: EnrollmentWithCourse[] = [];

    for (const enrollment of enrollments) {
      const course = await this.getCourseWithTeacher(enrollment.courseId);
      if (course) {
        enrollmentsWithCourses.push({ ...enrollment, course });
      }
    }

    return enrollmentsWithCourses;
  }

  async getStudentsByCourse(courseId: string): Promise<User[]> {
    const enrollments = await this.getEnrollmentsByCourse(courseId);
    const students: User[] = [];

    for (const enrollment of enrollments) {
      const student = await this.getUser(enrollment.studentId);
      if (student) {
        students.push(student);
      }
    }

    return students;
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const id = randomUUID();
    const enrollment: Enrollment = { ...insertEnrollment, id, enrolledAt: new Date() };
    this.enrollments.set(id, enrollment);
    return enrollment;
  }

  async isStudentEnrolled(studentId: string, courseId: string): Promise<boolean> {
    return Array.from(this.enrollments.values()).some(
      (enrollment) =>
        enrollment.studentId === studentId && enrollment.courseId === courseId
    );
  }

  // Assignment methods
  async getAssignment(id: string): Promise<Assignment | undefined> {
    return this.assignments.get(id);
  }

  async getAssignmentWithCourse(id: string): Promise<AssignmentWithCourse | undefined> {
    const assignment = this.assignments.get(id);
    if (!assignment) return undefined;

    const course = await this.getCourse(assignment.courseId);
    if (!course) return undefined;

    return { ...assignment, course };
  }

  async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    return Array.from(this.assignments.values()).filter(
      (assignment) => assignment.courseId === courseId
    );
  }

  async getAssignmentsByStudent(studentId: string): Promise<AssignmentWithCourse[]> {
    const enrollments = await this.getEnrollmentsByStudent(studentId);
    const courseIds = enrollments.map((e) => e.courseId);

    const assignments = Array.from(this.assignments.values()).filter(
      (assignment) => courseIds.includes(assignment.courseId)
    );

    const assignmentsWithCourses: AssignmentWithCourse[] = [];

    for (const assignment of assignments) {
      const course = await this.getCourse(assignment.courseId);
      if (course) {
        assignmentsWithCourses.push({ ...assignment, course });
      }
    }

    return assignmentsWithCourses;
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const id = randomUUID();
    const assignment: Assignment = {
      ...insertAssignment,
      id,
      dueDate: new Date(insertAssignment.dueDate),
      createdAt: new Date(),
    };
    this.assignments.set(id, assignment);
    return assignment;
  }

  // Submission methods
  async getSubmission(id: string): Promise<Submission | undefined> {
    return this.submissions.get(id);
  }

  async getSubmissionByAssignmentAndStudent(
    assignmentId: string,
    studentId: string
  ): Promise<SubmissionWithDetails | undefined> {
    const submission = Array.from(this.submissions.values()).find(
      (s) => s.assignmentId === assignmentId && s.studentId === studentId
    );

    if (!submission) return undefined;

    const assignment = await this.getAssignment(submission.assignmentId);
    const student = await this.getUser(submission.studentId);
    const grade = await this.getGradeBySubmission(submission.id);

    if (!assignment || !student) return undefined;

    return {
      ...submission,
      assignment,
      student,
      grade,
    };
  }

  async getSubmissionsByAssignment(assignmentId: string): Promise<SubmissionWithDetails[]> {
    const submissions = Array.from(this.submissions.values()).filter(
      (submission) => submission.assignmentId === assignmentId
    );

    const submissionsWithDetails: SubmissionWithDetails[] = [];

    for (const submission of submissions) {
      const assignment = await this.getAssignment(submission.assignmentId);
      const student = await this.getUser(submission.studentId);
      const grade = await this.getGradeBySubmission(submission.id);

      if (assignment && student) {
        submissionsWithDetails.push({
          ...submission,
          assignment,
          student,
          grade,
        });
      }
    }

    return submissionsWithDetails;
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const id = randomUUID();
    const submission: Submission = {
      ...insertSubmission,
      id,
      submittedAt: new Date(),
    };
    this.submissions.set(id, submission);
    return submission;
  }

  // Grade methods
  async getGrade(id: string): Promise<Grade | undefined> {
    return this.grades.get(id);
  }

  async getGradeBySubmission(submissionId: string): Promise<Grade | undefined> {
    return Array.from(this.grades.values()).find(
      (grade) => grade.submissionId === submissionId
    );
  }

  async createGrade(insertGrade: InsertGrade): Promise<Grade> {
    const id = randomUUID();
    const grade: Grade = { ...insertGrade, id, gradedAt: new Date() };
    this.grades.set(id, grade);
    return grade;
  }

  // Stats methods
  async getTeacherStats(teacherId: string): Promise<{
    totalStudents: number;
    pendingSubmissions: number;
    totalAssignments: number;
  }> {
    const courses = await this.getCoursesByTeacher(teacherId);
    const courseIds = courses.map((c) => c.id);

    const studentIds = new Set<string>();
    for (const courseId of courseIds) {
      const students = await this.getStudentsByCourse(courseId);
      students.forEach((s) => studentIds.add(s.id));
    }

    const assignments = Array.from(this.assignments.values()).filter((a) =>
      courseIds.includes(a.courseId)
    );

    const assignmentIds = assignments.map((a) => a.id);
    const allSubmissions = Array.from(this.submissions.values()).filter((s) =>
      assignmentIds.includes(s.assignmentId)
    );

    const gradedSubmissionIds = new Set(
      Array.from(this.grades.values()).map((g) => g.submissionId)
    );

    const pendingSubmissions = allSubmissions.filter(
      (s) => !gradedSubmissionIds.has(s.id)
    ).length;

    return {
      totalStudents: studentIds.size,
      pendingSubmissions,
      totalAssignments: assignments.length,
    };
  }
}

export const storage = new MemStorage();
