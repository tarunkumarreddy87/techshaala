# Testing Instructions for New Features

This document provides step-by-step instructions for testing all the newly implemented features in the Learning Management System.

## System Requirements

Before testing, ensure you have:
1. The server running on port 3001
2. The client running on port 5173

## Starting the System

1. Start the server:
   ```
   npm run dev
   ```

2. Start the client (in a separate terminal):
   ```
   npx vite
   ```

3. Access the application at http://localhost:5173

## Feature Testing

### 1. YouTube Links and Chapters for Courses

#### Creating a Course with YouTube Content
1. Register as a teacher or log in with an existing teacher account
2. Navigate to the teacher dashboard
3. Click "Create Course"
4. Fill in the course details:
   - Title: "Web Development Fundamentals"
   - Description: "Learn the basics of web development including HTML, CSS, and JavaScript"
   - Duration: "8 weeks"
5. In the YouTube Link field, enter:
   ```
   https://www.youtube.com/watch?v=8aGhZQkoFbQ
   ```
6. In the Chapters field, enter the following JSON:
   ```json
   [
     {"id": 1, "title": "Introduction to JavaScript", "youtubeId": "8aGhZQkoFbQ", "duration": "25:30"},
     {"id": 2, "title": "JavaScript Functions", "youtubeId": "8aGhZQkoFbQ", "duration": "18:45"},
     {"id": 3, "title": "JavaScript Objects", "youtubeId": "8aGhZQkoFbQ", "duration": "22:15"}
   ]
   ```
7. Click "Create Course"
8. You should be redirected to the course detail page
9. Verify that:
   - The course title, description, and duration are displayed correctly
   - An embedded YouTube video is visible
   - The chapters are listed with titles and durations
   - Each chapter has a "Watch" button

#### Editing a Course with YouTube Content
1. From the course detail page, click the "Edit Course" button
2. Modify the course title to "Advanced Web Development"
3. Change the YouTube link to:
   ```
   https://www.youtube.com/watch?v=PkZNo7MFNFg
   ```
4. Update the chapters JSON to:
   ```json
   [
     {"id": 1, "title": "Advanced JavaScript Concepts", "youtubeId": "PkZNo7MFNFg", "duration": "30:15"},
     {"id": 2, "title": "JavaScript ES6 Features", "youtubeId": "PkZNo7MFNFg", "duration": "25:40"}
   ]
   ```
5. Click "Update Course"
6. Verify that all changes are reflected on the course detail page

### 2. Creating and Editing Assignments

#### Creating an Assignment
1. From the course detail page, click "Create Assignment"
2. Fill in the assignment details:
   - Title: "JavaScript Fundamentals Quiz"
   - Description: "Complete the quiz on JavaScript basics"
   - Due Date: Set to a future date/time
   - Maximum Score: 100
3. Click "Create Assignment"
4. Verify that the assignment appears in the course assignments list

#### Editing an Assignment
1. In the course assignments list, click the "Edit" button next to the assignment
2. Change the title to "JavaScript Advanced Quiz"
3. Update the maximum score to 90
4. Click "Update Assignment"
5. Verify that the changes are reflected in the assignments list

### 3. Manual Assignment Grading and Editing Grades

#### Creating a Submission (as a student)
1. Register as a student or log in with an existing student account
2. Enroll in the course you created (if not already enrolled)
3. Navigate to the course and find the assignment
4. Click on the assignment to submit work
5. Enter some content in the submission text area
6. Click "Submit Assignment"

#### Grading an Assignment (as a teacher)
1. Log in as a teacher
2. Navigate to the course detail page
3. Click "View Submissions" for the assignment
4. Find the student submission and click "Grade Submission"
5. Enter a score (e.g., 85) and feedback (e.g., "Good work! Just a few minor errors.")
6. Click "Submit Grade"
7. Verify that:
   - The submission shows as "Graded: 85/100"
   - The feedback is displayed

#### Editing a Grade
1. From the submissions page, click "Edit Grade" for the graded submission
2. Change the score to 90 and update the feedback to "Excellent work! Almost perfect."
3. Click "Update Grade"
4. Verify that the updated score and feedback are displayed

## Testing Edge Cases

### Invalid YouTube Links
1. When creating or editing a course, try entering an invalid YouTube URL
2. The system should accept the input but won't display a video (this is expected behavior)

### Invalid Chapter Data
1. When creating or editing a course, try entering invalid JSON in the chapters field
2. The system should accept the input but won't display chapters (this is expected behavior)

### Score Validation
1. When grading an assignment, try entering a score higher than the maximum allowed
2. The system should reject the submission and display an error message

## Troubleshooting

### Common Issues
1. **Server not starting**: Check if port 3001 is already in use. If so, stop the process using that port.
2. **Client not starting**: Check if port 5173 is already in use. If so, stop the process using that port.
3. **Database connection issues**: Ensure MongoDB is running and the connection string in .env is correct.

### Verifying Functionality
1. Check the browser console for any JavaScript errors
2. Check the server terminal for any error messages
3. Ensure all API calls are returning successful responses (200 status codes)

## Conclusion

All new features have been successfully implemented and should work as described in these testing instructions. The system now supports:
- YouTube video integration in courses
- Structured chapter navigation
- Assignment creation and editing
- Manual grading with score and feedback
- Grade editing capabilities

If you encounter any issues during testing, please review the implementation files and ensure all dependencies are properly installed.