import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getCookieOptions } from "../utils/constant.js";
import crypto from "crypto";
import {
  sendResetPasswordEmail,
  sendVerificationEmail,
} from "../utils/email.js";
import ms from "ms";
import { sendOtpSms, verifyOtpSms } from "../utils/sms.js";

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select("-password -resetPasswordToken -refreshToken")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, users, "All users fetched successfully"));
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existinguser = await User.findOne({ email });

  if (existinguser) {
    throw new ApiError(400, "User already exists");
  }

  const verificationToken = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  const expiresIn = ms(process.env.VERIFICATION_TOKEN_EXPIRES_IN);

  const user = await User.create({
    name,
    email,
    password,
    phone,
    verificationToken,
    verificationTokenExpiresAt: new Date(Date.now() + expiresIn),
    isVerified: false,
  });

  await sendVerificationEmail(user.email, verificationToken);

  return res
    .status(201)
    .json(new ApiResponse(201, user, "User register Please verify your email"));
});

const registerSellerDirect = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    businessName,
    gstNumber,
    pickupAddress,
    bankName,
    accountNumber,
    ifsc,
  } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User already exists with this email");
  }

  const verificationToken = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  const expiresIn = ms(process.env.VERIFICATION_TOKEN_EXPIRES_IN);

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: "customer", // stays customer until admin approval
    verificationToken,
    verificationTokenExpiresAt: new Date(Date.now() + expiresIn),
    sellerDetails: {
      businessName,
      gstNumber,
      pickupAddress,
      bankName,
      accountNumber,
      ifsc,
      approved: false,
    },
    isVerified: false,
  });

  await sendVerificationEmail(user.email, verificationToken);

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        user,
        "Seller registration submitted. Please verify your email. Admin approval pending after verification."
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "User not found");
  }
  const isPassCorrect = await user.isPasswordCorrect(password);
  if (!isPassCorrect) {
    throw new ApiError(400, "Invalid password");
  }

  // 🔒 Check verification status
  if (!user.isVerified) {
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const expiresIn = ms(process.env.VERIFICATION_TOKEN_EXPIRES_IN);
    user.verificationToken = verificationToken;
    user.verificationTokenExpiresAt = new Date(Date.now() + expiresIn);
    await user.save({ validateBeforeSave: false });

    await sendVerificationEmail(user.email, verificationToken);

    return res.status(403).json({
      message:
        "Please verify your email first. A new verification code has been sent.",
      data: { _id: user._id, email: user.email },
    });
  }

  const { accessToken, refreshToken } = user.generateJWT();

  // 🔥 FIX: SAVE REFRESH TOKEN
  user.refreshToken = refreshToken;
  user.refreshTokenExpireAt = new Date(
    Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRES_IN)
  );
  
  // Generate recovery token for Safari ITP compatibility
  let recoveryToken = null;
  if (req.headers['user-agent'] && /^((?!chrome|android).)*safari/i.test(req.headers['user-agent'])) {
    recoveryToken = jwt.sign(
      { _id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "5m" } // 5 minute expiry
    );
    
    // Save recovery token to user document
    user.recoveryToken = recoveryToken;
    user.recoveryTokenExpireAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  }
  
  await user.save({ validateBeforeSave: false });

  // ✅ Use dynamic cookie options for Safari compatibility
  const options = getCookieOptions(req);
  console.log("Cookie options:", options);
  
  console.log("=== EMAIL LOGIN - SETTING COOKIES ===");
  console.log("Refresh token being set:", refreshToken ? refreshToken.substring(0, 20) + "..." : "null");

  console.log("Setting cookies with options:", options);
  console.log("Access token length:", accessToken?.length);
  console.log("Refresh token length:", refreshToken?.length);
  
  const response = res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options);
    
  console.log("Response headers after setting cookies:", response.getHeaders());
  
  // Include recovery token in response for Safari users
  const responseData = { user };
  if (recoveryToken) {
    responseData.recoveryToken = recoveryToken;
  }
  
  return response.json(new ApiResponse(200, responseData, "User logged in successfully"));
});

const sendOtpLogin = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) throw new ApiError(400, "Phone number is required");

  const user = await User.findOne({ phone });
  if (!user)
    throw new ApiError(404, "No account found with this mobile number");

  await sendOtpSms(phone);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "OTP sent successfully via Twilio"));
});

