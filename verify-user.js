import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/user.model.js';

dotenv.config();

const verifyUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');
    
    // Find the test user and mark as verified
    const user = await User.findOne({ email: 'test@example.com' });
    if (user) {
      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpiresAt = undefined;
      await user.save();
      console.log('User verified successfully');
    } else {
      console.log('User not found');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
};

verifyUser();