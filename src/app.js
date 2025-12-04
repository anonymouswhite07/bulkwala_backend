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
  allowedOrigins = [
    "https://frontendbulkwala.vercel.app",
    "https://bulkwala-frontend.vercel.app",
    "https://bulkwalafrontend.vercel.app",
    "https://frontendbulkwala-j4dxus8kq-anonymouswhite07s-projects.vercel.app",
    "https://bulkwala.com",
    "http://bulkwala.com",
    "https://www.bulkwala.com",
    "http://www.bulkwala.com",
    "http://localhost:5173",
    "http://localhost:3000"
  ];
}

console.log("Allowed Origins:", allowedOrigins);

// ✅ Enhanced CORS configuration for cross-browser compatibility
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Safari, etc.)
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
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  exposedHeaders: ["Authorization"],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// ✅ Handle preflight OPTIONS requests and set essential headers
app.use((req, res, next) => {
  // Set essential headers for all requests (not just OPTIONS)
  const origin = req.headers.origin;
  
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app'))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (!origin) {
    // For Safari requests with no origin, use the first allowed origin
    res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0]);
  }
  
  // ✅ Essential headers for cross-browser cookie compatibility
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Vary", "Origin"); // ✅ Critical for Safari - prevents caching issues
  
  // Handle OPTIONS preflight requests
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
    res.setHeader("Access-Control-Max-Age", "86400"); // Cache preflight for 24 hours
    return res.sendStatus(204);
  }
  
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