import mongoose from "mongoose";
import { randomUUID } from "crypto";
import type {
  User as SharedUser,
  InsertUser,
  Course as SharedCourse,
  InsertCourse,
  Enrollment as SharedEnrollment,
  InsertEnrollment,
  Assignment as SharedAssignment,
  InsertAssignment,
  UpdateAssignment,
  Submission as SharedSubmission,
  InsertSubmission,
  Grade as SharedGrade,
  InsertGrade,
  UpdateGrade,
  CourseWithTeacher,
  EnrollmentWithCourse,
  AssignmentWithCourse,
  SubmissionWithDetails,
} from "@shared/schema";

// Define MongoDB schemas
const mongoUserSchema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ["student", "teacher", "admin"] },
  isBlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const mongoCourseSchema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: String, required: true },
  teacherId: { type: String, required: true },
  // Add YouTube link and chapters fields
  youtubeLink: { type: String },
  chapters: { type: String }, // JSON string of chapters
  isArchived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const mongoEnrollmentSchema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  studentId: { type: String, required: true },
  courseId: { type: String, required: true },
  enrolledAt: { type: Date, default: Date.now }
});

const mongoAssignmentSchema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  courseId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  dueDate: { type: Date, required: true },
  maxScore: { type: Number, default: 100 },
  // Notification flags
  notified1Day: { type: Boolean, default: false },
  notified1Hour: { type: Boolean, default: false },
  notified5Minutes: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const mongoSubmissionSchema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  assignmentId: { type: String, required: true },
  studentId: { type: String, required: true },
  content: { type: String, required: true },
  // File upload fields
  fileName: { type: String },
  filePath: { type: String },
  fileType: { type: String },
  fileSize: { type: Number },
  submittedAt: { type: Date, default: Date.now }
});

const mongoGradeSchema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  submissionId: { type: String, required: true },
  score: { type: Number, required: true },
  feedback: String,
  gradedAt: { type: Date, default: Date.now }
});

// Add MongoDB schema for messages
const mongoMessageSchema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  senderId: { type: String, required: true },
  receiverId: { type: String },
  courseId: { type: String },
  content: { type: String, required: true },
  // Add file attachment fields
  fileUrl: { type: String },
  fileName: { type: String },
  fileType: { type: String },
  fileSize: { type: Number },
  timestamp: { type: Date, default: Date.now }
});

// Add MongoDB schema for syllabus items
const mongoSyllabusSchema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  courseId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  // File upload fields
  fileName: { type: String },
  filePath: { type: String },
  fileType: { type: String },
  fileSize: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

// MongoDB models
const MongoUser = mongoose.model("User", mongoUserSchema);
const MongoCourse = mongoose.model("Course", mongoCourseSchema);
const MongoEnrollment = mongoose.model("Enrollment", mongoEnrollmentSchema);
const MongoAssignment = mongoose.model("Assignment", mongoAssignmentSchema);
const MongoSubmission = mongoose.model("Submission", mongoSubmissionSchema);
const MongoGrade = mongoose.model("Grade", mongoGradeSchema);
const MongoMessage = mongoose.model("Message", mongoMessageSchema);
const MongoSyllabus = mongoose.model("Syllabus", mongoSyllabusSchema);

// In-memory storage as fallback
class MemStorage {
  private users = new Map<string, any>();
  private courses = new Map<string, any>();
  private enrollments = new Map<string, any>();
  private assignments = new Map<string, any>();
  private submissions = new Map<string, any>();
  private grades = new Map<string, any>();
  private messages = new Map<string, any>();

  constructor() {
    // Initialize with some default data
    const adminUser = {
      id: "admin-1",
      name: "Admin User",
      email: "admin@gmail.com",
      password: "$2b$10$a/lYAx0A1X59I3rbBMVcKORWHO3YYprFoSJd8wPMZPGjjbldRFjxW", // bcrypt hash of "tarun@487"
      role: "admin",
      isBlocked: false,
      createdAt: new Date()
    };
    this.users.set(adminUser.id, adminUser);

    // Add a sample teacher
    const teacherUser = {
      id: "teacher-1",
      name: "John Teacher",
      email: "john.teacher@example.com",
      password: "$2b$10$a/lYAx0A1X59I3rbBMVcKORWHO3YYprFoSJd8wPMZPGjjbldRFjxW", // bcrypt hash of "tarun@487"
      role: "teacher",
      isBlocked: false,
      createdAt: new Date()
    };
    this.users.set(teacherUser.id, teacherUser);

    // Add a sample student
    const studentUser = {
      id: "student-1",
      name: "Jane Student",
      email: "jane.student@example.com",
      password: "$2b$10$a/lYAx0A1X59I3rbBMVcKORWHO3YYprFoSJd8wPMZPGjjbldRFjxW", // bcrypt hash of "tarun@487"
      role: "student",
      isBlocked: false,
      createdAt: new Date()
    };
    this.users.set(studentUser.id, studentUser);
  }

  // User methods
  async getUser(id: string): Promise<SharedUser | undefined> {
    return this.users.get(id);
  }

  async getAllUsers(): Promise<SharedUser[]> {
    return Array.from(this.users.values());
  }

