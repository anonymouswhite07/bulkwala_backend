export const getCookieOpts = (req) => {
  // Use BACKEND_URL env var (e.g. "https://bulkwalabackend.onrender.com")
  const backendUrl = process.env.BACKEND_URL || process.env.VITE_BACKEND_URL || null;

  const opts = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000
  };

  // only set domain in production when BACKEND_URL is defined and looks like https://...
  try {
    if (process.env.NODE_ENV === "production" && backendUrl) {
      const url = new URL(backendUrl);
      opts.domain = url.hostname; // e.g. bulkwalabackend.onrender.com
    }
  } catch (e) {
    // ignore
  }

  // For local development, set secure to false
  if (process.env.NODE_ENV !== "production") {
    opts.secure = false;
  }

  return opts;
};