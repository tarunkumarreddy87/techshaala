import { mysqlTable, text, varchar, timestamp, int, boolean } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with role-based access
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'student' | 'teacher' | 'admin'
  profileImage: text("profile_image"),
  isBlocked: boolean("is_blocked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["student", "teacher", "admin"], { required_error: "Role must be either student, teacher, or admin" }),
}).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Courses table
export const courses = mysqlTable("courses", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  duration: text("duration").notNull(), // e.g., "8 weeks", "3 months"
  teacherId: varchar("teacher_id", { length: 36 }).notNull(),
  // Add YouTube link and chapters fields
  youtubeLink: text("youtube_link"),
  chapters: text("chapters"), // JSON string of chapters
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCourseSchema = createInsertSchema(courses, {
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  duration: z.string().min(1, "Duration is required"),
  youtubeLink: z.string().optional().nullable(),
  chapters: z.string().optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
});

// Update course schema
export const updateCourseSchema = createInsertSchema(courses, {
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  duration: z.string().min(1, "Duration is required").optional(),
  youtubeLink: z.string().optional().nullable(),
  chapters: z.string().optional().nullable(),
  isArchived: z.boolean().optional(),
}).omit({
  id: true,
  teacherId: true,
  createdAt: true,
});

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type UpdateCourse = z.infer<typeof updateCourseSchema>;
export type Course = typeof courses.$inferSelect;

// Enrollments table
export const enrollments = mysqlTable("enrollments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  studentId: varchar("student_id", { length: 36 }).notNull(),
  courseId: varchar("course_id", { length: 36 }).notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrolledAt: true,
});

export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

// Assignments table
export const assignments = mysqlTable("assignments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  courseId: varchar("course_id", { length: 36 }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: timestamp("due_date").notNull(),
  maxScore: int("max_score").notNull().default(100),
  // Notification flags
  notified1Day: boolean("notified_1_day").default(false),
  notified2Hours: boolean("notified_2_hours").default(false),
  notified5Minutes: boolean("notified_5_minutes").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAssignmentSchema = createInsertSchema(assignments, {
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.string().or(z.date()),
  maxScore: z.number().min(1).default(100),
}).omit({
  id: true,
  createdAt: true,
});

// Update assignment schema to include edit functionality
export const updateAssignmentSchema = createInsertSchema(assignments, {
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  dueDate: z.string().or(z.date()).optional(),
  maxScore: z.number().min(1).default(100).optional(),
}).omit({
  id: true,
  createdAt: true,
  courseId: true,
});

export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type UpdateAssignment = z.infer<typeof updateAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;

// Submissions table
export const submissions = mysqlTable("submissions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  assignmentId: varchar("assignment_id", { length: 36 }).notNull(),
  studentId: varchar("student_id", { length: 36 }).notNull(),
  content: text("content").notNull(),
  // Add file upload fields
  fileName: text("file_name"),
  filePath: text("file_path"),
  fileType: text("file_type"),
  fileSize: int("file_size"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Update the insert submission schema to handle file uploads
export const insertSubmissionSchema = createInsertSchema(submissions, {
  content: z.string().min(1, "Submission content is required"),
}).omit({
  id: true,
  submittedAt: true,
  fileName: true,
  filePath: true,
  fileType: true,
  fileSize: true,
});

// Create a separate schema for file uploads
export const insertSubmissionWithFileSchema = z.object({
  content: z.string().min(1, "Submission content is required"),
  assignmentId: z.string(),
  fileName: z.string().optional(),
  filePath: z.string().optional(),
  fileType: z.string().optional(),
  fileSize: z.number().optional(),
});

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type InsertSubmissionWithFile = z.infer<typeof insertSubmissionWithFileSchema>;
export type Submission = typeof submissions.$inferSelect;

// Grades table
export const grades = mysqlTable("grades", {
  id: varchar("id", { length: 36 }).primaryKey(),
  submissionId: varchar("submission_id", { length: 36 }).notNull(),
  score: int("score").notNull(),
  feedback: text("feedback"),
  gradedAt: timestamp("graded_at").defaultNow(),
});

export const insertGradeSchema = createInsertSchema(grades, {
  score: z.number().min(0, "Score must be at least 0"),
  feedback: z.string().optional(),
}).omit({
  id: true,
  gradedAt: true,
});

// Update grade schema to allow editing
export const updateGradeSchema = createInsertSchema(grades, {
  score: z.number().min(0, "Score must be at least 0").optional(),
  feedback: z.string().optional(),
}).omit({
  id: true,
  gradedAt: true,
  submissionId: true,
});

export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type UpdateGrade = z.infer<typeof updateGradeSchema>;
export type Grade = typeof grades.$inferSelect;

// Messages table for chat functionality
export const messages = mysqlTable("messages", {
  id: varchar("id", { length: 36 }).primaryKey(),
  senderId: varchar("sender_id", { length: 36 }).notNull(),
  receiverId: varchar("receiver_id", { length: 36 }),
  courseId: varchar("course_id", { length: 36 }),
  content: text("content").notNull(),
  // Add file attachment fields
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileType: text("file_type"),
  fileSize: int("file_size"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages, {
  content: z.string().min(1, "Message content is required"),
  senderId: z.string().min(1, "Sender ID is required"),
  receiverId: z.string().optional().nullable(),
  courseId: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileType: z.string().optional().nullable(),
  fileSize: z.number().optional().nullable(),
}).omit({
  id: true,
  timestamp: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Extended message type for API responses with file attachments
export type MessageWithFile = Message & {
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
};

// Extended types for API responses with joined data
export type CourseWithTeacher = Course & {
  teacher: User;
};

export type EnrollmentWithCourse = Enrollment & {
  course: CourseWithTeacher;
};

export type AssignmentWithCourse = Assignment & {
  course: Course;
};

export type SubmissionWithDetails = Submission & {
  assignment: Assignment;
  student: User;
  grade?: Grade;
};

export type GradeWithSubmission = Grade & {
  submission: SubmissionWithDetails;
};

// Chapter type for course content
export type Chapter = {
  id: number;
  title: string;
  youtubeId: string;
  duration: string;
};

// Syllabus item type for course materials
export type SyllabusItem = {
  id: string;
  title: string;
  description: string;
  fileName?: string;
  filePath?: string;
  fileType?: string;
  fileSize?: number;
  createdAt: Date;
};