  async getUserByEmail(email: string): Promise<SharedUser | undefined> {
    return Array.from(this.users.values()).find((user: any) => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<SharedUser> {
    const id = randomUUID();
    const user: any = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updateUser: Partial<InsertUser>): Promise<SharedUser | undefined> {
    const user: any = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updateUser };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Additional methods to prevent runtime errors (placeholders)
  async getTeacherStudents(teacherId: string): Promise<any[]> {
    // Get all courses for this teacher
    const courses = Array.from(this.courses.values()).filter((c: any) => c.teacherId === teacherId);
    const courseIds = courses.map((c: any) => c.id);
    
    // Get all unique students across all courses
    const studentIds = new Set<string>();
    const studentsMap = new Map<string, any>();
    
    for (const courseId of courseIds) {
      const enrollments = Array.from(this.enrollments.values()).filter((e: any) => e.courseId === courseId);
      for (const enrollment of enrollments) {
        if (!studentIds.has(enrollment.studentId)) {
          studentIds.add(enrollment.studentId);
          const student = this.users.get(enrollment.studentId);
          if (student) {
            studentsMap.set(enrollment.studentId, student);
          }
        }
      }
    }
    
    return Array.from(studentsMap.values());
  }
  
  private syllabusItems = new Map<string, any>();
  
  async createSyllabusItem(syllabusData: any): Promise<any> {
    const id = randomUUID();
    const syllabusItem: any = { 
      ...syllabusData, 
      id, 
      createdAt: new Date() 
    };
    this.syllabusItems.set(id, syllabusItem);
    return syllabusItem;
  }
  
  async getSyllabusItemsByCourse(courseId: string): Promise<any[]> {
    return Array.from(this.syllabusItems.values()).filter((item: any) => item.courseId === courseId);
  }
  
  async getSyllabusItemById(id: string): Promise<any> {
    return this.syllabusItems.get(id);
  }
  
  async getMessagesBetweenUsers(userId1: string, userId2: string): Promise<any[]> {
    // Filter messages between two users
    return Array.from(this.messages.values()).filter((m: any) => 
      (m.senderId === userId1 && m.receiverId === userId2) ||
      (m.senderId === userId2 && m.receiverId === userId1)
    );
  }
  
  async getMessagesByCourse(courseId: string): Promise<any[]> {
    // Filter messages by course
    return Array.from(this.messages.values()).filter((m: any) => m.courseId === courseId);
  }
  
  async createMessage(messageData: any): Promise<any> {
    const id = randomUUID();
    const message: any = { ...messageData, id, timestamp: new Date() };
    this.messages.set(id, message);
    return message;
  }

  // Course methods
  async getCourse(id: string): Promise<SharedCourse | undefined> {
    return this.courses.get(id);
  }

  async getCourseWithTeacher(id: string): Promise<CourseWithTeacher | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    
    const teacher = this.users.get(course.teacherId);
    if (!teacher) return undefined;
    
    return { ...course, teacher };
  }

  async getAllCourses(): Promise<CourseWithTeacher[]> {
    const coursesWithTeachers: CourseWithTeacher[] = [];
    
    const courseIds = Array.from(this.courses.keys());
    for (let i = 0; i < courseIds.length; i++) {
      const course = this.courses.get(courseIds[i]);
      if (course) {
        const teacher = this.users.get(course.teacherId);
        if (teacher) {
          coursesWithTeachers.push({ ...course, teacher });
        }
      }
    }
    
    return coursesWithTeachers;
  }

  async getCoursesByTeacher(teacherId: string): Promise<CourseWithTeacher[]> {
    const coursesWithTeachers: CourseWithTeacher[] = [];
    
    const coursesArray = Array.from(this.courses.values());
    for (let i = 0; i < coursesArray.length; i++) {
      const course = coursesArray[i];
      if (course.teacherId === teacherId) {
        const teacher = this.users.get(course.teacherId);
        if (teacher) {
          coursesWithTeachers.push({ ...course, teacher });
        }
      }
    }
    
    return coursesWithTeachers;
  }

  async createCourse(insertCourse: InsertCourse): Promise<SharedCourse> {
    const id = randomUUID();
    const course: any = { ...insertCourse, id, createdAt: new Date() };
    this.courses.set(id, course);
    return course;
  }

  async updateCourse(id: string, updateCourse: Partial<InsertCourse>): Promise<SharedCourse | undefined> {
    const course: any = this.courses.get(id);
    if (!course) return undefined;
    
    const updatedCourse = { ...course, ...updateCourse };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  // Enrollment methods
  async getEnrollment(id: string): Promise<SharedEnrollment | undefined> {
    return this.enrollments.get(id);
  }

  async getEnrollmentsByCourse(courseId: string): Promise<SharedEnrollment[]> {
    return Array.from(this.enrollments.values()).filter((e: any) => e.courseId === courseId);
  }

  async getEnrollmentsByStudent(studentId: string): Promise<EnrollmentWithCourse[]> {
    const enrollments = Array.from(this.enrollments.values()).filter((e: any) => e.studentId === studentId);
    const enrollmentsWithCourses: EnrollmentWithCourse[] = [];
    
    for (const enrollment of enrollments) {
      const course = this.courses.get(enrollment.courseId);
      if (course) {
        const teacher = this.users.get(course.teacherId);
        if (teacher) {
          const courseWithTeacher = { ...course, teacher };
          enrollmentsWithCourses.push({ ...enrollment, course: courseWithTeacher });
        }
      }
    }
    
    return enrollmentsWithCourses;
  }

  async getStudentsByCourse(courseId: string): Promise<SharedUser[]> {
    const enrollments = Array.from(this.enrollments.values()).filter((e: any) => e.courseId === courseId);
    const students: SharedUser[] = [];
    
    for (const enrollment of enrollments) {
      const student = this.users.get(enrollment.studentId);
      if (student) {
        students.push(student);
      }
    }
    
    return students;
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<SharedEnrollment> {
    const id = randomUUID();
    const enrollment: any = { ...insertEnrollment, id, enrolledAt: new Date() };
    this.enrollments.set(id, enrollment);
    return enrollment;
  }

  async isStudentEnrolled(studentId: string, courseId: string): Promise<boolean> {
    return Array.from(this.enrollments.values()).some((e: any) => 
      e.studentId === studentId && e.courseId === courseId
    );
  }

  // Assignment methods
  async getAssignment(id: string): Promise<SharedAssignment | undefined> {
    return this.assignments.get(id);
  }

  async getAssignmentWithCourse(id: string): Promise<AssignmentWithCourse | undefined> {
    const assignment = this.assignments.get(id);
    if (!assignment) return undefined;
    
    const course = this.courses.get(assignment.courseId);
    if (!course) return undefined;
    
    return { ...assignment, course };
  }

  async getAllAssignments(): Promise<SharedAssignment[]> {
    return Array.from(this.assignments.values());
  }

  async getAssignmentsByCourse(courseId: string): Promise<SharedAssignment[]> {
    return Array.from(this.assignments.values()).filter((a: any) => a.courseId === courseId);
  }

  async getAssignmentsByStudent(studentId: string): Promise<AssignmentWithCourse[]> {
    // Get all enrollments for this student
    const enrollments = Array.from(this.enrollments.values()).filter((e: any) => e.studentId === studentId);
    const courseIds = enrollments.map((e: any) => e.courseId);
    
    // Get all assignments for these courses
    const assignments = Array.from(this.assignments.values()).filter((a: any) => 
      courseIds.includes(a.courseId)
    );
    
    // Add course information to each assignment
    const assignmentsWithCourses: AssignmentWithCourse[] = [];
    for (const assignment of assignments) {
      const course = this.courses.get(assignment.courseId);
      if (course) {
        assignmentsWithCourses.push({ ...assignment, course });
      }
    }
    
    return assignmentsWithCourses;
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<SharedAssignment> {
    const id = randomUUID();
    const assignment: any = { 
      ...insertAssignment, 
      id, 
      dueDate: new Date(insertAssignment.dueDate),
      createdAt: new Date()
    };
    this.assignments.set(id, assignment);
    return assignment;
  }

  async updateAssignment(id: string, updateAssignment: UpdateAssignment): Promise<SharedAssignment | undefined> {
    const assignment: any = this.assignments.get(id);
    if (!assignment) return undefined;
    
    const updatedAssignment = { 
      ...assignment, 
      ...updateAssignment,
      dueDate: updateAssignment.dueDate ? new Date(updateAssignment.dueDate) : assignment.dueDate
    };
    this.assignments.set(id, updatedAssignment);
    return updatedAssignment;
  }

  // Add method to get assignments due soon for notifications
  async getAssignmentsDueSoon(): Promise<SharedAssignment[]> {
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return Array.from(this.assignments.values()).filter((assignment: any) => {
      const dueDate = new Date(assignment.dueDate);
      return dueDate > now && dueDate <= oneDayFromNow;
    });
  }

  // Add method to update assignment notification flags
  async updateAssignmentNotification(id: string, flag: 'notified1Day' | 'notified2Hours' | 'notified5Minutes'): Promise<SharedAssignment | undefined> {
    const assignment: any = this.assignments.get(id);
    if (!assignment) return undefined;
    
    // Update the notification flag
    assignment[flag] = true;
    this.assignments.set(id, assignment);
    return assignment;
  }

  // Submission methods
  async getSubmission(id: string): Promise<SharedSubmission | undefined> {
    return this.submissions.get(id);
  }

  async getSubmissionByAssignmentAndStudent(
    assignmentId: string,
    studentId: string
  ): Promise<SubmissionWithDetails | undefined> {
    const submission = Array.from(this.submissions.values()).find((s: any) => 
      s.assignmentId === assignmentId && s.studentId === studentId
    );
    
    if (!submission) return undefined;
    
    const assignment = this.assignments.get(submission.assignmentId);
    const student = this.users.get(submission.studentId);
    const grade = Array.from(this.grades.values()).find((g: any) => 
      g.submissionId === submission.id
    );
    
    if (!assignment || !student) return undefined;
    
    return { 
      ...submission, 
      assignment, 
      student, 
      grade: grade || undefined 
    };
  }

  async getSubmissionsByAssignment(assignmentId: string): Promise<SubmissionWithDetails[]> {
    const submissions = Array.from(this.submissions.values()).filter((s: any) => 
      s.assignmentId === assignmentId
    );
    
    const submissionsWithDetails: SubmissionWithDetails[] = [];
    
    for (const submission of submissions) {
      const assignment = this.assignments.get(submission.assignmentId);
      const student = this.users.get(submission.studentId);
      const grade = Array.from(this.grades.values()).find((g: any) => 
        g.submissionId === submission.id
      );
      
      if (assignment && student) {
        submissionsWithDetails.push({ 
          ...submission, 
          assignment, 
          student, 
          grade: grade || undefined 
        });
      }
    }
    
    return submissionsWithDetails;
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<SharedSubmission> {
    const id = randomUUID();
    const submission: any = { ...insertSubmission, id, submittedAt: new Date() };
    this.submissions.set(id, submission);
    return submission;
  }

  // Grade methods
  async getGrade(id: string): Promise<SharedGrade | undefined> {
    return this.grades.get(id);
  }

  async getGradeBySubmission(submissionId: string): Promise<SharedGrade | undefined> {
    return Array.from(this.grades.values()).find((g: any) => g.submissionId === submissionId);
  }

  async createGrade(insertGrade: InsertGrade): Promise<SharedGrade> {
    const id = randomUUID();
    const grade: any = { ...insertGrade, id, gradedAt: new Date() };
    this.grades.set(id, grade);
    return grade;
  }

  async updateGrade(id: string, updateGrade: UpdateGrade): Promise<SharedGrade | undefined> {
    const grade: any = this.grades.get(id);
    if (!grade) return undefined;
    
    const updatedGrade = { ...grade, ...updateGrade };
    this.grades.set(id, updatedGrade);
    return updatedGrade;
  }

  // Stats methods
  async getTeacherStats(teacherId: string): Promise<{
    totalStudents: number;
    pendingSubmissions: number;
    totalAssignments: number;
  }> {
    // Get all courses for this teacher
    const courses = Array.from(this.courses.values()).filter((c: any) => c.teacherId === teacherId);
    const courseIds = courses.map((c: any) => c.id);
    
    // Count unique students across all courses
    const studentIds = new Set<string>();
    for (const courseId of courseIds) {
      const enrollments = Array.from(this.enrollments.values()).filter((e: any) => e.courseId === courseId);
      for (const enrollment of enrollments) {
        studentIds.add(enrollment.studentId);
      }
    }
    
    // Count assignments
    let totalAssignments = 0;
    for (const courseId of courseIds) {
      const assignments = Array.from(this.assignments.values()).filter((a: any) => a.courseId === courseId);
      totalAssignments += assignments.length;
    }
    
    // Count pending submissions (submissions without grades)
    let pendingSubmissions = 0;
    for (const courseId of courseIds) {
      const assignments = Array.from(this.assignments.values()).filter((a: any) => a.courseId === courseId);
      for (const assignment of assignments) {
        const submissions = Array.from(this.submissions.values()).filter((s: any) => s.assignmentId === assignment.id);
        for (const submission of submissions) {
          const grade = Array.from(this.grades.values()).find((g: any) => g.submissionId === submission.id);
          if (!grade) {
            pendingSubmissions++;
          }
        }
      }
    }
    
    return {
      totalStudents: studentIds.size,
      pendingSubmissions,
      totalAssignments
    };
  }
}

export interface IStorage {
  // User methods
  getUser(id: string): Promise<SharedUser | undefined>;
  getUserByEmail(email: string): Promise<SharedUser | undefined>;
  getAllUsers(): Promise<SharedUser[]>;
  createUser(user: InsertUser): Promise<SharedUser>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<SharedUser | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Course methods
  getCourse(id: string): Promise<SharedCourse | undefined>;
  getCourseWithTeacher(id: string): Promise<CourseWithTeacher | undefined>;
  getAllCourses(): Promise<CourseWithTeacher[]>;
  getCoursesByTeacher(teacherId: string): Promise<CourseWithTeacher[]>;
  createCourse(course: InsertCourse): Promise<SharedCourse>;
  updateCourse(id: string, course: Partial<InsertCourse>): Promise<SharedCourse | undefined>;

  // Enrollment methods
  getEnrollment(id: string): Promise<SharedEnrollment | undefined>;
  getEnrollmentsByCourse(courseId: string): Promise<SharedEnrollment[]>;
  getEnrollmentsByStudent(studentId: string): Promise<EnrollmentWithCourse[]>;
  getStudentsByCourse(courseId: string): Promise<SharedUser[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<SharedEnrollment>;
  isStudentEnrolled(studentId: string, courseId: string): Promise<boolean>;

  // Assignment methods
  getAssignment(id: string): Promise<SharedAssignment | undefined>;
  getAssignmentWithCourse(id: string): Promise<AssignmentWithCourse | undefined>;
  getAllAssignments(): Promise<SharedAssignment[]>;
  getAssignmentsByCourse(courseId: string): Promise<SharedAssignment[]>;
  getAssignmentsByStudent(studentId: string): Promise<AssignmentWithCourse[]>;
  createAssignment(assignment: InsertAssignment): Promise<SharedAssignment>;
  updateAssignment(id: string, assignment: UpdateAssignment): Promise<SharedAssignment | undefined>;
  getAssignmentsDueSoon(): Promise<SharedAssignment[]>;
  updateAssignmentNotification(id: string, flag: 'notified1Day' | 'notified2Hours' | 'notified5Minutes'): Promise<SharedAssignment | undefined>;

  // Submission methods
  getSubmission(id: string): Promise<SharedSubmission | undefined>;
  getSubmissionByAssignmentAndStudent(assignmentId: string, studentId: string): Promise<SubmissionWithDetails | undefined>;
  getSubmissionsByAssignment(assignmentId: string): Promise<SubmissionWithDetails[]>;
  createSubmission(submission: InsertSubmission): Promise<SharedSubmission>;

  // Grade methods
  getGrade(id: string): Promise<SharedGrade | undefined>;
  getGradeBySubmission(submissionId: string): Promise<SharedGrade | undefined>;
  createGrade(grade: InsertGrade): Promise<SharedGrade>;
  updateGrade(id: string, grade: UpdateGrade): Promise<SharedGrade | undefined>;

  // Stats methods
  getTeacherStats(teacherId: string): Promise<{
    totalStudents: number;
    pendingSubmissions: number;
    totalAssignments: number;
  }>;
  
  // Additional methods that are used in routes but missing from interface
  getTeacherStudents(teacherId: string): Promise<any[]>;
  createSyllabusItem(syllabusData: any): Promise<any>;
  getSyllabusItemsByCourse(courseId: string): Promise<any[]>;
  getSyllabusItemById(id: string): Promise<any>;
  getMessagesBetweenUsers(userId1: string, userId2: string): Promise<any[]>;
  getMessagesByCourse(courseId: string): Promise<any[]>;
  createMessage(messageData: any): Promise<any>;
}

export class MongoDBStorage implements IStorage {
  private fallbackStorage: MemStorage;
  private isConnected: boolean = false;

  constructor() {
    this.fallbackStorage = new MemStorage();
  }

  async connect(): Promise<void> {
    try {
      const mongoUri = process.env.MONGO_URI;
      console.log('MONGO_URI environment variable:', mongoUri ? 'Present' : 'Missing');
      
      if (mongoUri) {
        // Add connection options to handle SSL and other issues
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 10000, // Timeout after 10s
          socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        });
        console.log('Connected to MongoDB database');
        this.isConnected = true;
      } else {
        throw new Error('MONGO_URI not found in environment variables. Please set the MONGO_URI environment variable with your MongoDB connection string.');
      }
    } catch (error) {
      console.error('Failed to connect to MongoDB database:', error);
      // Don't throw the error, just log it and continue with in-memory storage
      console.log("Falling back to in-memory storage for development");
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
    }
  }

  // User methods
  async getUser(id: string): Promise<SharedUser | undefined> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const user = await MongoUser.findById(id).lean();
      if (user) {
        // Map _id to id to match SharedUser interface
        const { _id, ...rest } = user;
        return { id: _id, ...rest } as unknown as SharedUser;
      }
      return undefined;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getUser(id);
    }
  }

  async getUserByEmail(email: string): Promise<SharedUser | undefined> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const user = await MongoUser.findOne({ email }).lean();
      if (user) {
        // Map _id to id to match SharedUser interface
        const { _id, ...rest } = user;
        return { id: _id, ...rest } as unknown as SharedUser;
      }
      return undefined;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getUserByEmail(email);
    }
  }

