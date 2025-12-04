// ===== UNIVERSAL COOKIE HANDLER =====
export const getCookieOptions = (req) => {
  // Enhanced cookie configuration for better Safari compatibility
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  // Special handling for Safari browsers
  const userAgent = req.headers['user-agent'];
  if (userAgent && /^((?!chrome|android).)*safari/i.test(userAgent)) {
    // For Safari, we might need to adjust SameSite policy in some cases
    // But keeping sameSite: 'none' with secure: true should work in modern Safari
    console.log("Safari detected, using enhanced cookie options");
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
