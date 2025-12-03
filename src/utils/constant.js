// ===== UNIVERSAL COOKIE HANDLER =====
export const getCookieOptions = (req) => {
  // Set secure cookie options for all environments
  const options = {
    httpOnly: true,
    secure: true, // Always true for consistent behavior across all environments
    sameSite: "none", // Allows cross-site cookies (bulkwala.com → render.com)
    path: "/", // accessible everywhere
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: ".bulkwala.com" // Share cookies across subdomains
  };

  // Removed iOS-specific handling to ensure consistent behavior across all devices
  // Previously had user-agent detection for iOS Safari but now using uniform settings

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
