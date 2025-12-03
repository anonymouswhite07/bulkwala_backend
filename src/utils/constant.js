// ===== UNIVERSAL COOKIE HANDLER =====
export const getCookieOptions = (req) => {
  // Decide whether cookie should be secure
  const forwardedProto = (req && req.headers && req.headers["x-forwarded-proto"]) || "";
  const isSecureRequest = (req && req.secure) || forwardedProto.includes("https") || process.env.NODE_ENV === "production";

  // Allow optional cookie domain via env; if not set, cookie will be host-only which is usually correct
  const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

  const options = {
    httpOnly: true,
    secure: Boolean(isSecureRequest),
    // Use 'none' for cross-site cookies in production where secure=true is expected.
    // Use 'lax' during local development to avoid secure cookie issues over http.
    sameSite: isSecureRequest ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: cookieDomain,
  };

  return options;
};

export const userRoleEnum = {
  ADMIN: "admin",
  CUSTOMER: "customer",
  SELLER: "seller",
};

export const availableUserRoles = Object.values(userRoleEnum);

export const paymentModeEnum = {
  COD: "cod",
  NETBANKING: "netbanking",
  UPI: "upi",
  CARD: "card",
  ONLINE: "online",
  PICKUP: "pickup", // ✅ New mode added
};

export const availablePaymentModes = Object.values(paymentModeEnum);

export const orderStatusEnum = {
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  PROCESSING: "Processing",
  CANCELLED: "Cancelled",
};

export const availableOrderStatus = Object.values(orderStatusEnum);

export const paymentStatusEnum = {
  PENDING: "pending",
  SUCCESS: "success",
  FAILED: "failed",
  REFUNDED: "refunded",
};

export const availablePaymentStatus = Object.values(paymentStatusEnum);
