import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
// Route imports
import userRoutes from "./routes/user.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import subcategoryRoutes from "./routes/subcategory.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import queryRoutes from "./routes/query.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import referralRoutes from "./routes/referral.routes.js";
import offerRoutes from "./routes/offer.routes.js";
import bannerRoutes from "./routes/banner.routes.js";
import { globalErrorHandler } from "./middleware/globalError.middleware.js";

const app = express();
app.set("trust proxy", 1);

// ✅ Parse allowed origins correctly - must be an array in .env
let allowedOrigins = [];
try {
  allowedOrigins = JSON.parse(process.env.FRONTEND_URL || '[]');
  if (!Array.isArray(allowedOrigins)) {
    allowedOrigins = [allowedOrigins];
  }
} catch (e) {
  console.error("Invalid FRONTEND_URL format, using defaults");
  allowedOrigins = ["https://frontendbulkwala.vercel.app", "http://localhost:5173"];
}

console.log("Allowed Origins:", allowedOrigins);

// ✅ CORS configuration with credentials - optimized for Safari
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        // For Safari requests with no origin, allow the first allowed origin
        return callback(null, allowedOrigins[0]);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, origin);
      }
      
      // Allow any vercel.app subdomain (for preview deployments)
      if (origin.endsWith('.vercel.app')) {
        return callback(null, origin);
      }
      
      callback(new Error(`CORS not allowed for origin: ${origin}`));
    },
    credentials: true, // ✅ Critical for cookie handling
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposedHeaders: ["Authorization"] // Expose auth headers if needed
  })
);

// ✅ Handle preflight OPTIONS requests - Safari needs these headers
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    const origin = req.headers.origin;
    
    // Set CORS headers for OPTIONS preflight
    if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app'))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else if (!origin) {
      // For Safari requests with no origin, use the first allowed origin
      res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0]);
    }
    
    // ✅ Essential headers for Safari cookie compatibility
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
    // ✅ Critical for Safari - prevents caching issues with cookies
    res.setHeader("Vary", "Origin");
    
    return res.sendStatus(200);
  }
  
  next();
});

// ✅ Apply CORS headers to ALL responses (not just OPTIONS)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers for actual requests
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app'))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (!origin) {
    // For Safari requests with no origin, use the first allowed origin
    res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0]);
  }
  
  // ✅ Essential headers for all responses
  res.setHeader("Access-Control-Allow-Credentials", "true");
  // ✅ Critical for Safari - prevents caching issues with cookies
  res.setHeader("Vary", "Origin");
  
  next();
});

// Configure morgan to skip logging 401 errors using stream (better performance)
app.use(
  morgan("dev", {
    stream: {
      write: (message) => {
        // Don't log 401 responses (expected when not authenticated)
        if (!message.includes(" 401 ")) {
          process.stdout.write(message);
        }
      },
    },
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "16mb" })); // Increase limit for file uploads
app.use(express.urlencoded({ extended: true, limit: "16mb" }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/subcategory", subcategoryRoutes);
app.use("/api/product", productRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/query", queryRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/banners", bannerRoutes);

// Global Error Handler - always last middleware
app.use(globalErrorHandler);

export default app;