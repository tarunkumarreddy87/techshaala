import express from "express";
import { MongoStorage } from "./server/storage";

// Use the MongoDB Atlas connection string
const storage = new MongoStorage('mongodb+srv://tarun:CoFW9e71SH91SR4q@mbu.j8hw3il.mongodb.net/hackathon_lms?retryWrites=true&w=majority&appName=mbu');

const app = express();
app.use(express.json());

async function startServer() {
  try {
    // Connect to MongoDB
    await storage.connect();
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error(`Failed to connect to MongoDB: ${error}`);
    console.log("Falling back to in-memory storage for development");
  }

  const port = parseInt(process.env.PORT || '8080', 10); // Use port 8080 instead
  
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();