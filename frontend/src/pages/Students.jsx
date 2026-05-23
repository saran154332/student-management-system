import { useMemo, useState } from "react";
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

const StudentsSkeleton = () => (
    <div className="panel">
        {[1, 2, 3, 4, 5].map((item) => (
            <div className="student-row-skeleton" key={item}>
                <div className="skeleton skeleton-avatar" />
                <div className="skeleton skeleton-line" />
                <div className="skeleton skeleton-line short" />
                <div className="skeleton skeleton-pill" />
            </div>
        ))}
    </div>
);

const Students = () => {
    const { user } = useSelector((state) => state.auth);
    const isAdmin = user?.role === "admin";
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [filterClass, setFilterClass] = useState("");
    const [filterGender, setFilterGender] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editStudent, setEditStudent] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

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

    const students = useMemo(() => {
        const rows = data?.students || [];
        if (!filterGender) return rows;
        return rows.filter((student) => student.gender === filterGender);
    }, [data?.students, filterGender]);

    const deleteMutation = useMutation({
        mutationFn: (id) => API.delete(`/students/${id}`),
        onSuccess: () => {
            toast.success("Student deleted");
            queryClient.invalidateQueries(["students"]);
            queryClient.invalidateQueries(["dashboard"]);
        },
        onError: () => toast.error("Delete failed"),
    });

    const validateForm = () => {
        const nextErrors = {};
        if (!formData.name.trim()) nextErrors.name = "Name is required";
        if (!formData.email.trim()) nextErrors.email = "Email is required";
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            nextErrors.email = "Enter a valid email";
        }
        if (!formData.class.trim()) nextErrors.class = "Class is required";
        if (!formData.age || Number(formData.age) <= 0) nextErrors.age = "Enter a valid age";
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this student?")) {
            deleteMutation.mutate(id);
        }
    };

    const openAddModal = () => {
        setEditStudent(null);
        setFormData(EMPTY_FORM);
        setPhoto(null);
        setErrors({});
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
        setErrors({});
        setShowModal(true);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors((current) => ({ ...current, [e.target.name]: "" }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fix the highlighted fields");
            return;
        }

        setLoading(true);
        try {
            const fd = new FormData();
            Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
            if (photo) fd.append("photo", photo);

            if (editStudent) {
                await API.put(`/students/${editStudent._id}`, fd);
                toast.success("Student updated");
            } else {
                await API.post("/students", fd);
                toast.success("Student added");
            }

            queryClient.invalidateQueries(["students"]);
            queryClient.invalidateQueries(["dashboard"]);
            setShowModal(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const res = await API.get("/students/export/excel", {
                responseType: "blob",
            });
            saveAs(new Blob([res.data]), "students.xlsx");
            toast.success("Exported successfully");
        } catch {
            toast.error("Export failed");
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
            toast.error(err.response?.data?.message || "Import failed");
        }
        e.target.value = "";
    };

    return (
        <Layout>
            <div className="page-shell">
                <div className="page-header">
                    <div>
                        <p className="eyebrow">Directory</p>
                        <h1>Students</h1>
                        <p>Search, filter, edit, import, and export student records.</p>
                    </div>
                    {isAdmin && (
                        <button className="btn-primary" onClick={openAddModal}>
                            Add Student
                        </button>
                    )}
                </div>

                <div className="toolbar-card">
                    <div className="filter-grid">
                        <div className="form-field compact">
                            <label>Search</label>
                            <input
                                placeholder="Search by name..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <div className="form-field compact">
                            <label>Class</label>
                            <input
                                placeholder="Filter by class..."
                                value={filterClass}
                                onChange={(e) => {
                                    setFilterClass(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <div className="form-field compact">
                            <label>Gender</label>
                            <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)}>
                                <option value="">All</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="toolbar-actions">
                            <button className="btn-secondary" onClick={handleExport}>
                                Export Excel
                            </button>
                            <label className="btn-secondary">
                                Import Excel
                                <input
                                    type="file"
                                    accept=".xlsx"
                                    style={{ display: "none" }}
                                    onChange={handleImport}
                                />
                            </label>
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <StudentsSkeleton />
                ) : students.length === 0 ? (
                    <div className="empty-state panel">No students found</div>
                ) : (
                    <>
                        <div className="student-card-grid">
                            {students.slice(0, 4).map((student) => (
                                <div className="student-card" key={student._id}>
                                    {student.photo ? (
                                        <img
                                            src={`http://localhost:5000/uploads/${student.photo}`}
                                            alt={student.name}
                                            className="student-card-avatar"
                                        />
                                    ) : (
                                        <div className="student-card-avatar placeholder">
                                            {student.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <h3>{student.name}</h3>
                                        <p>{student.email}</p>
                                    </div>
                                    <span className="status-badge active">Active</span>
                                </div>
                            ))}
                        </div>

                        <div className="table-panel">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Email</th>
                                        <th>Class</th>
                                        <th>Gender</th>
                                        <th>Age</th>
                                        <th>Status</th>
                                        {isAdmin && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student) => (
                                        <tr key={student._id}>
                                            <td>
                                                <div className="student-cell">
                                                    {student.photo ? (
                                                        <img
                                                            src={`http://localhost:5000/uploads/${student.photo}`}
                                                            alt={student.name}
                                                            className="table-avatar"
                                                        />
                                                    ) : (
                                                        <div className="table-avatar placeholder">
                                                            {student.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <strong>{student.name}</strong>
                                                        <span>{student.phone || "No phone"}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{student.email}</td>
                                            <td>{student.class}</td>
                                            <td><span className={`badge badge-${student.gender}`}>{student.gender}</span></td>
                                            <td>{student.age}</td>
                                            <td><span className="status-badge active">Active</span></td>
                                            {isAdmin && (
                                                <td>
                                                    <div className="table-actions">
                                                        <button className="btn-text" onClick={() => openEditModal(student)}>
                                                            Edit
                                                        </button>
                                                        <button className="btn-danger-soft" onClick={() => handleDelete(student._id)}>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {data?.totalPages > 1 && (
                    <div className="pagination">
                        <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                            Prev
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
                            Next
                        </button>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="student-form-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <p className="eyebrow">Student record</p>
                                <h2>{editStudent ? "Edit Student" : "Add Student"}</h2>
                            </div>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                X
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="student-form">
                            <div className="form-row">
                                <div className={`form-field ${errors.name ? "has-error" : ""}`}>
                                    <label>Full Name</label>
                                    <input name="name" placeholder="Aarav Sharma" value={formData.name} onChange={handleChange} />
                                    {errors.name && <span>{errors.name}</span>}
                                </div>
                                <div className={`form-field ${errors.email ? "has-error" : ""}`}>
                                    <label>Email</label>
                                    <input name="email" type="email" placeholder="student@school.edu" value={formData.email} onChange={handleChange} />
                                    {errors.email && <span>{errors.email}</span>}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className={`form-field ${errors.class ? "has-error" : ""}`}>
                                    <label>Class</label>
                                    <input name="class" placeholder="10A" value={formData.class} onChange={handleChange} />
                                    {errors.class && <span>{errors.class}</span>}
                                </div>
                                <div className="form-field">
                                    <label>Gender</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange}>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className={`form-field ${errors.age ? "has-error" : ""}`}>
                                    <label>Age</label>
                                    <input name="age" type="number" placeholder="15" value={formData.age} onChange={handleChange} />
                                    {errors.age && <span>{errors.age}</span>}
                                </div>
                                <div className="form-field">
                                    <label>Phone</label>
                                    <input name="phone" placeholder="+91 98765 43210" value={formData.phone} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="form-field">
                                <label>Address</label>
                                <input name="address" placeholder="Student address" value={formData.address} onChange={handleChange} />
                            </div>

                            <div className="form-field">
                                <label>Profile Photo</label>
                                <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />
                            </div>

                            <button type="submit" className="btn-primary full-width" disabled={loading}>
                                {loading ? "Saving..." : editStudent ? "Update Student" : "Add Student"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Students;
