import mongoose from 'mongoose';

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect('mongodb+srv://tarun:CoFW9e71SH91SR4q@mbu.j8hw3il.mongodb.net/hackathon_lms?retryWrites=true&w=majority&appName=mbu');
    console.log('Successfully connected to MongoDB!');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

testConnection();