const verifyOtpLogin = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp)
    throw new ApiError(400, "Phone number and OTP are required");

  const isVerified = await verifyOtpSms(phone, otp);
  if (!isVerified) throw new ApiError(400, "Invalid or expired OTP");

  const user = await User.findOne({ phone });
  if (!user) throw new ApiError(404, "User not found");

  const { accessToken, refreshToken } = user.generateJWT();

  user.refreshToken = refreshToken;
  user.refreshTokenExpireAt = new Date(
    Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRES_IN)
  );
  
  // Generate recovery token for Safari ITP compatibility
  let recoveryToken = null;
  if (req.headers['user-agent'] && /^((?!chrome|android).)*safari/i.test(req.headers['user-agent'])) {
    recoveryToken = jwt.sign(
      { _id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "5m" } // 5 minute expiry
    );
    
    // Save recovery token to user document
    user.recoveryToken = recoveryToken;
    user.recoveryTokenExpireAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  }

  await user.save({ validateBeforeSave: false });

  // ✅ Use dynamic cookie options for Safari compatibility
  const options = getCookieOptions(req);
  
  console.log("=== OTP LOGIN - SETTING COOKIES ===");
  console.log("Refresh token being set:", refreshToken ? refreshToken.substring(0, 20) + "..." : "null");
  console.log("Cookie options:", options);

  console.log("Setting cookies with options:", options);
  console.log("Access token length:", accessToken?.length);
  console.log("Refresh token length:", refreshToken?.length);
  
  const response = res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options);
    
  console.log("Response headers after setting cookies:", response.getHeaders());
  
  // Include recovery token in response for Safari users
  const responseData = { user };
  if (recoveryToken) {
    responseData.recoveryToken = recoveryToken;
  }
  
  return response.json(new ApiResponse(200, responseData, "Login successful via OTP"));
});

const updateUser = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const userid = req.user._id;

  const user = await User.findById(userid);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.name = name ?? user.name;
  user.phone = phone ?? user.phone;

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User updated successfully"));
});

const updateAddress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { address, index } = req.body;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  // Ensure array exists
  if (!Array.isArray(user.addresses)) {
    user.addresses = [];
  }

  // If index exists => UPDATE
  if (index !== undefined && index !== null) {
    if (index < 0 || index >= user.addresses.length) {
      throw new ApiError(400, "Invalid address index");
    }

    user.addresses[index] = address;
  } else {
    // Else => ADD NEW
    user.addresses.push(address);
  }

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Address saved successfully"));
});

const deleteAddress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { index } = req.params;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  if (!user.addresses || user.addresses.length === 0) {
    throw new ApiError(400, "No addresses available to delete");
  }

  if (index < 0 || index >= user.addresses.length) {
    throw new ApiError(400, "Invalid address index");
  }

  user.addresses.splice(index, 1);
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Address deleted successfully"));
});

const getuserProfile = asyncHandler(async (req, res) => {
  const userid = req.user._id;

  const user = await User.findById(userid).select(
    "-password -resetPasswordToken -refreshToken"
  );
  if (!user) {
    throw new ApiError(401, "User not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User profile fetched"));
});

const verifyUser = asyncHandler(async (req, res) => {
  const { userid } = req.params;
  const { token } = req.body;

  const user = await User.findById(userid);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.verificationToken !== token) {
    throw new ApiError(400, "Invalid verification token");
  }

  if (user.verificationTokenExpiresAt < new Date()) {
    throw new ApiError(400, "Verification token has expired");
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiresAt = undefined;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Email verified successfully, you can now log in."
      )
    );
});

const resendVerifyCode = asyncHandler(async (req, res) => {
  const { userid } = req.params;
  const user = await User.findById(userid);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const verificationToken = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const expiresIn = ms(process.env.VERIFICATION_TOKEN_EXPIRES_IN);
  user.verificationToken = verificationToken;
  user.verificationTokenExpiresAt = new Date(Date.now() + expiresIn);
  await user.save({ validateBeforeSave: false });

  await sendVerificationEmail(user.email, verificationToken);

  return res
    .status(200)
    .json(
      new ApiResponse(200, null, "New verification code sent successfully")
    );
});

const forgetPassword = asyncHandler(async (req, _res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  // Generate a secure reset token
  const resetPasswordToken = crypto.randomBytes(32).toString("hex");
  const resetPasswordExpiresAt = new Date(
    Date.now() + ms(process.env.RESET_PASSWORD_EXPIRY)
  );

  // Save the token and its expiry to the user in the database
  user.resetPasswordToken = resetPasswordToken;
  user.resetPasswordExpiresAt = resetPasswordExpiresAt;
  await user.save({ validateBeforeSave: false });

  // Send the password reset email
  await sendResetPasswordEmail(user.email, user._id, resetPasswordToken);
});

