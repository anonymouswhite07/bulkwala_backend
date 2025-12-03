// ===== UNIVERSAL COOKIE HANDLER =====
export const getCookieOptions = (req) => {
  // Enhanced cookie configuration for iOS Safari compatibility
  // Detect iOS Safari to handle cookie restrictions properly
  const userAgent = req.headers['user-agent'] || '';
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  
  // For iOS Safari, we need special handling
  const isIOSSafari = isIOS && isSafari;
  
  const options = {
    httpOnly: true,
    secure: true, // Always true for consistent behavior across all environments
    sameSite: isIOSSafari ? "none" : "lax", // Special handling for iOS Safari
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
