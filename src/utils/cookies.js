// Cookie Options Helper for Cross-Browser Compatibility
// Works with iOS Safari, Chrome, Firefox, and all other browsers
// Compatible with Vercel frontend + Render backend

export const getCookieOpts = (req) => {
  // Use BACKEND_URL env var (e.g. "https://bulkwalabackend.onrender.com")
  const backendUrl = process.env.BACKEND_URL || process.env.VITE_BACKEND_URL || null;

  const opts = {
    httpOnly: true,
    secure: true, // Always true for cross-site compatibility
    sameSite: "none", // Required for cross-site cookies
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  // Only set domain in production when BACKEND_URL is defined and looks like https://...
  try {
    if (process.env.NODE_ENV === "production" && backendUrl) {
      const url = new URL(backendUrl);
      opts.domain = url.hostname; // e.g. bulkwalabackend.onrender.com
    }
  } catch (e) {
    // ignore
  }

  // For local development, set secure to false to allow cookies over HTTP
  // But warn that this may not work with Safari
  if (process.env.NODE_ENV !== "production") {
    console.warn("⚠️  Running in development mode - setting secure=false for cookies");
    console.warn("⚠️  For Safari testing, use HTTPS (e.g., with ngrok) or temporarily remove Secure flag");
    opts.secure = false;
  }

  return opts;
};