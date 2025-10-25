import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import fileUpload from "express-fileupload";
import MongoStore from 'connect-mongo';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import dotenv from "dotenv";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import type { Message } from "@shared/schema";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(import.meta.dirname, '..', '.env') });

const app = express();
app.set('trust proxy', 1); // Required for Railway deployment

// Store connected clients with user info
const clients = new Map<string, { socket: any, userId: string, courseId: string }>();

// CORS middleware - Updated to properly handle credentials
app.use((req, res, next) => {
  // Allow requests from common Vite development ports
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5179',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5176',
    'http://127.0.0.1:5177',
    'http://127.0.0.1:5178',
    'http://127.0.0.1:5179'
  ];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'production') {
    // In production, allow the frontend origin
    res.header('Access-Control-Allow-Origin', origin || '');
  } else {
    // Fallback to the current origin or first allowed origin for development
    res.header('Access-Control-Allow-Origin', origin || 'http://localhost:5174');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// File upload middleware
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  abortOnLimit: true,
  responseOnLimit: "File size limit has been reached"
}));

// Session middleware with MongoDB store - Updated configuration
const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || "hackathon-lms-secret-key",
  resave: false,
  saveUninitialized: false,
  name: 'connect.sid', // Explicitly set session cookie name
  cookie: {
    httpOnly: true,
    secure: false, // Only secure in production
    sameSite: 'lax', // Always use 'lax' for development
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    path: '/',
  },
};

// Use MongoDB session store when MONGO_URI is available (both dev and prod)
if (process.env.MONGO_URI) {
  console.log('Using MongoDB session store');
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 // 14 days
  });
} else {
  console.log('Using MemoryStore (MONGO_URI not found)');
}

// Log session configuration for debugging
console.log('Session config:', {
  secret: '****',
  resave: sessionConfig.resave,
  saveUninitialized: sessionConfig.saveUninitialized,
  name: sessionConfig.name,
  cookie: sessionConfig.cookie
});

app.use(session(sessionConfig));

