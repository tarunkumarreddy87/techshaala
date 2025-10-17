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

// Load environment variables from .env file
dotenv.config({ path: path.resolve(import.meta.dirname, '..', '.env') });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// File upload middleware
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  abortOnLimit: true,
  responseOnLimit: "File size limit has been reached"
}));

// Session middleware with MongoDB store for production
const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || "hackathon-lms-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
};

// Use MongoDB session store in production, memory store in development
if (process.env.NODE_ENV === "production") {
  if (process.env.MONGO_URI) {
    console.log('Using MongoDB session store for production');
    sessionConfig.store = MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
      ttl: 14 * 24 * 60 * 60 // 14 days
    });
  } else {
    console.warn('MONGO_URI not found, falling back to MemoryStore for sessions');
  }
} else {
  console.log('Using MemoryStore for development');
}

app.use(session(sessionConfig));

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
  const port = parseInt(process.env.PORT || '3001', 10);
  
  // Check if port is already in use
  const httpServer = createServer(app);
  
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
  
  return httpServer;
}

startServer().catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
});