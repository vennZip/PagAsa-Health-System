import ActivityLog from "../models/ActivityLog.js";
export const logActivity = async ({ userId, action, module, description, targetId, ipAddress }) => {
  try { await ActivityLog.create({ userId, action, module, description, targetId, ipAddress: ipAddress || "" }); } catch (error) { console.error("Activity log error:", error.message); }
};