// Debug middleware to log session info
app.use((req, res, next) => {
  console.log('Session debug - Request URL:', req.url);
  console.log('Session debug - Session ID:', req.sessionID);
  console.log('Session debug - Session data:', req.session);
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Connect to MongoDB and start server
async function startServer() {
  try {
    await storage.connect();
    log("MongoDB connected successfully");
  } catch (error) {
    log(`Failed to connect to MongoDB: ${error}`);
    log("Falling back to in-memory storage for development");
    // The application will continue to use the in-memory storage
    // In a production environment, you would want to exit here
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3002', 10); // Changed to 3002 to avoid conflicts
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup Socket.IO server
  const io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:5178",
        "http://localhost:5179",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "http://127.0.0.1:5177",
        "http://127.0.0.1:5178",
        "http://127.0.0.1:5179"
      ],
      methods: ["GET", "POST"],
      credentials: true
    }
  });
  
  // Handle Socket.IO connections
  io.on('connection', (socket: any) => {
    console.log('Socket.IO connection established', socket.id);
    let userId: string | undefined;
    let courseId: string | undefined;
    const sessionId: string | undefined = socket.handshake.headers.cookie?.split('; ').find((row: string) => row.startsWith('connect.sid='))
      ?.split('=')[1];
    
    // Handle incoming messages
    socket.on('message', async (data: any) => {
      try {
        // Handle user registration
        if (data.type === 'REGISTER_USER') {
          userId = data.userId;
          courseId = data.courseId;
          
          // Store the connection with user info
          if (sessionId && userId && courseId) {
            clients.set(sessionId, { socket, userId, courseId });
          }
          return;
        }
        
        // Handle new notifications
        if (data.type === 'NEW_NOTIFICATION') {
          // Broadcast notification to relevant users
          clients.forEach((clientInfo: { socket: any, userId: string, courseId: string }) => {
            if (clientInfo.userId !== userId && clientInfo.socket.readyState === socket.OPEN) {
              clientInfo.socket.emit('new_notification', data.notification);
            }
          });
          return;
        }
        
        // Broadcast message to relevant users
        if (data.type === 'send_message') {
          // Save message to database
          const messageData: any = {
            senderId: data.senderId,
            courseId: data.courseId,
            content: data.content,
            timestamp: new Date()
          };
          
          const newMessage = await storage.createMessage(messageData);
          
          // Add sender name to message
          const sender = await storage.getUser(data.senderId);
          const messageWithSender = {
            ...newMessage,
            senderName: sender?.name || 'Unknown'
          };
          
          // Broadcast to all clients in the same course
          clients.forEach((clientInfo: { socket: any, userId: string, courseId: string }) => {
            if (clientInfo.courseId === data.courseId && clientInfo.socket.readyState === socket.OPEN) {
              clientInfo.socket.emit('receive_message', messageWithSender);
              
              // Send notification for new message
              if (clientInfo.userId !== data.senderId) {
                clientInfo.socket.emit('new_notification', {
                  id: `msg-${newMessage.id}`,
                  type: 'chat_message',
                  title: 'New Message',
                  message: `New message from ${sender?.name || 'Unknown'}: ${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}`,
                  timestamp: new Date().toISOString(),
                  read: false,
                  relatedId: data.courseId
                });
              }
            }
          });
        }
        
        // Handle private messages
        if (data.type === 'send_private_message') {
          // Save private message to database
          const messageData: any = {
            senderId: data.senderId,
            receiverId: data.receiverId,
            content: data.content,
            timestamp: new Date()
          };
          
          const newMessage = await storage.createMessage(messageData);
          
          // Add sender name to message
          const sender = await storage.getUser(data.senderId);
          const messageWithSender = {
            ...newMessage,
            senderName: sender?.name || 'Unknown'
          };
          
          // Send to sender
          socket.emit('private_message_sent', messageWithSender);
          
          // Send to receiver
          clients.forEach((clientInfo: { socket: any, userId: string, courseId: string }) => {
            if (clientInfo.userId === data.receiverId && clientInfo.socket.readyState === socket.OPEN) {
              clientInfo.socket.emit('receive_private_message', messageWithSender);
              
              // Send notification for new private message
              clientInfo.socket.emit('new_notification', {
                id: `priv-msg-${newMessage.id}`,
                type: 'chat_message',
                title: 'New Private Message',
                message: `New private message from ${sender?.name || 'Unknown'}: ${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}`,
                timestamp: new Date().toISOString(),
                read: false,
                relatedId: data.senderId
              });
            }
          });
        }
        
        // Handle call invitations
        if (data.type === 'CALL_INVITE') {
          // Find the target user's WebSocket connection
          let targetClient: { socket: any, userId: string, courseId: string } | undefined;
          clients.forEach((clientInfo: { socket: any, userId: string, courseId: string }) => {
            if (clientInfo.userId === data.calleeId) {
              targetClient = clientInfo;
            }
          });
          
          if (targetClient && targetClient.socket.readyState === socket.OPEN) {
            // Get caller name
            const caller = await storage.getUser(data.callerId);
            targetClient.socket.emit('CALL_INVITE', {
              callerId: data.callerId,
              calleeId: data.calleeId,
              callType: data.callType,
              callerName: caller?.name || 'Unknown'
            });
            
            // Send notification for call invite
            targetClient.socket.emit('new_notification', {
              id: `call-${Date.now()}`,
              type: 'call_invite',
              title: `${data.callType === 'video' ? 'Video' : 'Voice'} Call`,
              message: `Incoming call from ${caller?.name || 'Unknown'}`,
              timestamp: new Date().toISOString(),
              read: false,
              relatedId: data.callerId
            });
          }
        }
        
        // Handle call acceptance
        if (data.type === 'CALL_ACCEPTED') {
          // Find the caller's WebSocket connection
          let callerClient: { socket: any, userId: string, courseId: string } | undefined;
          clients.forEach((clientInfo: { socket: any, userId: string, courseId: string }) => {
            if (clientInfo.userId === data.callerId) {
              callerClient = clientInfo;
            }
          });
          
          if (callerClient && callerClient.socket.readyState === socket.OPEN) {
            callerClient.socket.emit('CALL_ACCEPTED', {
              callerId: data.callerId,
              calleeId: data.calleeId
            });
          }
        }
        
        // Handle call decline
        if (data.type === 'CALL_DECLINED') {
          // Find the caller's WebSocket connection
          let callerClient: { socket: any, userId: string, courseId: string } | undefined;
          clients.forEach((clientInfo: { socket: any, userId: string, courseId: string }) => {
            if (clientInfo.userId === data.callerId) {
              callerClient = clientInfo;
            }
          });
          
          if (callerClient && callerClient.socket.readyState === socket.OPEN) {
            callerClient.socket.emit('CALL_DECLINED', {
              callerId: data.callerId,
              calleeId: data.calleeId
            });
          }
        }
        
        // Handle call ended
        if (data.type === 'CALL_ENDED') {
          // Find the target user's WebSocket connection
          let targetClient: { socket: any, userId: string, courseId: string } | undefined;
          clients.forEach((clientInfo: { socket: any, userId: string, courseId: string }) => {
            if (clientInfo.userId === data.targetUserId) {
              targetClient = clientInfo;
            }
          });
          
          if (targetClient && targetClient.socket.readyState === socket.OPEN) {
            targetClient.socket.emit('CALL_ENDED');
          }
        }
        
        // Handle ICE candidates for WebRTC
        if (data.type === 'ICE_CANDIDATE') {
          // Find the target user's WebSocket connection
          let targetClient: { socket: any, userId: string, courseId: string } | undefined;
          clients.forEach((clientInfo: { socket: any, userId: string, courseId: string }) => {
            if (clientInfo.userId === data.targetUserId) {
              targetClient = clientInfo;
            }
          });
          
          if (targetClient && targetClient.socket.readyState === socket.OPEN) {
            targetClient.socket.emit('ICE_CANDIDATE', {
              candidate: data.candidate,
              callerId: userId
            });
          }
        }
        
        // Handle call offer for WebRTC
        if (data.type === 'CALL_OFFER') {
          // Find the target user's WebSocket connection
          let targetClient: { socket: any, userId: string, courseId: string } | undefined;
          clients.forEach((clientInfo: { socket: any, userId: string, courseId: string }) => {
            if (clientInfo.userId === data.targetUserId) {
              targetClient = clientInfo;
            }
          });
          
          if (targetClient && targetClient.socket.readyState === socket.OPEN) {
            targetClient.socket.emit('CALL_OFFER', {
              offer: data.offer,
              callerId: userId
            });
          }
        }
      } catch (error) {
        console.error("Error handling message:", error);
        socket.emit('error', {
          message: 'Failed to process message'
        });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Socket.IO connection closed', socket.id);
      // Remove client from clients map
      clients.forEach((clientInfo: { socket: any, userId: string, courseId: string }, key: string) => {
        if (clientInfo.socket === socket) {
          clients.delete(key);
        }
      });
    });
  });
  
  // Handle server errors
  httpServer.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use. Trying ${port + 1}...`);
      setTimeout(() => {
        httpServer.listen(port + 1);
      }, 1000);
    }
  });
  
  httpServer.listen(port, () => {
    log(`serving on port ${port}`);
  });
  
  // Start background job for assignment notifications
  startAssignmentNotificationJob();
  
  return httpServer;
}

// Function to start assignment notification job
function startAssignmentNotificationJob() {
  // Background job to send assignment notifications
  setInterval(async () => {
    try {
      // Get all assignments
      const assignments = await storage.getAllAssignments();
      const now = new Date().getTime();
      
      for (const assignment of assignments) {
        const dueTime = new Date(assignment.dueDate).getTime();
        const timeDiff = dueTime - now;
        
        // Check for 1 day notification
        if (!assignment.notified1Day && timeDiff <= 25 * 60 * 60 * 1000 && timeDiff > 24 * 60 * 60 * 1000) {
          await sendAssignmentNotification(assignment, '1 day');
          await storage.updateAssignmentNotification(assignment.id, 'notified1Day');
        }
        
        // Check for 2 hours notification
        if (!assignment.notified2Hours && timeDiff <= 2 * 60 * 60 * 1000 && timeDiff > 1 * 60 * 60 * 1000) {
          await sendAssignmentNotification(assignment, '2 hours');
          await storage.updateAssignmentNotification(assignment.id, 'notified2Hours');
        }
        
        // Check for 5 minutes notification
        if (!assignment.notified5Minutes && timeDiff <= 5 * 60 * 1000 && timeDiff > 4 * 60 * 1000) {
          await sendAssignmentNotification(assignment, '5 minutes');
          await storage.updateAssignmentNotification(assignment.id, 'notified5Minutes');
        }
      }
    } catch (error) {
      console.error('Error in assignment notification job:', error);
    }
  }, 60 * 1000); // Every minute
}

// Background job to send syllabus notifications
setInterval(async () => {
  try {
    // Get all courses
    const courses = await storage.getAllCourses();
    
    for (const course of courses) {
      // Get the latest syllabus items for this course
      const syllabusItems = await storage.getSyllabusItemsByCourse(course.id);
      
      // Get the most recent syllabus item
      if (syllabusItems.length > 0) {
        const latestSyllabus = syllabusItems[0]; // Assuming they're sorted by date
        
        // Check if this is a new syllabus item (created within the last 5 minutes)
        const createdTime = new Date(latestSyllabus.createdAt).getTime();
        const now = new Date().getTime();
        const timeDiff = now - createdTime;
        
        if (timeDiff <= 5 * 60 * 1000) {
          // Send notification to all students in this course
          const enrollments = await storage.getEnrollmentsByCourse(course.id);
          
          for (const enrollment of enrollments) {
            await sendSyllabusNotification(course, latestSyllabus, enrollment.studentId);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in syllabus notification job:', error);
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Function to send assignment notifications
async function sendAssignmentNotification(assignment: any, timeframe: string) {
  console.log(`Assignment "${assignment.title}" is due in ${timeframe}`);
  
  // Get the course for this assignment
  const course = await storage.getCourse(assignment.courseId);
  if (!course) return;
  
  // Get all students enrolled in this course
  const enrollments = await storage.getEnrollmentsByCourse(assignment.courseId);
  
  // Send notification to each student
  for (const enrollment of enrollments) {
    // Find the student's WebSocket connection
    let studentClient: { socket: any, userId: string, courseId: string } | undefined;
    clients.forEach((clientInfo: { socket: any, userId: string, courseId: string }) => {
      if (clientInfo.userId === enrollment.studentId) {
        studentClient = clientInfo;
      }
    });
    
    if (studentClient && studentClient.socket.readyState === studentClient.socket.OPEN) {
      studentClient.socket.emit('new_notification', {
        id: `assign-${assignment.id}-${timeframe.replace(' ', '-')}`,
        type: 'assignment_due',
        title: 'Assignment Due Soon',
        message: `Assignment "${assignment.title}" in course "${course.title}" is due in ${timeframe}`,
        timestamp: new Date().toISOString(),
        read: false,
        relatedId: assignment.id
      });
    }
  }
}

// Function to send syllabus notifications
async function sendSyllabusNotification(course: any, syllabusItem: any, studentId: string) {
  console.log(`New syllabus item "${syllabusItem.title}" uploaded for course "${course.title}"`);
  
  // Find the student's WebSocket connection
  let studentClient: { socket: any, userId: string, courseId: string } | undefined;
  clients.forEach((clientInfo: { socket: any, userId: string, courseId: string }) => {
    if (clientInfo.userId === studentId) {
      studentClient = clientInfo;
    }
  });
  
  if (studentClient && studentClient.socket.readyState === studentClient.socket.OPEN) {
    studentClient.socket.emit('new_notification', {
      id: `syllabus-${syllabusItem.id}`,
      type: 'course_chat', // Using course_chat type for syllabus notifications
      title: 'New Course Material',
      message: `New syllabus item "${syllabusItem.title}" uploaded for course "${course.title}"`,
      timestamp: new Date().toISOString(),
      read: false,
      relatedId: course.id
    });
  }
}

// Function to send course creation notifications
async function sendCourseCreationNotification(course: any) {
  console.log(`New course "${course.title}" created by teacher`);
  
  // Get all students (in a real implementation, you might want to target specific students)
  const students = await storage.getAllUsers().then(users => users.filter(user => user.role === 'student'));
  
  // Send notification to each student
  for (const student of students) {
    // Find the student's WebSocket connection
    let studentClient: { socket: any, userId: string, courseId: string } | undefined;
    clients.forEach((clientInfo: { socket: any, userId: string, courseId: string }) => {
      if (clientInfo.userId === student.id) {
        studentClient = clientInfo;
      }
    });
    
    if (studentClient && studentClient.socket.readyState === studentClient.socket.OPEN) {
      studentClient.socket.emit('new_notification', {
        id: `course-${course.id}`,
        type: 'course_chat',
        title: 'New Course Available',
        message: `New course "${course.title}" has been created by ${course.teacher?.name || 'a teacher'}`,
        timestamp: new Date().toISOString(),
        read: false,
        relatedId: course.id
      });
    }
  }
}

// Export function to send notifications to clients
export function sendNotificationToClient(userId: string, notification: any) {
  // Find the user's WebSocket connection
  let userClient: { socket: any, userId: string, courseId: string } | undefined;
  clients.forEach((clientInfo: { socket: any, userId: string, courseId: string }) => {
    if (clientInfo.userId === userId) {
      userClient = clientInfo;
    }
  });
  
  if (userClient && userClient.socket.readyState === userClient.socket.OPEN) {
    userClient.socket.emit('new_notification', notification);
  }
}

// Export function to send notifications to all clients in a course
export function sendNotificationToCourse(courseId: string, notification: any, excludeUserId?: string) {
  // Send to all clients in the course
  clients.forEach((clientInfo: { socket: any, userId: string, courseId: string }) => {
    if (clientInfo.courseId === courseId && clientInfo.socket.readyState === clientInfo.socket.OPEN) {
      // Optionally exclude a specific user (e.g., the sender)
      if (!excludeUserId || clientInfo.userId !== excludeUserId) {
        clientInfo.socket.emit('new_notification', notification);
      }
    }
  });
}

startServer().catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
});