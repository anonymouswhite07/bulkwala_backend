// Simple test to verify cookie functionality
import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();
app.use(cookieParser());

app.get('/test-cookie', (req, res) => {
  // Set a test cookie
  res.cookie('testCookie', 'testValue', {
    httpOnly: true,
    secure: false, // false for local testing
    sameSite: 'none',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  console.log('SET-COOKIE HEADERS:', res.getHeader('Set-Cookie'));
  
  res.json({ message: 'Cookie set successfully' });
});

app.listen(3001, () => {
  console.log('Test server running on port 3001');
});