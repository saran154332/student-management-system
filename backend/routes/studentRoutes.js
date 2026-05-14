const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getStudents,
  getStudentById,
  addStudent,
  updateStudent,
  deleteStudent,
  getDashboardStats,
  exportStudents,
  importStudents,
} = require("../controllers/studentController");
const multer = require("multer");
const path = require("path");

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Routes
router.get("/", protect, getStudents);
router.get("/:id", protect, getStudentById);
router.post("/", protect, adminOnly, upload.single("photo"), addStudent);
router.put("/:id", protect, adminOnly, upload.single("photo"), updateStudent);
router.delete("/:id", protect, adminOnly, deleteStudent);
router.get("/export/excel", protect, adminOnly, exportStudents);
router.get("/dashboard/stats", protect, getDashboardStats);
router.post("/import/excel", protect, adminOnly, upload.single("file"), importStudents);

module.exports = router;