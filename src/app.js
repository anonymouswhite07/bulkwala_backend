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

// Proper CORS configuration for iOS/Safari compatibility
// Safari requires exact origin string, not array
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman)
      if (!origin) return callback(null, true);
      
      try {
        const allowedOrigins = JSON.parse(process.env.FRONTEND_URL);
        if (allowedOrigins.includes(origin)) {
          // Return the exact origin string, not the array
          callback(null, origin);
        } else {
          callback(new Error("❌ CORS blocked: " + origin));
        }
      } catch (err) {
        console.error("❌ FRONTEND_URL is not a valid JSON array");
        callback(new Error("❌ CORS configuration error"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Set-Cookie"],
  })
);

// Handle preflight for Safari/iOS (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    const origin = req.headers.origin;
    const allowedOrigins = JSON.parse(process.env.FRONTEND_URL);

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
    return res.sendStatus(200);
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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