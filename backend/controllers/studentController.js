const Student = require("../models/Student");
const AuditLog = require("../models/AuditLog");
const ExcelJS = require("exceljs");

const sendServerError = (res, message = "Something went wrong. Please try again.") => {
  return res.status(500).json({ message });
};

const isCastError = (error) => error.name === "CastError";

const getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, name, class: className } = req.query;
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const filter = {};
    if (name) filter.name = { $regex: name, $options: "i" };
    if (className) filter.class = className;

    const total = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      students,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
    });
  } catch (error) {
    return sendServerError(res);
  }
};

const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json(student);
  } catch (error) {
    if (isCastError(error)) {
      return res.status(400).json({ message: "Invalid student id" });
    }

    return sendServerError(res);
  }
};

const addStudent = async (req, res) => {
  try {
    const { name, email, class: className, gender, age, phone, address } = req.body;

    if (!name || !email || !className || !gender || !age) {
      return res.status(400).json({ message: "Name, email, class, gender, and age are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await Student.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "Student with this email already exists" });
    }

    const student = await Student.create({
      name: name.trim(),
      email: normalizedEmail,
      class: className,
      gender,
      age,
      phone,
      address,
      photo: req.file ? req.file.filename : "",
    });

    await AuditLog.create({
      performedBy: req.user.id,
      action: "ADDED",
      studentId: student._id,
      details: `Added student: ${student.name}`,
    });

    return res.status(201).json({ message: "Student added successfully", student });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Student with this email already exists" });
    }

    return sendServerError(res);
  }
};

const updateStudent = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.email) updateData.email = updateData.email.trim().toLowerCase();
    if (req.file) updateData.photo = req.file.filename;

    const student = await Student.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    await AuditLog.create({
      performedBy: req.user.id,
      action: "UPDATED",
      studentId: student._id,
      details: `Updated student: ${student.name}`,
    });

    return res.status(200).json({ message: "Student updated successfully", student });
  } catch (error) {
    if (isCastError(error)) {
      return res.status(400).json({ message: "Invalid student id" });
    }

    if (error.code === 11000) {
      return res.status(400).json({ message: "Student with this email already exists" });
    }

    return sendServerError(res);
  }
};

const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    await AuditLog.create({
      performedBy: req.user.id,
      action: "DELETED",
      studentId: student._id,
      details: `Deleted student: ${student.name}`,
    });

    return res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    if (isCastError(error)) {
      return res.status(400).json({ message: "Invalid student id" });
    }

    return sendServerError(res);
  }
};

const exportStudents = async (req, res) => {
  try {
    const students = await Student.find();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Students");

    sheet.columns = [
      { header: "Name", key: "name", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "Class", key: "class", width: 10 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Age", key: "age", width: 8 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Address", key: "address", width: 25 },
    ];

    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF667EEA" },
      };
    });

    students.forEach((student) => sheet.addRow(student));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=students.xlsx");

    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    return sendServerError(res, "Export failed. Please try again.");
  }
};

const importStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const sheet = workbook.worksheets[0];

    if (!sheet) {
      return res.status(400).json({ message: "Uploaded file does not contain a worksheet" });
    }

    const students = [];
    const errors = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const [name, email, className, gender, age, phone, address] = row.values.slice(1);
      if (!name || !email || !className || !gender || !age) {
        errors.push(`Row ${rowNumber}: Missing required fields`);
        return;
      }

      students.push({
        name,
        email: String(email).trim().toLowerCase(),
        class: className,
        gender,
        age,
        phone,
        address,
      });
    });

    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation errors", errors });
    }

    let inserted = 0;
    for (const studentData of students) {
      const exists = await Student.findOne({ email: studentData.email });
      if (!exists) {
        await Student.create(studentData);
        inserted += 1;
      }
    }

    await AuditLog.create({
      performedBy: req.user.id,
      action: "ADDED",
      details: `Imported ${inserted} students via Excel`,
    });

    return res.status(200).json({
      message: `Imported ${inserted} students successfully`,
      skipped: students.length - inserted,
    });
  } catch (error) {
    return sendServerError(res, "Import failed. Please check the file and try again.");
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const genderAgg = await Student.aggregate([
      { $group: { _id: "$gender", count: { $sum: 1 } } },
    ]);
    const classStats = await Student.aggregate([
      { $group: { _id: "$class", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const genderStats = { male: 0, female: 0, other: 0 };
    genderAgg.forEach((group) => {
      genderStats[group._id] = group.count;
    });

    return res.status(200).json({
      totalStudents,
      genderStats,
      classStats,
      totalClasses: classStats.length,
    });
  } catch (error) {
    return sendServerError(res);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  addStudent,
  updateStudent,
  deleteStudent,
  getDashboardStats,
  exportStudents,
  importStudents,
};
