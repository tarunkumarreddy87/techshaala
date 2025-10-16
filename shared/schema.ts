import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with role-based access
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'student' | 'teacher'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["student", "teacher"], { required_error: "Role must be either student or teacher" }),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type User = typeof users.$inferSelect;

// Courses table
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  duration: text("duration").notNull(), // e.g., "8 weeks", "3 months"
  teacherId: varchar("teacher_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
}).extend({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  duration: z.string().min(1, "Duration is required"),
});

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

// Enrollments table
export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  courseId: varchar("course_id").notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrolledAt: true,
});

export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

// Assignments table
export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: timestamp("due_date").notNull(),
  maxScore: integer("max_score").notNull().default(100),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  createdAt: true,
}).extend({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.string().or(z.date()),
  maxScore: z.number().min(1).default(100),
});

export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;

// Submissions table
export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull(),
  studentId: varchar("student_id").notNull(),
  content: text("content").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  submittedAt: true,
}).extend({
  content: z.string().min(1, "Submission content is required"),
});

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;

// Grades table
export const grades = pgTable("grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").notNull().unique(),
  score: integer("score").notNull(),
  feedback: text("feedback"),
  gradedAt: timestamp("graded_at").defaultNow(),
});

export const insertGradeSchema = createInsertSchema(grades).omit({
  id: true,
  gradedAt: true,
}).extend({
  score: z.number().min(0, "Score must be at least 0"),
  feedback: z.string().optional(),
});

export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Grade = typeof grades.$inferSelect;

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
