import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import API from "../api/axios";
import Layout from "../components/Layout";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const EMPTY_FORM = {
    name: "", email: "", class: "",
    gender: "male", age: "", phone: "", address: "",
};

const Students = () => {
    const { user } = useSelector((state) => state.auth);
    const isAdmin = user?.role === "admin";
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [filterClass, setFilterClass] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editStudent, setEditStudent] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch students
    const { data, isLoading } = useQuery({
        queryKey: ["students", page, search, filterClass],
        queryFn: async () => {
            const res = await API.get("/students", {
                params: { page, limit: 8, name: search, class: filterClass },
            });
            return res.data;
        },
        keepPreviousData: true,
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => API.delete(`/students/${id}`),
        onSuccess: () => {
            toast.success("Student deleted ✅");
            queryClient.invalidateQueries(["students"]);
            queryClient.invalidateQueries(["dashboard"]);
        },
        onError: () => toast.error("Delete failed ❌"),
    });

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this student?")) {
            deleteMutation.mutate(id);
        }
    };

    const openAddModal = () => {
        setEditStudent(null);
        setFormData(EMPTY_FORM);
        setPhoto(null);
        setShowModal(true);
    };

    const openEditModal = (student) => {
        setEditStudent(student);
        setFormData({
            name: student.name,
            email: student.email,
            class: student.class,
            gender: student.gender,
            age: student.age,
            phone: student.phone || "",
            address: student.address || "",
        });
        setPhoto(null);
        setShowModal(true);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const fd = new FormData();
            Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
            if (photo) fd.append("photo", photo);

            if (editStudent) {
                await API.put(`/students/${editStudent._id}`, fd);
                toast.success("Student updated ✅");
            } else {
                await API.post("/students", fd);
                toast.success("Student added ✅");
            }

            queryClient.invalidateQueries(["students"]);
            queryClient.invalidateQueries(["dashboard"]);
            setShowModal(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong ❌");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleClassChange = (e) => {
        setFilterClass(e.target.value);
        setPage(1);
    };

    const handleExport = async () => {
        try {
            const res = await API.get("/students/export/excel", {
                responseType: "blob",
            });
            saveAs(new Blob([res.data]), "students.xlsx");
            toast.success("Exported successfully ✅");
        } catch {
            toast.error("Export failed ❌");
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append("file", file);
        try {
            const res = await API.post("/students/import/excel", fd);
            toast.success(res.data.message);
            queryClient.invalidateQueries(["students"]);
            queryClient.invalidateQueries(["dashboard"]);
        } catch (err) {
            toast.error(err.response?.data?.message || "Import failed ❌");
        }
        e.target.value = "";
    };

    return (
        <Layout>
            {/* Header */}
            <div className="students-header">
                <h1 className="students-title">Students 🎓</h1>
                {isAdmin && (
                    <button className="btn-primary" onClick={openAddModal}>
                        + Add Student
                    </button>
                )}
            </div>
            {/* Excel Actions */}
            {isAdmin && (
                <div className="excel-actions">
                    <button className="btn-export" onClick={handleExport}>
                        📥 Export Excel
                    </button>
                    <label className="btn-import">
                        📤 Import Excel
                        <input
                            type="file"
                            accept=".xlsx"
                            style={{ display: "none" }}
                            onChange={handleImport}
                        />
                    </label>
                </div>
            )}

            {/* Filters */}
            <div className="students-filters">
                <input
                    className="filter-input"
                    placeholder="🔍 Search by name..."
                    value={search}
                    onChange={handleSearchChange}
                />
                <input
                    className="filter-input"
                    placeholder="📚 Filter by class..."
                    value={filterClass}
                    onChange={handleClassChange}
                />
            </div>

            {/* Table */}
            <div className="students-table-wrapper">
                {isLoading ? (
                    <div className="no-students">Loading students... ⏳</div>
                ) : data?.students?.length === 0 ? (
                    <div className="no-students">No students found 😕</div>
                ) : (
                    <table className="students-table">
                        <thead>
                            <tr>
                                <th>Photo</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Class</th>
                                <th>Gender</th>
                                <th>Age</th>
                                <th>Phone</th>
                                {isAdmin && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {data?.students?.map((student) => (
                                <tr key={student._id}>
                                    <td>
                                        {student.photo ? (
                                            <img
                                                src={`http://localhost:5000/uploads/${student.photo}`}
                                                alt={student.name}
                                                className="student-photo"
                                            />
                                        ) : (
                                            <div className="student-photo-placeholder">
                                                {student.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </td>
                                    <td>{student.name}</td>
                                    <td>{student.email}</td>
                                    <td>{student.class}</td>
                                    <td>
                                        <span className={`badge badge-${student.gender}`}>
                                            {student.gender}
                                        </span>
                                    </td>
                                    <td>{student.age}</td>
                                    <td>{student.phone || "-"}</td>
                                    {isAdmin && (
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    className="btn-edit"
                                                    onClick={() => openEditModal(student)}
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    className="btn-danger"
                                                    onClick={() => handleDelete(student._id)}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {data?.totalPages > 1 && (
                <div className="pagination">
                    <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                        ← Prev
                    </button>
                    {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={page === p ? "active" : ""}
                        >
                            {p}
                        </button>
                    ))}
                    <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page === data?.totalPages}
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editStudent ? "✏️ Edit Student" : "➕ Add Student"}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        className="form-input"
                                        name="name"
                                        placeholder="Enter name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        className="form-input"
                                        name="email"
                                        type="email"
                                        placeholder="Enter email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Class</label>
                                    <input
                                        className="form-input"
                                        name="class"
                                        placeholder="e.g. 10A"
                                        value={formData.class}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Gender</label>
                                    <select
                                        className="form-input"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Age</label>
                                    <input
                                        className="form-input"
                                        name="age"
                                        type="number"
                                        placeholder="Enter age"
                                        value={formData.age}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        className="form-input"
                                        name="phone"
                                        placeholder="Enter phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <input
                                    className="form-input"
                                    name="address"
                                    placeholder="Enter address"
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Profile Photo</label>
                                <input
                                    className="form-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setPhoto(e.target.files[0])}
                                />
                            </div>

                            <button
                                type="submit"
                                className="form-submit-btn"
                                disabled={loading}
                            >
                                {loading
                                    ? "Saving..."
                                    : editStudent
                                        ? "Update Student"
                                        : "Add Student"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Students;