const resetPassword = asyncHandler(async (req, res) => {
  const { userid, token } = req.params;
  const { newPassword } = req.body;

  const user = await User.findById(userid);

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (
    user.resetPasswordToken !== token ||
    user.resetPasswordExpiresAt < new Date()
  ) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  user.password = newPassword;

  user.resetPasswordToken = undefined;
  user.resetPasswordExpiresAt = undefined;

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Password Reset Successfully"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Generate a secure reset token
  const resetPasswordToken = crypto.randomBytes(32).toString("hex");
  const resetPasswordExpiresAt = new Date(
    Date.now() + ms(process.env.RESET_PASSWORD_EXPIRY)
  );

  // Save the token and its expiry to the user in the database
  user.resetPasswordToken = resetPasswordToken;
  user.resetPasswordExpiresAt = resetPasswordExpiresAt;
  await user.save({ validateBeforeSave: false });

  // Send the password reset email
  const emailSent = await sendResetPasswordEmail(
    user.email,
    user._id,
    resetPasswordToken
  );

  if (!emailSent) {
    throw new ApiError(500, "Failed to send reset password email");
  }

  return res
    .status(200)
    .json({ success: true, message: "Password reset link sent successfully" });
});

const refreshUserToken = asyncHandler(async (req, res) => {
  // Debug logging to understand what's happening with the refresh token requests
  console.log("=== REFRESH TOKEN REQUEST DEBUG ===");
  console.log("User-Agent:", req.headers["user-agent"]);
  console.log("Origin:", req.headers["origin"]);
  console.log("Cookies:", req.cookies);
  console.log("Signed Cookies:", req.signedCookies);
  console.log("All Headers:", req.headers);
  
  // Also check if cookies are in the headers directly
  console.log("Cookie header:", req.headers.cookie);
  
  // Try to get refresh token from multiple sources
  let refreshTokenValue = null;
  
  // 1. From cookies (standard approach)
  if (req.cookies.refreshToken) {
    console.log("✅ USING REFRESH TOKEN FROM COOKIES");
    refreshTokenValue = req.cookies.refreshToken;
  }
  // 2. From request body (fallback for Safari)
  else if (req.body?.refreshToken) {
    console.log("⚠️ USING REFRESH TOKEN FROM REQUEST BODY (FALLBACK)");
    refreshTokenValue = req.body.refreshToken;
  }
  // 3. From Authorization header (Bearer token)
  else if (req.headers.authorization?.startsWith('Bearer ')) {
    console.log("⚠️ USING REFRESH TOKEN FROM AUTHORIZATION HEADER (FALLBACK)");
    refreshTokenValue = req.headers.authorization.substring(7); // Remove 'Bearer '
  }
  
  // 4. Check if we have a recovery token (Safari ITP fallback)
  let user = null;
  if (refreshTokenValue) {
    user = await User.findOne({ refreshToken: refreshTokenValue });
    if (!user) {
      // Check if it's a used token (rotation security)
      const usedTokenUser = await User.findOne({ 
        "usedRefreshTokens.token": refreshTokenValue 
      });
      
      if (usedTokenUser) {
        // Token reuse detected - possible attack, invalidate all tokens
        usedTokenUser.usedRefreshTokens.push({
          token: refreshTokenValue,
          usedAt: new Date()
        });
        usedTokenUser.refreshToken = null;
        usedTokenUser.refreshTokenExpireAt = null;
        await usedTokenUser.save({ validateBeforeSave: false });
        
        console.log("🚨 REFRESH TOKEN REUSE DETECTED - SECURITY ALERT");
        throw new ApiError(401, "Invalid refresh token. Security violation detected.");
      }
    }
  }
  
  // 5. If no refresh token found, check for recovery token
  if (!user && req.body?.recoveryToken) {
    console.log("🔄 ATTEMPTING RECOVERY WITH RECOVERY TOKEN");
    user = await User.findOne({ 
      recoveryToken: req.body.recoveryToken,
      recoveryTokenExpireAt: { $gt: new Date() }
    });
    
    if (user) {
      console.log("✅ RECOVERY TOKEN VALID");
      // Clear the recovery token as it's been used
      user.recoveryToken = null;
      user.recoveryTokenExpireAt = null;
      await user.save({ validateBeforeSave: false });
      
      // Generate new tokens
      const { accessToken, refreshToken } = user.generateJWT();
      
      // Save new refresh token
      user.refreshToken = refreshToken;
      user.refreshTokenExpireAt = new Date(
        Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRES_IN)
      );
      await user.save({ validateBeforeSave: false });
      
      // Return new tokens
      const options = getCookieOptions(req);
      const response = res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options);
      
      return response.json({
        success: true,
        accessToken: accessToken,
        refreshToken: refreshToken,
        message: "Tokens refreshed using recovery token"
      });
    }
  }
  
  if (!refreshTokenValue && !user) {
    console.log("❌ NO REFRESH TOKEN OR RECOVERY TOKEN FOUND");
    throw new ApiError(401, "Refresh token or recovery token not found");
  }
  
  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (user.refreshTokenExpireAt < new Date()) {
    throw new ApiError(401, "Refresh token expired. Please log in again.");
  }

  // Add current token to used tokens list (rotation)
  user.usedRefreshTokens = user.usedRefreshTokens || [];
  user.usedRefreshTokens.push({
    token: refreshTokenValue,
    usedAt: new Date()
  });
  
  // Clean up old used tokens (keep only last 10)
  if (user.usedRefreshTokens.length > 10) {
    user.usedRefreshTokens = user.usedRefreshTokens.slice(-10);
  }

  // Generate new tokens
  const { accessToken, refreshToken } = user.generateJWT();

  // Database mein naya refreshToken save karein
  user.refreshToken = refreshToken;
  user.refreshTokenExpireAt = new Date(
    Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRES_IN)
  );
  await user.save({ validateBeforeSave: false });

  // ✅ Use dynamic cookie options for Safari compatibility
  const options = getCookieOptions(req);
  console.log("Setting refresh cookies with options:", options);
  console.log("New access token length:", accessToken?.length);
  console.log("New refresh token length:", refreshToken?.length);
  
  const response = res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options);
    
  console.log("Refresh response headers after setting cookies:", response.getHeaders());
  
  return response.json({
    success: true,
    // Include tokens in response body as additional fallback
    accessToken: accessToken,
    refreshToken: refreshToken
  });
});

