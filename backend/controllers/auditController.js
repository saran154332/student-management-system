const AuditLog = require("../models/AuditLog");

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("performedBy", "name email role")
      .populate("studentId", "name")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json(logs);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
};

module.exports = { getAuditLogs };
