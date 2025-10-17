import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
const result = dotenv.config({ path: path.resolve(import.meta.dirname, '.env') });
console.log('Dotenv result:', result);
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('PORT:', process.env.PORT);