  async getAllUsers(): Promise<SharedUser[]> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const users = await MongoUser.find({}).lean();
      return users.map(user => {
        const { _id, ...rest } = user;
        return { id: _id, ...rest } as unknown as SharedUser;
      });
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getAllUsers();
    }
  }

  async createUser(insertUser: InsertUser): Promise<SharedUser> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const userDoc = new MongoUser(insertUser);
      const savedUser = await userDoc.save();
      const userObject = savedUser.toObject();
      // Map _id to id to match SharedUser interface
      const { _id, ...rest } = userObject;
      return { id: _id, ...rest } as unknown as SharedUser;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.createUser(insertUser);
    }
  }

  async updateUser(id: string, updateUser: Partial<InsertUser>): Promise<SharedUser | undefined> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const updatedUser = await MongoUser.findByIdAndUpdate(
        id,
        updateUser,
        { new: true }
      ).lean();
      
      if (updatedUser) {
        // Map _id to id to match SharedUser interface
        const { _id, ...rest } = updatedUser;
        return { id: _id, ...rest } as unknown as SharedUser;
      }
      return undefined;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.updateUser(id, updateUser);
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const result = await MongoUser.findByIdAndDelete(id);
      return result != null;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.deleteUser(id);
    }
  }

  // Additional methods that are used in routes but not implemented yet
  // These will fall back to in-memory storage for now
  async getTeacherStudents(teacherId: string): Promise<any[]> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      // Placeholder implementation - would need actual implementation based on requirements
      return this.fallbackStorage.getTeacherStudents(teacherId);
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getTeacherStudents(teacherId);
    }
  }
  
  async createSyllabusItem(syllabusData: any): Promise<any> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const syllabusDoc = new MongoSyllabus(syllabusData);
      const savedSyllabus = await syllabusDoc.save();
      const syllabusObject = savedSyllabus.toObject();
      
      const { _id, ...rest } = syllabusObject;
      return { id: _id, ...rest };
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.createSyllabusItem(syllabusData);
    }
  }
  
  async getSyllabusItemsByCourse(courseId: string): Promise<any[]> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const syllabusItems = await MongoSyllabus.find({ courseId }).sort({ createdAt: -1 }).lean();
      
      return syllabusItems.map(item => {
        const { _id, ...rest } = item;
        return { id: _id, ...rest };
      });
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getSyllabusItemsByCourse(courseId);
    }
  }
  
  async getSyllabusItemById(id: string): Promise<any> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const syllabusItem = await MongoSyllabus.findById(id).lean();
      if (syllabusItem) {
        const { _id, ...rest } = syllabusItem;
        return { id: _id, ...rest };
      }
      return undefined;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getSyllabusItemById(id);
    }
  }
  
  async getMessagesBetweenUsers(userId1: string, userId2: string): Promise<any[]> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const messages = await MongoMessage.find({
        $or: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 }
        ]
      }).sort({ timestamp: 1 }).lean();
      
      return messages.map(message => {
        const { _id, ...rest } = message;
        return { id: _id, ...rest };
      });
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getMessagesBetweenUsers(userId1, userId2);
    }
  }
  
  async getMessagesByCourse(courseId: string): Promise<any[]> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const messages = await MongoMessage.find({ courseId }).sort({ timestamp: 1 }).lean();
      
      return messages.map(message => {
        const { _id, ...rest } = message;
        return { id: _id, ...rest };
      });
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getMessagesByCourse(courseId);
    }
  }
  
  async createMessage(messageData: any): Promise<any> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const messageDoc = new MongoMessage(messageData);
      const savedMessage = await messageDoc.save();
      const messageObject = savedMessage.toObject();
      
      const { _id, ...rest } = messageObject;
      return { id: _id, ...rest };
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.createMessage(messageData);
    }
  }

  // Course methods
  async getCourse(id: string): Promise<SharedCourse | undefined> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const course = await MongoCourse.findById(id).lean();
      if (course) {
        // Map _id to id to match SharedCourse interface
        const { _id, ...rest } = course;
        return { id: _id, ...rest } as unknown as SharedCourse;
      }
      return undefined;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getCourse(id);
    }
  }

  async getCourseWithTeacher(id: string): Promise<CourseWithTeacher | undefined> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const course = await MongoCourse.findById(id).lean();
      if (!course) return undefined;

      const teacher = await MongoUser.findById(course.teacherId).lean();
      if (!teacher) return undefined;

      // Map _id to id to match interfaces
      const { _id: course_id, ...courseRest } = course;
      const { _id: teacher_id, ...teacherRest } = teacher;
      
      return {
        id: course_id,
        ...courseRest,
        teacher: {
          id: teacher_id,
          ...teacherRest
        }
      } as unknown as CourseWithTeacher;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getCourseWithTeacher(id);
    }
  }

  async getAllCourses(): Promise<CourseWithTeacher[]> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const courses = await MongoCourse.find().lean();
      const coursesWithTeachers: CourseWithTeacher[] = [];

      for (const course of courses) {
        const teacher = await MongoUser.findById(course.teacherId).lean();
        if (teacher) {
          // Map _id to id to match interfaces
          const { _id: course_id, ...courseRest } = course;
          const { _id: teacher_id, ...teacherRest } = teacher;
          
          coursesWithTeachers.push({
            id: course_id,
            ...courseRest,
            teacher: {
              id: teacher_id,
              ...teacherRest
            }
          } as unknown as CourseWithTeacher);
        }
      }

      return coursesWithTeachers;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getAllCourses();
    }
  }

  async getCoursesByTeacher(teacherId: string): Promise<CourseWithTeacher[]> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const teacher = await MongoUser.findById(teacherId).lean();
      if (!teacher) return [];

      const courses = await MongoCourse.find({ teacherId }).lean();
      
      // Map _id to id to match interfaces
      const { _id: teacher_id, ...teacherRest } = teacher;
      const teacherWithId = { id: teacher_id, ...teacherRest } as unknown as SharedUser;
      
      return courses.map(course => {
        const { _id: course_id, ...courseRest } = course;
        return {
          id: course_id,
          ...courseRest,
          teacher: teacherWithId
        } as unknown as CourseWithTeacher;
      });
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getCoursesByTeacher(teacherId);
    }
  }

  async createCourse(insertCourse: InsertCourse): Promise<SharedCourse> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const courseDoc = new MongoCourse(insertCourse);
      const savedCourse = await courseDoc.save();
      const courseObject = savedCourse.toObject();
      
      const teacher = await MongoUser.findById(insertCourse.teacherId).lean();
      if (teacher) {
        // Map _id to id to match interfaces
        const { _id: course_id, ...courseRest } = courseObject;
        const { _id: teacher_id, ...teacherRest } = teacher;
        
        return {
          id: course_id,
          ...courseRest,
          teacher: {
            id: teacher_id,
            ...teacherRest
          }
        } as unknown as SharedCourse;
      }
      
      // If no teacher found, just return course without teacher
      const { _id: course_id, ...courseRest } = courseObject;
      return { id: course_id, ...courseRest } as unknown as SharedCourse;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.createCourse(insertCourse);
    }
  }

  // Add update course method
  async updateCourse(id: string, updateCourse: Partial<InsertCourse>): Promise<SharedCourse | undefined> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const updatedCourse = await MongoCourse.findByIdAndUpdate(
        id,
        updateCourse,
        { new: true }
      ).lean();
      
      if (updatedCourse) {
        // Map _id to id to match SharedCourse interface
        const { _id, ...rest } = updatedCourse;
        return { id: _id, ...rest } as unknown as SharedCourse;
      }
      return undefined;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.updateCourse(id, updateCourse);
    }
  }

  // Enrollment methods
  async getEnrollment(id: string): Promise<SharedEnrollment | undefined> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const enrollment = await MongoEnrollment.findById(id).lean();
      if (enrollment) {
        // Map _id to id to match SharedEnrollment interface
        const { _id, ...rest } = enrollment;
        return { id: _id, ...rest } as unknown as SharedEnrollment;
      }
      return undefined;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getEnrollment(id);
    }
  }

  async getEnrollmentsByCourse(courseId: string): Promise<SharedEnrollment[]> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const enrollments = await MongoEnrollment.find({ courseId }).lean();
      return enrollments.map(enrollment => {
        const { _id, ...rest } = enrollment;
        return { id: _id, ...rest } as unknown as SharedEnrollment;
      });
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getEnrollmentsByCourse(courseId);
    }
  }

  async getEnrollmentsByStudent(studentId: string): Promise<EnrollmentWithCourse[]> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const enrollments = await MongoEnrollment.find({ studentId }).lean();
      const enrollmentsWithCourses: EnrollmentWithCourse[] = [];

      for (const enrollment of enrollments) {
        const course = await this.getCourseWithTeacher(enrollment.courseId);
        if (course) {
          // Map _id to id to match EnrollmentWithCourse interface
          const { _id, ...rest } = enrollment;
          enrollmentsWithCourses.push({
            id: _id,
            ...rest,
            course
          } as unknown as EnrollmentWithCourse);
        }
      }

      return enrollmentsWithCourses;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getEnrollmentsByStudent(studentId);
    }
  }

  async getStudentsByCourse(courseId: string): Promise<SharedUser[]> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const enrollments = await MongoEnrollment.find({ courseId }).lean();
      const students: SharedUser[] = [];

      for (const enrollment of enrollments) {
        const student = await this.getUser(enrollment.studentId);
        if (student) {
          students.push(student);
        }
      }

      return students;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getStudentsByCourse(courseId);
    }
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<SharedEnrollment> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      // Check if already enrolled
      const existing = await MongoEnrollment.findOne({
        studentId: insertEnrollment.studentId,
        courseId: insertEnrollment.courseId
      });
      
      if (existing) {
        throw new Error('Already enrolled in this course');
      }
      
      const enrollmentDoc = new MongoEnrollment(insertEnrollment);
      const savedEnrollment = await enrollmentDoc.save();
      const enrollmentObject = savedEnrollment.toObject();
      // Map _id to id to match SharedEnrollment interface
      const { _id, ...rest } = enrollmentObject;
      return { id: _id, ...rest } as unknown as SharedEnrollment;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.createEnrollment(insertEnrollment);
    }
  }

  async isStudentEnrolled(studentId: string, courseId: string): Promise<boolean> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const enrollment = await MongoEnrollment.findOne({ studentId, courseId });
      return !!enrollment;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.isStudentEnrolled(studentId, courseId);
    }
  }

  // Assignment methods
  async getAssignment(id: string): Promise<SharedAssignment | undefined> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const assignment = await MongoAssignment.findById(id).lean();
      if (assignment) {
        // Map _id to id to match SharedAssignment interface
        const { _id, ...rest } = assignment;
        return { id: _id, ...rest } as unknown as SharedAssignment;
      }
      return undefined;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getAssignment(id);
    }
  }

  async getAllAssignments(): Promise<SharedAssignment[]> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const assignments = await MongoAssignment.find({}).lean();
      return assignments.map(assignment => {
        const { _id, ...rest } = assignment;
        return { id: _id, ...rest } as unknown as SharedAssignment;
      });
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getAllAssignments();
    }
  }

  async getAssignmentWithCourse(id: string): Promise<AssignmentWithCourse | undefined> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const assignment = await MongoAssignment.findById(id).lean();
      if (!assignment) return undefined;

      const course = await this.getCourse(assignment.courseId);
      if (!course) return undefined;

      // Map _id to id to match AssignmentWithCourse interface
      const { _id, ...rest } = assignment;
      return {
        id: _id,
        ...rest,
        course
      } as unknown as AssignmentWithCourse;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getAssignmentWithCourse(id);
    }
  }

  async getAssignmentsByCourse(courseId: string): Promise<SharedAssignment[]> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const assignments = await MongoAssignment.find({ courseId }).lean();
      return assignments.map(assignment => {
        const { _id, ...rest } = assignment;
        return { id: _id, ...rest } as unknown as SharedAssignment;
      });
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getAssignmentsByCourse(courseId);
    }
  }

  async getAssignmentsByStudent(studentId: string): Promise<AssignmentWithCourse[]> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const enrollments = await this.getEnrollmentsByStudent(studentId);
      const courseIds = enrollments.map(e => e.courseId);

      if (courseIds.length === 0) return [];

      const assignments = await MongoAssignment.find({ courseId: { $in: courseIds } }).lean();
      const assignmentsWithCourses: AssignmentWithCourse[] = [];

      for (const assignment of assignments) {
        const course = await this.getCourse(assignment.courseId);
        if (course) {
          // Map _id to id to match AssignmentWithCourse interface
          const { _id, ...rest } = assignment;
          assignmentsWithCourses.push({
            id: _id,
            ...rest,
            course
          } as unknown as AssignmentWithCourse);
        }
      }

      return assignmentsWithCourses;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getAssignmentsByStudent(studentId);
    }
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<SharedAssignment> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const assignmentDoc = new MongoAssignment({
        ...insertAssignment,
        dueDate: new Date(insertAssignment.dueDate)
      });
      const savedAssignment = await assignmentDoc.save();
      const assignmentObject = savedAssignment.toObject();
      // Map _id to id to match SharedAssignment interface
      const { _id, ...rest } = assignmentObject;
      return { id: _id, ...rest } as unknown as SharedAssignment;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.createAssignment(insertAssignment);
    }
  }

  // Add update assignment method
  async updateAssignment(id: string, updateAssignment: UpdateAssignment): Promise<SharedAssignment | undefined> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const updatedAssignment = await MongoAssignment.findByIdAndUpdate(
        id,
        { 
          ...updateAssignment,
          dueDate: updateAssignment.dueDate ? new Date(updateAssignment.dueDate) : undefined
        },
        { new: true }
      ).lean();
      
      if (updatedAssignment) {
        // Map _id to id to match SharedAssignment interface
        const { _id, ...rest } = updatedAssignment;
        return { id: _id, ...rest } as unknown as SharedAssignment;
      }
      return undefined;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.updateAssignment(id, updateAssignment);
    }
  }

  // Add method to get assignments due soon for notifications
  async getAssignmentsDueSoon(): Promise<SharedAssignment[]> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const now = new Date();
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const assignments = await MongoAssignment.find({
        dueDate: { $gt: now, $lte: oneDayFromNow }
      }).lean();
      
      return assignments.map(assignment => {
        const { _id, ...rest } = assignment;
        return { id: _id, ...rest } as unknown as SharedAssignment;
      });
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getAssignmentsDueSoon();
    }
  }

  // Add method to update assignment notification flags
  async updateAssignmentNotification(id: string, flag: 'notified1Day' | 'notified2Hours' | 'notified5Minutes'): Promise<SharedAssignment | undefined> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const updateData: any = {};
      updateData[flag] = true;
      
      const updatedAssignment = await MongoAssignment.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).lean();
      
      if (updatedAssignment) {
        // Map _id to id to match SharedAssignment interface
        const { _id, ...rest } = updatedAssignment;
        return { id: _id, ...rest } as unknown as SharedAssignment;
      }
      return undefined;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.updateAssignmentNotification(id, flag);
    }
  }

  // Submission methods
  async getSubmission(id: string): Promise<SharedSubmission | undefined> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const submission = await MongoSubmission.findById(id).lean();
      if (submission) {
        // Map _id to id to match SharedSubmission interface
        const { _id, ...rest } = submission;
        return { id: _id, ...rest } as unknown as SharedSubmission;
      }
      return undefined;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getSubmission(id);
    }
  }

  async getSubmissionByAssignmentAndStudent(
    assignmentId: string,
    studentId: string
  ): Promise<SubmissionWithDetails | undefined> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const submission = await MongoSubmission.findOne({ assignmentId, studentId }).lean();
      
      if (!submission) return undefined;

      const assignment = await this.getAssignment(submission.assignmentId);
      const student = await this.getUser(submission.studentId);
      const grade = await this.getGradeBySubmission(submission._id);

      if (!assignment || !student) return undefined;

      // Map _id to id to match SubmissionWithDetails interface
      const { _id, ...rest } = submission;
      return {
        id: _id,
        ...rest,
        assignment,
        student,
        grade
      } as unknown as SubmissionWithDetails;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getSubmissionByAssignmentAndStudent(assignmentId, studentId);
    }
  }

  async getSubmissionsByAssignment(assignmentId: string): Promise<SubmissionWithDetails[]> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const submissions = await MongoSubmission.find({ assignmentId }).lean();
      const submissionsWithDetails: SubmissionWithDetails[] = [];

      for (const submission of submissions) {
        const assignment = await this.getAssignment(submission.assignmentId);
        const student = await this.getUser(submission.studentId);
        const grade = await this.getGradeBySubmission(submission._id);

        if (assignment && student) {
          // Map _id to id to match SubmissionWithDetails interface
          const { _id, ...rest } = submission;
          submissionsWithDetails.push({
            id: _id,
            ...rest,
            assignment,
            student,
            grade
          } as unknown as SubmissionWithDetails);
        }
      }

      return submissionsWithDetails;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getSubmissionsByAssignment(assignmentId);
    }
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<SharedSubmission> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      // Check if already submitted
      const existing = await MongoSubmission.findOne({
        assignmentId: insertSubmission.assignmentId,
        studentId: insertSubmission.studentId
      });
      
      if (existing) {
        throw new Error('Assignment already submitted');
      }
      
      const submissionDoc = new MongoSubmission(insertSubmission);
      const savedSubmission = await submissionDoc.save();
      const submissionObject = savedSubmission.toObject();
      // Map _id to id to match SharedSubmission interface
      const { _id, ...rest } = submissionObject;
      return { id: _id, ...rest } as unknown as SharedSubmission;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.createSubmission(insertSubmission);
    }
  }

  // Grade methods
  async getGrade(id: string): Promise<SharedGrade | undefined> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const grade = await MongoGrade.findById(id).lean();
      if (grade) {
        // Map _id to id to match SharedGrade interface
        const { _id, ...rest } = grade;
        return { id: _id, ...rest } as unknown as SharedGrade;
      }
      return undefined;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getGrade(id);
    }
  }

  async getGradeBySubmission(submissionId: string): Promise<SharedGrade | undefined> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const grade = await MongoGrade.findOne({ submissionId }).lean();
      if (grade) {
        // Map _id to id to match SharedGrade interface
        const { _id, ...rest } = grade;
        return { id: _id, ...rest } as unknown as SharedGrade;
      }
      return undefined;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getGradeBySubmission(submissionId);
    }
  }

  async createGrade(insertGrade: InsertGrade): Promise<SharedGrade> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      // Check if already graded
      const existing = await MongoGrade.findOne({ submissionId: insertGrade.submissionId });
      if (existing) {
        throw new Error('Submission already graded');
      }
      
      const gradeDoc = new MongoGrade(insertGrade);
      const savedGrade = await gradeDoc.save();
      const gradeObject = savedGrade.toObject();
      // Map _id to id to match SharedGrade interface
      const { _id, ...rest } = gradeObject;
      return { id: _id, ...rest } as unknown as SharedGrade;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.createGrade(insertGrade);
    }
  }

  // Add update grade method
  async updateGrade(id: string, updateGrade: UpdateGrade): Promise<SharedGrade | undefined> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const updatedGrade = await MongoGrade.findByIdAndUpdate(
        id,
        updateGrade,
        { new: true }
      ).lean();
      
      if (updatedGrade) {
        // Map _id to id to match SharedGrade interface
        const { _id, ...rest } = updatedGrade;
        return { id: _id, ...rest } as unknown as SharedGrade;
      }
      return undefined;
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.updateGrade(id, updateGrade);
    }
  }

  // Stats methods
  async getTeacherStats(teacherId: string): Promise<{
    totalStudents: number;
    pendingSubmissions: number;
    totalAssignments: number;
  }> {
    try {
      if (!this.isConnected) throw new Error('Database not connected');
      const courses = await MongoCourse.find({ teacherId }).lean();
      const courseIds = courses.map(c => c._id.toString());

      if (courseIds.length === 0) {
        return {
          totalStudents: 0,
          pendingSubmissions: 0,
          totalAssignments: 0
        };
      }

      const enrollments = await MongoEnrollment.find({ courseId: { $in: courseIds } }).lean();
      
      // Get unique student IDs
      const studentIdSet = new Set(enrollments.map(e => e.studentId));
      const uniqueStudentIds = Array.from(studentIdSet);

      const assignments = await MongoAssignment.find({ courseId: { $in: courseIds } }).lean();
      const assignmentIds = assignments.map(a => a._id.toString());

      if (assignmentIds.length === 0) {
        return {
          totalStudents: uniqueStudentIds.length,
          pendingSubmissions: 0,
          totalAssignments: assignments.length
        };
      }

      const submissions = await MongoSubmission.find({ assignmentId: { $in: assignmentIds } }).lean();
      
      const submissionIds = submissions.map(s => s._id.toString());
      if (submissionIds.length === 0) {
        return {
          totalStudents: uniqueStudentIds.length,
          pendingSubmissions: 0,
          totalAssignments: assignments.length
        };
      }

      const grades = await MongoGrade.find().lean();
      const gradedSubmissionIds = new Set(grades.map(g => g.submissionId));
      
      let pendingSubmissions = 0;
      for (const submission of submissions) {
        if (!gradedSubmissionIds.has(submission._id.toString())) {
          pendingSubmissions++;
        }
      }

      return {
        totalStudents: uniqueStudentIds.length,
        pendingSubmissions,
        totalAssignments: assignments.length
      };
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory storage:', error);
      return this.fallbackStorage.getTeacherStats(teacherId);
    }
  }
}

