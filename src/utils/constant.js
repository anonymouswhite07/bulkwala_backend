// ===== UNIVERSAL COOKIE HANDLER =====
export const getCookieOptions = (req) => {
  // For cross-site cookie compatibility, especially Safari/iOS
  // We need to ensure proper settings for cross-site cookies
  
  const options = {
    httpOnly: true,
    secure: true, // Always true for HTTPS connections
    sameSite: "none", // Required for cross-site cookies
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days to match refresh token expiry
    // Remove domain entirely to make cookies host-only
    // This can help with Safari's stricter cookie policies
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
