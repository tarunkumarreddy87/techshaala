import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { requireAuth, requireRole } from "./middleware/auth";
import {
  insertUserSchema,
  loginSchema,
  insertCourseSchema,
  updateCourseSchema,
  insertEnrollmentSchema,
  insertAssignmentSchema,
  updateAssignmentSchema,
  insertSubmissionSchema,
  insertSubmissionWithFileSchema,
  insertGradeSchema,
  updateGradeSchema,
  type User,
} from "@shared/schema";
import path from "path";
import fs from "fs";
import { sendNotificationToClient, sendNotificationToCourse } from "./index";

// Helper function to handle async route errors
const asyncHandler = (fn: (req: Request, res: Response, next: any) => Promise<any>) => (req: Request, res: Response, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Helper to safely return user without password
const sanitizeUser = (user: User): Omit<User, "password"> => {
  const { password, ...safeUser } = user;
  return safeUser;
};

// Helper function to save uploaded file
const saveUploadedFile = (file: any, uploadDir: string): { fileName: string, filePath: string, fileType: string, fileSize: number } => {
  // Create upload directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Generate unique filename
  const fileExtension = path.extname(file.name);
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1000000)}${fileExtension}`;
  const filePath = path.join(uploadDir, fileName);

  // Save file
  file.mv(filePath);

  return {
    fileName,
    filePath,
    fileType: file.mimetype,
    fileSize: file.size
  };
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
    req.session.userRole = role as "student" | "teacher";

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
    req.session.userRole = user.role as "student" | "teacher";

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

  // Add endpoint to get current user
  app.get("/api/auth/me", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(sanitizeUser(user));
  }));

  // Add endpoint to update user preferences
  app.put("/api/auth/preferences", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const { theme, emailNotifications, language } = req.body;
    const userId = req.session.userId!;
    
    // Get current user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Update user preferences (in a real implementation, you might want to store these in a separate collection)
    // For now, we'll just return the updated preferences
    const updatedPreferences = {
      theme: theme || "light",
      emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
      language: language || "en"
    };
    
    res.json(updatedPreferences);
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

  // Add new endpoint to get assignments with submission data for a specific course
  app.get("/api/courses/:id/assignments-with-submissions", requireAuth, requireRole("student"), asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const studentId = req.session.userId!;
    
    // Check if student is enrolled in the course
    const isEnrolled = await storage.isStudentEnrolled(studentId, id);
    if (!isEnrolled) {
      return res.status(403).json({ error: "You must be enrolled in this course to view assignments" });
    }
    
    const assignments = await storage.getAssignmentsByCourse(id);
    
    // Add submission info for each assignment
    const assignmentsWithSubmissions = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = await storage.getSubmissionByAssignmentAndStudent(
          assignment.id,
          studentId
        );
        return { ...assignment, submission: submission || undefined };
      })
    );

    res.json(assignmentsWithSubmissions);
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
    
    // Get all students enrolled in courses taught by this teacher
    const students = await storage.getAllUsers();
    const studentUsers = students.filter(user => user.role === "student");
    
    // Send notification to all students about new course
    for (const student of studentUsers) {
      sendNotificationToClient(student.id, {
        id: `course-${course.id}-${Date.now()}`,
        type: "course_chat",
        title: "New Course Available",
        message: `A new course "${course.title}" has been created`,
        timestamp: new Date().toISOString(),
        read: false,
        relatedId: course.id
      });
    }
    
    res.status(201).json(course);
  }));

  // Add PUT route for updating courses
  app.put("/api/courses/:id", requireAuth, requireRole("teacher"), asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // Check if course exists and belongs to teacher
    const course = await storage.getCourse(id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (course.teacherId !== req.session.userId) {
      return res.status(403).json({ error: "You can only edit your own courses" });
    }

    const parsed = updateCourseSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const updatedCourse = await storage.updateCourse(id, parsed.data);
    res.json(updatedCourse);
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
    
    // Get all students enrolled in this course
    const enrollments = await storage.getEnrollmentsByCourse(courseId);
    
    // Send notification to all students in the course
    for (const enrollment of enrollments) {
      sendNotificationToClient(enrollment.studentId, {
        id: `assignment-${assignment.id}-${Date.now()}`,
        type: "assignment_due",
        title: "New Assignment",
        message: `A new assignment "${assignment.title}" has been created in course "${course.title}"`,
        timestamp: new Date().toISOString(),
        read: false,
        relatedId: assignment.id
      });
    }
    
    res.status(201).json(assignment);
  }));

  // Add PUT route for updating assignments
  app.put("/api/assignments/:id", requireAuth, requireRole("teacher"), asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // Check if assignment exists
    const assignment = await storage.getAssignment(id);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Check if teacher owns the course
    const course = await storage.getCourse(assignment.courseId);
    if (!course || course.teacherId !== req.session.userId) {
      return res.status(403).json({ error: "You can only edit assignments for your own courses" });
    }

    const parsed = updateAssignmentSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const updatedAssignment = await storage.updateAssignment(id, parsed.data);
    res.json(updatedAssignment);
  }));

  // Submission Routes - Updated to handle file uploads
  app.post("/api/submissions", requireAuth, requireRole("student"), asyncHandler(async (req: Request, res: Response) => {
    // Check if this is a file upload
    let submissionData: any = {
      ...req.body,
      studentId: req.session.userId,
    };

    // Handle file upload if present
    if (req.files && req.files.file) {
      const fileArray = Array.isArray(req.files.file) ? req.files.file : [req.files.file];
      const file = fileArray[0];
      
      // Validate file type (only allow PDF)
      if (file.mimetype !== 'application/pdf') {
        return res.status(400).json({ error: "Only PDF files are allowed" });
      }
      
      // Save file
      try {
        const uploadDir = path.join(process.cwd(), 'uploads');
        const fileData = await saveUploadedFile(file, uploadDir);
        
        // Add file data to submission
        submissionData = {
          ...submissionData,
          fileName: fileData.fileName,
          filePath: fileData.filePath,
          fileType: fileData.fileType,
          fileSize: fileData.fileSize
        };
      } catch (error) {
        console.error('File upload error:', error);
        return res.status(500).json({ error: "Failed to upload file" });
      }
    }

    // Validate submission data
    const parsed = insertSubmissionWithFileSchema.safeParse(submissionData);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { assignmentId, content, fileName, filePath, fileType, fileSize } = parsed.data;
    const studentId = req.session.userId!;

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

    // Create submission with file data if present
    const submission = await storage.createSubmission({ 
      assignmentId, 
      studentId, 
      content,
      ...(fileName && { fileName }),
      ...(filePath && { filePath }),
      ...(fileType && { fileType }),
      ...(fileSize && { fileSize })
    });
    
    res.status(201).json(submission);
  }));

  // Route to download submitted files
  app.get("/api/submissions/:id/file", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // Get submission
    const submission = await storage.getSubmission(id);
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }
    
    // Check permissions
    // Teachers can access any submission in their courses
    // Students can only access their own submissions
    if (req.session.userRole === "student" && submission.studentId !== req.session.userId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // For students, verify they're enrolled in the course
    if (req.session.userRole === "student") {
      const assignment = await storage.getAssignment(submission.assignmentId);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      
      const isEnrolled = await storage.isStudentEnrolled(req.session.userId!, assignment.courseId);
      if (!isEnrolled) {
        return res.status(403).json({ error: "Access denied" });
      }
    }
    
    // For teachers, verify they own the course
    if (req.session.userRole === "teacher") {
      const assignment = await storage.getAssignment(submission.assignmentId);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      
      const course = await storage.getCourse(assignment.courseId);
      if (!course || course.teacherId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
    }
    
    // Check if file exists
    if (!submission.filePath || !fs.existsSync(submission.filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    
    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${submission.fileName}"`);
    res.setHeader('Content-Type', submission.fileType || 'application/octet-stream');
    
    // Send file
    res.sendFile(submission.filePath);
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

  // Add PUT route for updating grades
  app.put("/api/grades/:id", requireAuth, requireRole("teacher"), asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // Check if grade exists
    const grade = await storage.getGrade(id);
    if (!grade) {
      return res.status(404).json({ error: "Grade not found" });
    }

    // Verify teacher owns the course
    const submission = await storage.getSubmission(grade.submissionId);
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const assignment = await storage.getAssignment(submission.assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const course = await storage.getCourse(assignment.courseId);
    if (!course || course.teacherId !== req.session.userId) {
      return res.status(403).json({ error: "You can only update grades for your own courses" });
    }

    const parsed = updateGradeSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { score, feedback } = parsed.data;

    // Validate score against assignment max score
    if (score !== undefined && score > assignment.maxScore) {
      return res.status(400).json({
        error: `Score cannot exceed maximum score of ${assignment.maxScore}`,
      });
    }

    const updatedGrade = await storage.updateGrade(id, { score, feedback });
    res.json(updatedGrade);
  }));

  // Teacher Stats Route
  app.get("/api/teacher/stats", requireAuth, requireRole("teacher"), asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.session.userId!;
    const stats = await storage.getTeacherStats(teacherId);
    res.json(stats);
  }));

  // Health check endpoint for deployment
  app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({ 
      status: "OK", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: any) => {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  });

  const httpServer = createServer(app);

  return httpServer;
}