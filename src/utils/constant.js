// ===== UNIVERSAL COOKIE HANDLER =====
export const getCookieOptions = (req) => {
  // Enhanced cookie configuration for Safari compatibility
  // Detect Safari to handle cookie restrictions properly
  const userAgent = req.headers['user-agent'] || '';
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  
  const options = {
    httpOnly: true,
    secure: true, // Always true for consistent behavior across all environments
    sameSite: isSafari ? "lax" : "none", // Use lax for Safari, none for others
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    // Note: Not setting domain property to make cookies host-only
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
