import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { requireAuth, requireRole } from "./middleware/auth";
import {
  insertUserSchema,
  loginSchema,
  insertCourseSchema,
  insertEnrollmentSchema,
  insertAssignmentSchema,
  insertSubmissionSchema,
  insertGradeSchema,
  type User,
} from "@shared/schema";

// Helper function to handle async route errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: Function) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Helper to safely return user without password
const sanitizeUser = (user: User): Omit<User, "password"> => {
  const { password, ...safeUser } = user;
  return safeUser;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication Routes
  app.post("/api/auth/register", asyncHandler(async (req: Request, res: Response) => {
    const parsed = insertUserSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { email, password, name, role } = parsed.data;

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      name,
      role,
    });

    // Set session
    req.session.userId = user.id;
    req.session.userRole = user.role;

    res.status(201).json(sanitizeUser(user));
  }));

  app.post("/api/auth/login", asyncHandler(async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { email, password } = parsed.data;

    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Set session
    req.session.userId = user.id;
    req.session.userRole = user.role;

    res.json(sanitizeUser(user));
  }));

  app.post("/api/auth/logout", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  }));

  // Course Routes
  app.get("/api/courses", asyncHandler(async (req: Request, res: Response) => {
    const courses = await storage.getAllCourses();
    res.json(courses);
  }));

  app.get("/api/courses/my-courses", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.session.userId!;
    const courses = await storage.getCoursesByTeacher(teacherId);
    res.json(courses);
  }));

  app.get("/api/courses/:id", asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const course = await storage.getCourseWithTeacher(id);
    
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(course);
  }));

  app.get("/api/courses/:id/students", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const students = await storage.getStudentsByCourse(id);
    res.json(students.map(sanitizeUser));
  }));

  app.get("/api/courses/:id/assignments", asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const assignments = await storage.getAssignmentsByCourse(id);
    res.json(assignments);
  }));

  app.post("/api/courses", requireAuth, requireRole("teacher"), asyncHandler(async (req: Request, res: Response) => {
    const parsed = insertCourseSchema.safeParse({
      ...req.body,
      teacherId: req.session.userId,
    });
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const course = await storage.createCourse(parsed.data);
    res.status(201).json(course);
  }));

  // Enrollment Routes
  app.get("/api/enrollments/my-courses", requireAuth, requireRole("student"), asyncHandler(async (req: Request, res: Response) => {
    const studentId = req.session.userId!;
    const enrollments = await storage.getEnrollmentsByStudent(studentId);
    res.json(enrollments);
  }));

  app.post("/api/enrollments", requireAuth, requireRole("student"), asyncHandler(async (req: Request, res: Response) => {
    const parsed = insertEnrollmentSchema.safeParse({
      ...req.body,
      studentId: req.session.userId,
    });
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { studentId, courseId } = parsed.data;

    // Check if course exists
    const course = await storage.getCourse(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Check if already enrolled
    const alreadyEnrolled = await storage.isStudentEnrolled(studentId, courseId);
    if (alreadyEnrolled) {
      return res.status(400).json({ error: "Already enrolled in this course" });
    }

    const enrollment = await storage.createEnrollment(parsed.data);
    res.status(201).json(enrollment);
  }));

  // Assignment Routes
  app.get("/api/assignments/my-assignments", requireAuth, requireRole("student"), asyncHandler(async (req: Request, res: Response) => {
    const studentId = req.session.userId!;
    const assignments = await storage.getAssignmentsByStudent(studentId);
    
    // Add submission info for each assignment
    const assignmentsWithSubmissions = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = await storage.getSubmissionByAssignmentAndStudent(
          assignment.id,
          studentId
        );
        return { ...assignment, submission };
      })
    );

    res.json(assignmentsWithSubmissions);
  }));

  app.get("/api/assignments/:id", asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const assignment = await storage.getAssignmentWithCourse(id);
    
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // If user is logged in as student, include their submission
    if (req.session.userId && req.session.userRole === "student") {
      const submission = await storage.getSubmissionByAssignmentAndStudent(id, req.session.userId);
      return res.json({ ...assignment, submission });
    }

    res.json(assignment);
  }));

  app.get("/api/assignments/:id/submissions", requireAuth, requireRole("teacher"), asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const assignment = await storage.getAssignment(id);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const submissions = await storage.getSubmissionsByAssignment(id);
    res.json(submissions);
  }));

  app.post("/api/assignments", requireAuth, requireRole("teacher"), asyncHandler(async (req: Request, res: Response) => {
    const parsed = insertAssignmentSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { courseId } = parsed.data;

    // Check if course exists and belongs to teacher
    const course = await storage.getCourse(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (course.teacherId !== req.session.userId) {
      return res.status(403).json({ error: "You can only create assignments for your own courses" });
    }

    const assignment = await storage.createAssignment(parsed.data);
    res.status(201).json(assignment);
  }));

  // Submission Routes
  app.post("/api/submissions", requireAuth, requireRole("student"), asyncHandler(async (req: Request, res: Response) => {
    const parsed = insertSubmissionSchema.safeParse({
      ...req.body,
      studentId: req.session.userId,
    });
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { assignmentId, studentId, content } = parsed.data;

    // Check if assignment exists
    const assignment = await storage.getAssignment(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Check if already submitted
    const existingSubmission = await storage.getSubmissionByAssignmentAndStudent(
      assignmentId,
      studentId
    );
    if (existingSubmission) {
      return res.status(400).json({ error: "Assignment already submitted" });
    }

    // Check if student is enrolled in the course
    const isEnrolled = await storage.isStudentEnrolled(studentId, assignment.courseId);
    if (!isEnrolled) {
      return res.status(403).json({ error: "Must be enrolled in course to submit assignment" });
    }

    const submission = await storage.createSubmission({ assignmentId, studentId, content });
    res.status(201).json(submission);
  }));

  // Grade Routes
  app.post("/api/grades", requireAuth, requireRole("teacher"), asyncHandler(async (req: Request, res: Response) => {
    const parsed = insertGradeSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { submissionId, score, feedback } = parsed.data;

    // Check if submission exists
    const submission = await storage.getSubmission(submissionId);
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Verify teacher owns the course
    const assignment = await storage.getAssignment(submission.assignmentId);
    if (assignment) {
      const course = await storage.getCourse(assignment.courseId);
      if (course && course.teacherId !== req.session.userId) {
        return res.status(403).json({ error: "You can only grade submissions for your own courses" });
      }
    }

    // Check if already graded
    const existingGrade = await storage.getGradeBySubmission(submissionId);
    if (existingGrade) {
      return res.status(400).json({ error: "Submission already graded" });
    }

    // Validate score against assignment max score
    if (assignment && score > assignment.maxScore) {
      return res.status(400).json({
        error: `Score cannot exceed maximum score of ${assignment.maxScore}`,
      });
    }

    const grade = await storage.createGrade({ submissionId, score, feedback });
    res.status(201).json(grade);
  }));

  // Teacher Stats Route
  app.get("/api/teacher/stats", requireAuth, requireRole("teacher"), asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.session.userId!;
    const stats = await storage.getTeacherStats(teacherId);
    res.json(stats);
  }));

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: Function) => {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  });

  const httpServer = createServer(app);

  return httpServer;
}
