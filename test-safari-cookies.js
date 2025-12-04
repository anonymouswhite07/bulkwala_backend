// Test Script for Safari Cookie Compatibility
// This script verifies that cookies are properly set and can be sent back by the browser

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cookieParser());
app.use(express.json());

// CORS configuration that mimics production
app.use(cors({
  origin: [
    'https://frontendbulkwala.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));

// Test endpoint to set cookies with Safari-compatible attributes
app.get('/set-test-cookie', (req, res) => {
  // Set a test cookie with Safari-compatible attributes
  res.cookie('testRefreshToken', 'test-refresh-token-value', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // false for local testing
    sameSite: 'none',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.cookie('testAccessToken', 'test-access-token-value', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // false for local testing
    sameSite: 'none',
    path: '/',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  console.log('=== TEST COOKIE DEBUG ===');
  console.log('Set-Cookie headers:', res.getHeaders()['set-cookie']);
  console.log('User-Agent:', req.get('User-Agent'));
  console.log('Origin:', req.get('Origin'));

  res.json({
    success: true,
    message: 'Test cookies set successfully',
    cookiesSent: res.getHeaders()['set-cookie'] || []
  });
});

// Test endpoint to check if cookies are received
app.get('/check-test-cookie', (req, res) => {
  console.log('=== COOKIE RECEIPT DEBUG ===');
  console.log('Received cookies:', req.cookies);
  console.log('User-Agent:', req.get('User-Agent'));
  console.log('Origin:', req.get('Origin'));
  console.log('Cookie header:', req.get('Cookie'));

  res.json({
    success: true,
    receivedCookies: req.cookies,
    cookieHeader: req.get('Cookie') || 'undefined'
  });
});

// Test login endpoint that mimics real login flow
app.post('/test-login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('=== TEST LOGIN DEBUG ===');
  console.log('Login attempt for:', email);
  
  // Simulate successful login
  const refreshToken = 'simulated-refresh-token-' + Date.now();
  const accessToken = 'simulated-access-token-' + Date.now();
  
  // Set cookies with proper attributes
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  console.log('Set-Cookie headers:', res.getHeaders()['set-cookie']);

  res.json({
    success: true,
    user: {
      id: 'test-user-id',
      email: email,
      name: 'Test User'
    },
    message: 'Login successful'
  });
});

// Test refresh endpoint that mimics real refresh flow
app.post('/test-refresh', (req, res) => {
  console.log('=== TEST REFRESH DEBUG ===');
  console.log('Received cookies:', req.cookies);
  console.log('Cookie header:', req.get('Cookie'));
  
  // Check if refresh token is present
  if (!req.cookies.refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'No refresh token found in cookies'
    });
  }
  
  // Simulate token refresh
  const newAccessToken = 'new-access-token-' + Date.now();
  
  // Set new access token
  res.cookie('accessToken', newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  console.log('New Set-Cookie headers:', res.getHeaders()['set-cookie']);

  res.json({
    success: true,
    accessToken: newAccessToken,
    message: 'Token refreshed successfully'
  });
});

app.listen(PORT, () => {
  console.log(`Safari Cookie Test Server running on port ${PORT}`);
  console.log(`Test endpoints:`);
  console.log(`  GET  http://localhost:${PORT}/set-test-cookie`);
  console.log(`  GET  http://localhost:${PORT}/check-test-cookie`);
  console.log(`  POST http://localhost:${PORT}/test-login`);
  console.log(`  POST http://localhost:${PORT}/test-refresh`);
});