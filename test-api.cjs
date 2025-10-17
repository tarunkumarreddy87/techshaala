const http = require('http');

// Test registration
const registerData = JSON.stringify({
  name: "Test Teacher",
  email: "teacher2@test.com",
  password: "password123",
  role: "teacher"
});

const registerOptions = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(registerData)
  }
};

const registerReq = http.request(registerOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Registration Response Status:', res.statusCode);
    console.log('Registration Response Headers:', res.headers);
    console.log('Registration Response Body:', data);
    
    if (res.statusCode === 201) {
      const userData = JSON.parse(data);
      console.log('User registered successfully:', userData);
      
      // Test login
      const loginData = JSON.stringify({
        email: "teacher2@test.com",
        password: "password123"
      });
      
      const loginOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginData)
        }
      };
      
      const loginReq = http.request(loginOptions, (res) => {
        let loginData = '';
        
        res.on('data', (chunk) => {
          loginData += chunk;
        });
        
        res.on('end', () => {
          console.log('\nLogin Response Status:', res.statusCode);
          console.log('Login Response Body:', loginData);
          
          if (res.statusCode === 200) {
            const loginResponse = JSON.parse(loginData);
            console.log('Login successful:', loginResponse);
            
            // Test creating a course
            const courseData = JSON.stringify({
              title: "Test Course",
              description: "This is a test course",
              duration: "8 weeks"
            });
            
            const courseOptions = {
              hostname: 'localhost',
              port: 3001,
              path: '/api/courses',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(courseData),
                'Cookie': res.headers['set-cookie'] // Pass the session cookie
              }
            };
            
            const courseReq = http.request(courseOptions, (res) => {
              let courseData = '';
              
              res.on('data', (chunk) => {
                courseData += chunk;
              });
              
              res.on('end', () => {
                console.log('\nCourse Creation Response Status:', res.statusCode);
                console.log('Course Creation Response Body:', courseData);
              });
            });
            
            courseReq.on('error', (e) => {
              console.error('Course Creation Error:', e.message);
            });
            
            courseReq.write(courseData);
            courseReq.end();
          }
        });
      });
      
      loginReq.on('error', (e) => {
        console.error('Login Error:', e.message);
      });
      
      loginReq.write(loginData);
      loginReq.end();
    }
  });
});

registerReq.on('error', (e) => {
  console.error('Registration Error:', e.message);
});

registerReq.write(registerData);
registerReq.end();