const logoutUser = asyncHandler(async (req, res) => {
  // const accessToken = req.cookies.accessToken;
  // const refreshToken = req.cookies.refreshToken;

  // ✅ Use dynamic cookie options for Safari compatibility (must match when setting)
  const options = getCookieOptions(req);
  const user = await User.findById(req.user._id);
  if (user) {
    user.refreshToken = null;
    user.refreshTokenExpireAt = null;
    user.usedRefreshTokens = [];
    await user.save({ validateBeforeSave: false });
  }

  console.log("Clearing cookies with options:", options);
  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "User logged out successfully. Please clear any stored tokens from localStorage."));
});

const applyForSeller = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    businessName,
    gstNumber,
    pickupAddress,
    bankName,
    accountNumber,
    ifsc,
  } = req.body;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  if (user.sellerDetails?.approved) {
    throw new ApiError(400, "You are already an approved seller");
  }

  // Prevent multiple applications
  if (
    user.sellerDetails &&
    user.sellerDetails.businessName &&
    !user.sellerDetails.approved
  ) {
    throw new ApiError(400, "Your seller application is already under review");
  }

  // Save application details
  user.sellerDetails = {
    businessName,
    gstNumber,
    pickupAddress,
    bankName,
    accountNumber,
    ifsc,
    approved: false,
  };

  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        "Seller application submitted successfully and pending admin approval"
      )
    );
});

const getPendingSellers = asyncHandler(async (_req, res) => {
  const pending = await User.find({
    "sellerDetails.approved": false,
    "sellerDetails.businessName": { $exists: true, $ne: "" },
    role: "customer",
  }).select("-password -refreshToken -resetPasswordToken");

  return res
    .status(200)
    .json(new ApiResponse(200, pending, "Pending seller applications fetched"));
});

const approveSeller = asyncHandler(async (req, res) => {
  const { userid } = req.params;
  const user = await User.findById(userid);

  if (!user) throw new ApiError(404, "User not found");

  if (!user.sellerDetails || !user.sellerDetails.businessName) {
    throw new ApiError(400, "This user has not applied as a seller");
  }

  user.role = "seller";
  user.sellerDetails.approved = true;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Seller approved successfully"));
});

const rejectSeller = asyncHandler(async (req, res) => {
  const { userid } = req.params;
  const user = await User.findById(userid);

  if (!user) throw new ApiError(404, "User not found");

  user.sellerDetails = {}; // clear application
  user.role = "customer";
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Seller application rejected"));
});

export {
  getAllUsers,
  registerUser,
  registerSellerDirect,
  loginUser,
  updateUser,
  getuserProfile,
  updateAddress,
  deleteAddress,
  verifyUser,
  resendVerifyCode,
  forgetPassword,
  resetPassword,
  refreshUserToken,
  changePassword,
  logoutUser,
  applyForSeller,
  getPendingSellers,
  approveSeller,
  rejectSeller,
  sendOtpLogin,
  verifyOtpLogin,
};
