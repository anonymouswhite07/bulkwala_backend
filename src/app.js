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

// Improved CORS configuration for iOS/Safari compatibility
// Treats domain variants (www/non-www, http/https) as same origin
const allowedOrigins = JSON.parse(process.env.FRONTEND_URL);

app.use(
  cors({
    origin: (origin, callback) => {
      // When origin is null (common on Safari/iOS), return first allowed origin
      if (!origin) {
        return callback(null, allowedOrigins[0]);
      }

      // Normalize origins by removing trailing slashes and www
      const normalize = (url) =>
        url.replace(/\/$/, "").replace("://www.", "://");

      const cleanOrigin = normalize(origin);
      const cleanedList = allowedOrigins.map(normalize);

      // Check if origin is in the explicit allowed list
      if (cleanedList.includes(cleanOrigin)) {
        return callback(null, origin);
      }

      // Allow any vercel.app subdomain (for preview deployments)
      if (origin.endsWith('.vercel.app')) {
        return callback(null, origin);
      }

      return callback(new Error("CORS blocked: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// Handle preflight for Safari/iOS (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    const origin = req.headers.origin;
    const allowedOrigins = JSON.parse(process.env.FRONTEND_URL);

    // Normalize origins for OPTIONS as well
    const normalize = (url) =>
      url.replace(/\/$/, "").replace("://www.", "://");

    const cleanOrigin = origin ? normalize(origin) : null;
    const cleanedList = allowedOrigins.map(normalize);

    // When origin is null (common on Safari/iOS), use first allowed origin
    if (!origin) {
      res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0]);
    } else if (cleanedList.includes(cleanOrigin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else if (origin && origin.endsWith('.vercel.app')) {
      // Allow any vercel.app subdomain (for preview deployments)
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