let storageInstance: MongoDBStorage | null = null;

export function getStorage(): MongoDBStorage {
  if (!storageInstance) {
    storageInstance = new MongoDBStorage();
  }
  return storageInstance;
}

// For backward compatibility, we can still export the storage instance
// but it will be initialized lazily
export const storage = {
  connect: async () => {
    return getStorage().connect();
  },
  disconnect: async () => {
    return getStorage().disconnect();
  },
  // User methods
  getUser: async (id: string) => {
    return getStorage().getUser(id);
  },
  getUserByEmail: async (email: string) => {
    return getStorage().getUserByEmail(email);
  },
  getAllUsers: async () => {
    return getStorage().getAllUsers();
  },
  createUser: async (user: InsertUser) => {
    return getStorage().createUser(user);
  },
  updateUser: async (id: string, user: Partial<InsertUser>) => {
    return getStorage().updateUser(id, user);
  },
  deleteUser: async (id: string) => {
    return getStorage().deleteUser(id);
  },
  // Course methods
  getCourse: async (id: string) => {
    return getStorage().getCourse(id);
  },
  getCourseWithTeacher: async (id: string) => {
    return getStorage().getCourseWithTeacher(id);
  },
  getAllCourses: async () => {
    return getStorage().getAllCourses();
  },
  getCoursesByTeacher: async (teacherId: string) => {
    return getStorage().getCoursesByTeacher(teacherId);
  },
  createCourse: async (course: InsertCourse) => {
    return getStorage().createCourse(course);
  },
  updateCourse: async (id: string, course: Partial<InsertCourse>) => {
    return getStorage().updateCourse(id, course);
  },
  // Enrollment methods
  getEnrollment: async (id: string) => {
    return getStorage().getEnrollment(id);
  },
  getEnrollmentsByCourse: async (courseId: string) => {
    return getStorage().getEnrollmentsByCourse(courseId);
  },
  getEnrollmentsByStudent: async (studentId: string) => {
    return getStorage().getEnrollmentsByStudent(studentId);
  },
  getStudentsByCourse: async (courseId: string) => {
    return getStorage().getStudentsByCourse(courseId);
  },
  createEnrollment: async (enrollment: InsertEnrollment) => {
    return getStorage().createEnrollment(enrollment);
  },
  isStudentEnrolled: async (studentId: string, courseId: string) => {
    return getStorage().isStudentEnrolled(studentId, courseId);
  },
  // Assignment methods
  getAssignment: async (id: string) => {
    return getStorage().getAssignment(id);
  },
  getAssignmentWithCourse: async (id: string) => {
    return getStorage().getAssignmentWithCourse(id);
  },
  getAllAssignments: async () => {
    return getStorage().getAllAssignments();
  },
  getAssignmentsByCourse: async (courseId: string) => {
    return getStorage().getAssignmentsByCourse(courseId);
  },
  getAssignmentsByStudent: async (studentId: string) => {
    return getStorage().getAssignmentsByStudent(studentId);
  },
  createAssignment: async (assignment: InsertAssignment) => {
    return getStorage().createAssignment(assignment);
  },
  updateAssignment: async (id: string, assignment: UpdateAssignment) => {
    return getStorage().updateAssignment(id, assignment);
  },
  getAssignmentsDueSoon: async () => {
    return getStorage().getAssignmentsDueSoon();
  },
  updateAssignmentNotification: async (id: string, flag: 'notified1Day' | 'notified2Hours' | 'notified5Minutes') => {
    return getStorage().updateAssignmentNotification(id, flag);
  },
  // Submission methods
  getSubmission: async (id: string) => {
    return getStorage().getSubmission(id);
  },
  getSubmissionByAssignmentAndStudent: async (assignmentId: string, studentId: string) => {
    return getStorage().getSubmissionByAssignmentAndStudent(assignmentId, studentId);
  },
  getSubmissionsByAssignment: async (assignmentId: string) => {
    return getStorage().getSubmissionsByAssignment(assignmentId);
  },
  createSubmission: async (submission: InsertSubmission) => {
    return getStorage().createSubmission(submission);
  },
  // Grade methods
  getGrade: async (id: string) => {
    return getStorage().getGrade(id);
  },
  getGradeBySubmission: async (submissionId: string) => {
    return getStorage().getGradeBySubmission(submissionId);
  },
  createGrade: async (grade: InsertGrade) => {
    return getStorage().createGrade(grade);
  },
  updateGrade: async (id: string, grade: UpdateGrade) => {
    return getStorage().updateGrade(id, grade);
  },
  // Stats methods
  getTeacherStats: async (teacherId: string) => {
    return getStorage().getTeacherStats(teacherId);
  },
  // Additional methods that are used in routes but missing from export
  getTeacherStudents: async (teacherId: string) => {
    return getStorage().getTeacherStudents(teacherId);
  },
  createSyllabusItem: async (syllabusData: any) => {
    return getStorage().createSyllabusItem(syllabusData);
  },
  getSyllabusItemsByCourse: async (courseId: string) => {
    return getStorage().getSyllabusItemsByCourse(courseId);
  },
  getSyllabusItemById: async (id: string) => {
    return getStorage().getSyllabusItemById(id);
  },
  getMessagesBetweenUsers: async (userId1: string, userId2: string) => {
    return getStorage().getMessagesBetweenUsers(userId1, userId2);
  },
  getMessagesByCourse: async (courseId: string) => {
    return getStorage().getMessagesByCourse(courseId);
  },
  createMessage: async (messageData: any) => {
    return getStorage().createMessage(messageData);
  }
};
