// ===== UNIVERSAL COOKIE HANDLER =====
export const getCookieOptions = (req) => {
  // For iOS Safari compatibility, we need to ensure secure=true and sameSite=none
  // in production environments, regardless of the request protocol
  
  // Always use secure cookies for consistent behavior across all environments
  // This is critical for iOS Safari to accept and send cookies with SameSite=None
  const options = {
    httpOnly: true,
    secure: true, // Always true for consistent behavior across all environments
    sameSite: "none", // Required for iOS Safari cross-site cookies
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days to match refresh token expiry
    domain: ".frontendbulkwala.vercel.app", // Share cookies across subdomains
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
