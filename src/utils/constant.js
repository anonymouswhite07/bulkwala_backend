// ===== UNIVERSAL COOKIE HANDLER =====
export const getCookieOptions = (req) => {
  const isProd = process.env.NODE_ENV === "production";

  // Enhanced cookie options for better iOS Safari compatibility
  const options = {
    httpOnly: true,
    secure: isProd, // required for SameSite=None
    sameSite: "None", // allows cross-site cookies (bulkwala.com → render.com)
    path: "/", // accessible everywhere
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  // Additional iOS-specific handling
  if (req.headers && req.headers['user-agent']) {
    const userAgent = req.headers['user-agent'].toLowerCase();
    // For iOS Safari, we might need to adjust cookie settings
    if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('safari')) {
      // Ensure secure is true for Safari
      options.secure = true;
      options.sameSite = "none";
    }
  }

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
