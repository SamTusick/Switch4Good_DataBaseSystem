import { useState, useEffect } from "react";

const API_URL = "http://localhost:5000/api";

// =============================================
// EXPORT UTILITIES
// =============================================
const exportToCSV = (data, filename, columns) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }
  
  const headers = columns.map(col => col.label).join(',');
  const rows = data.map(row => 
    columns.map(col => {
      let val = row[col.key] ?? '';
      // Escape quotes and wrap in quotes if contains comma
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        val = '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    }).join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

const exportToPDF = (data, filename, columns, title) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }
  
  // Create printable HTML
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #2e7d32; margin-bottom: 20px; }
        table { border-collapse: collapse; width: 100%; font-size: 10px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background-color: #2e7d32; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .export-date { color: #666; margin-bottom: 10px; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      <h1>🌱 Switch4Good - ${title}</h1>
      <p class="export-date">Exported: ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>${columns.map(col => `<th>${col.label}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${data.map(row => `<tr>${columns.map(col => `<td>${row[col.key] ?? '-'}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
};

// =============================================
// LOGIN COMPONENT
// =============================================
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Switch4Good</h1>
          <p>Campus Advocacy Network</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <h2>Sign In</h2>
          {error && <div className="login-error">{error}</div>}
          <div className="form-group">
            <label>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" required autoFocus autoComplete="username" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required autoComplete="current-password" />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <div className="security-notice">
            <p>Secure Connection</p>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================
// MAIN APP COMPONENT
// =============================================
function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("schools");
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState({ status: "loading", message: "Connecting..." });
  const [saveStatus, setSaveStatus] = useState({ show: false, message: "", type: "" });
  const [filter, setFilter] = useState("");

  // Data states - Normalized tables with data
  const [programs, setPrograms] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentTracker, setStudentTracker] = useState([]);
  const [canMetrics, setCanMetrics] = useState([]);
  const [programDirectory, setProgramDirectory] = useState([]);
  const [schools, setSchools] = useState([]);
  const [dashboard, setDashboard] = useState({});

  // Check for existing session
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      fetch(`${API_URL}/verify`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) setUser(JSON.parse(savedUser));
          else { localStorage.removeItem("token"); localStorage.removeItem("user"); }
        })
        .catch(() => { localStorage.removeItem("token"); localStorage.removeItem("user"); });
    }
  }, []);

  useEffect(() => {
    if (user) { testConnection(); fetchAll(); }
  }, [user]);

  const handleLogin = (userData) => setUser(userData);
  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); setUser(null); };
  const getAuthHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` });

  const showSaveStatus = (message, type = "success") => {
    setSaveStatus({ show: true, message, type });
    setTimeout(() => setSaveStatus({ show: false, message: "", type: "" }), 3000);
  };

  const testConnection = async () => {
    try {
      const response = await fetch(`${API_URL}/test-db`);
      const data = await response.json();
      setDbStatus(data.success ? { status: "success", message: "Connected" } : { status: "error", message: data.error });
    } catch (err) {
      setDbStatus({ status: "error", message: "Cannot connect" });
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchPrograms(), fetchStudents(), fetchStudentTracker(), fetchCanMetrics(), fetchProgramDirectory(), fetchSchools(), fetchDashboard()]);
    setLoading(false);
  };

  const fetchPrograms = async () => {
    try {
      const response = await fetch(`${API_URL}/programs`, { headers: getAuthHeaders() });
      if (response.ok) setPrograms(await response.json());
      else if (response.status === 401) handleLogout();
    } catch (err) { console.log("Error:", err); }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/students`, { headers: getAuthHeaders() });
      if (response.ok) setStudents(await response.json());
      else if (response.status === 401) handleLogout();
    } catch (err) { console.log("Error:", err); }
  };

  const fetchStudentTracker = async () => {
    try {
      const response = await fetch(`${API_URL}/student-tracker`, { headers: getAuthHeaders() });
      if (response.ok) setStudentTracker(await response.json());
      else if (response.status === 401) handleLogout();
    } catch (err) { console.log("Error:", err); }
  };

  const fetchCanMetrics = async () => {
    try {
      const response = await fetch(`${API_URL}/can-metrics`, { headers: getAuthHeaders() });
      if (response.ok) setCanMetrics(await response.json());
      else if (response.status === 401) handleLogout();
    } catch (err) { console.log("Error:", err); }
  };

  const fetchProgramDirectory = async () => {
    try {
      const response = await fetch(`${API_URL}/program-directory`, { headers: getAuthHeaders() });
      if (response.ok) setProgramDirectory(await response.json());
      else if (response.status === 401) handleLogout();
    } catch (err) { console.log("Error:", err); }
  };

  const fetchSchools = async () => {
    try {
      const response = await fetch(`${API_URL}/schools`, { headers: getAuthHeaders() });
      if (response.ok) setSchools(await response.json());
      else if (response.status === 401) handleLogout();
    } catch (err) { console.log("Error:", err); }
  };

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard`, { headers: getAuthHeaders() });
      if (response.ok) setDashboard(await response.json());
      else if (response.status === 401) handleLogout();
    } catch (err) { console.log("Error:", err); }
  };

  // CRUD Operations
  const saveData = async (endpoint, id, data, tableName) => {
    if (user?.role === "viewer") { showSaveStatus("View-only cannot edit", "error"); return false; }
    try {
      const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
        method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(data)
      });
      if (response.ok) { showSaveStatus(`✓ Saved to ${tableName}`, "success"); return true; }
      showSaveStatus("Failed to save", "error"); return false;
    } catch (err) { showSaveStatus("Error: " + err.message, "error"); return false; }
  };

  const deleteRow = async (endpoint, id, tableName) => {
    if (user?.role === "viewer") { showSaveStatus("View-only cannot delete", "error"); return; }
    if (!confirm(`Delete this ${tableName} record?`)) return;
    try {
      const response = await fetch(`${API_URL}/${endpoint}/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (response.ok) { showSaveStatus(`✓ Deleted`, "success"); fetchAll(); }
      else showSaveStatus("Failed to delete", "error");
    } catch (err) { showSaveStatus("Error: " + err.message, "error"); }
  };

  const addNewRow = async (endpoint, defaultData, tableName) => {
    if (user?.role === "viewer") { showSaveStatus("View-only cannot add", "error"); return; }
    try {
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: "POST", headers: getAuthHeaders(), body: JSON.stringify(defaultData)
      });
      if (response.ok) { showSaveStatus(`✓ Added ${tableName}`, "success"); fetchAll(); }
      else showSaveStatus("Failed to add", "error");
    } catch (err) { showSaveStatus("Error: " + err.message, "error"); }
  };

  // Editable Cell Component
  const EditableCell = ({ value, rowId, field, endpoint, tableName, className = "" }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value || "");
    const canEdit = user?.role !== "viewer";

    const handleSave = async () => {
      if (editValue !== value) {
        const success = await saveData(endpoint, rowId, { [field]: editValue }, tableName);
        if (success) fetchAll();
      }
      setIsEditing(false);
    };

    if (isEditing && canEdit) {
      return (
        <td className={className}>
          <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave} onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setEditValue(value || ""); setIsEditing(false); } }}
            autoFocus className="cell-input" />
        </td>
      );
    }
    return (
      <td className={`${className} ${canEdit ? "editable-cell" : ""}`} onClick={() => canEdit && setIsEditing(true)} title={canEdit ? "Click to edit" : "View only"}>
        {value || "-"}
      </td>
    );
  };

  // Filter data
  const filterData = (data) => {
    if (!filter) return data;
    return data.filter(row => Object.values(row).some(val => String(val).toLowerCase().includes(filter.toLowerCase())));
  };

  // Column definitions for each table
  const programsColumns = [
    { key: 'id', label: 'ID' }, { key: 'program', label: 'Program' }, { key: 'school', label: 'School' },
    { key: 'website', label: 'Website' }, { key: 'program_type', label: 'Type' },
    { key: 'needs_formalization', label: 'Needs Formalization' }, { key: 'notes', label: 'Notes' }
  ];

  const studentsColumns = [
    { key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'email_address', label: 'Email' },
    { key: 'pronouns', label: 'Pronouns' }, { key: 'tshirt_size', label: 'T-Shirt' },
    { key: 'year_in_school', label: 'Year' }, { key: 'areas_of_interest', label: 'Areas of Interest' }
  ];

  const studentTrackerColumns = [
    { key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'email_address', label: 'Email' },
    { key: 'pronouns', label: 'Pronouns' }, { key: 'tshirt_size', label: 'T-Shirt' },
    { key: 'year_in_school', label: 'Year' }, { key: 'areas_of_interest', label: 'Areas of Interest' },
    { key: 'program', label: 'Program' }, { key: 'school', label: 'School' }, { key: 'sg4_staff', label: 'SG4 Staff' },
    { key: 'semester', label: 'Semester' }, { key: 'project', label: 'Project' },
    { key: 'project_start_date', label: 'Start Date' }, { key: 'project_end_date', label: 'End Date' },
    { key: 'meeting_cadence', label: 'Meeting Cadence' }, { key: 'conflicting_datetimes', label: 'Conflicts' },
    { key: 'success_metric', label: 'Success Metric' }, { key: 'total_hours', label: 'Total Hours' }
  ];

  const canMetricsColumns = [
    { key: 'id', label: 'ID' }, { key: 'date', label: 'Date' }, { key: 'is_ongoing', label: 'Ongoing' },
    { key: 'impression', label: 'Impression' }, { key: 'touchpoints', label: 'Touchpoints' },
    { key: 'engagements', label: 'Engagements' }, { key: 'conversions', label: 'Conversions' }, { key: 'notes', label: 'Notes' }
  ];

  const programDirectoryColumns = [
    { key: 'id', label: 'ID' }, { key: 'program', label: 'Program' }, { key: 'website', label: 'Website' },
    { key: 'program_type', label: 'Type' }, { key: 'school', label: 'School' }, { key: 'semester', label: 'Semester' },
    { key: 'is_active', label: 'Active' }, { key: 'most_recent_contact_date', label: 'Last Contact' },
    { key: 'sg4_staff_contact', label: 'SG4 Contact' }, { key: 'partner_email', label: 'Partner Email' },
    { key: 'notes', label: 'Notes' }, { key: 'needs_formalization', label: 'Needs Formalization' }
  ];

  const schoolsColumns = [
    { key: 'school_id', label: 'ID' }, { key: 'school_name', label: 'School Name' }
  ];

  // Render table with all columns
  const renderTable = (data, columns, endpoint, tableName, defaultNew) => {
    const filteredData = filterData(data);
    const idField = columns.find(c => c.key.includes('id'))?.key || 'id';
    return (
      <div className="spreadsheet-container">
        <div className="table-header">
          <h3>{tableName} ({filteredData.length} records)</h3>
          <div className="table-actions">
            <input type="text" placeholder="🔍 Filter..." value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-input" />
            <button onClick={() => exportToCSV(filteredData, endpoint, columns)} className="export-btn csv">📥 CSV</button>
            <button onClick={() => exportToPDF(filteredData, endpoint, columns, tableName)} className="export-btn pdf">📄 PDF</button>
            {user?.role !== "viewer" && (
              <button onClick={() => addNewRow(endpoint, defaultNew, tableName)} className="add-btn">➕ Add Row</button>
            )}
          </div>
        </div>
        <div className="table-wrapper">
          <table className="spreadsheet">
            <thead>
              <tr>
                {columns.map(col => <th key={col.key}>{col.label}</th>)}
                {user?.role !== "viewer" && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="no-data">No data found</td></tr>
              ) : (
                filteredData.map(row => (
                  <tr key={row[idField]}>
                    {columns.map(col => (
                      col.key.includes('id') ? <td key={col.key}>{row[col.key]}</td> :
                      <EditableCell key={col.key} value={row[col.key]} rowId={row[idField]} field={col.key} endpoint={endpoint} tableName={tableName} />
                    ))}
                    {user?.role !== "viewer" && (
                      <td><button onClick={() => deleteRow(endpoint, row[idField], tableName)} className="delete-btn">🗑️</button></td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Show login if not authenticated
  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>SWITCH4GOOD</h1>
        </div>
        <div className="header-right">
          <span className={`db-status ${dbStatus.status}`}>
            {dbStatus.status === "success" ? "🟢" : "🔴"} {dbStatus.message}
          </span>
          <div className="user-info">
            <span>👤 {user.name}</span>
            <span className="user-role">({user.role})</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      {saveStatus.show && <div className={`save-toast ${saveStatus.type}`}>{saveStatus.message}</div>}

      <div className="dashboard-stats">
        <div className="stat-card"><span className="stat-number">{schools.length}</span><span className="stat-label">Schools</span></div>
        <div className="stat-card"><span className="stat-number">{programs.length}</span><span className="stat-label">Programs</span></div>
        <div className="stat-card"><span className="stat-number">{students.length}</span><span className="stat-label">Students</span></div>
        <div className="stat-card"><span className="stat-number">{studentTracker.length}</span><span className="stat-label">Participation</span></div>
        <div className="stat-card"><span className="stat-number">{canMetrics.length}</span><span className="stat-label">CAN Metrics</span></div>
        <div className="stat-card"><span className="stat-number">{programDirectory.length}</span><span className="stat-label">Directory</span></div>
      </div>

      <div className="spreadsheet-tabs">
        <button className={activeTab === "schools" ? "active" : ""} onClick={() => { setActiveTab("schools"); setFilter(""); }}>
          🏫 Schools
        </button>
        <button className={activeTab === "programs" ? "active" : ""} onClick={() => { setActiveTab("programs"); setFilter(""); }}>
          📚 Programs
        </button>
        <button className={activeTab === "students" ? "active" : ""} onClick={() => { setActiveTab("students"); setFilter(""); }}>
          👨‍🎓 Students
        </button>
        <button className={activeTab === "student-tracker" ? "active" : ""} onClick={() => { setActiveTab("student-tracker"); setFilter(""); }}>
          📊 Student Tracker
        </button>
        <button className={activeTab === "can-metrics" ? "active" : ""} onClick={() => { setActiveTab("can-metrics"); setFilter(""); }}>
          📈 CAN Metrics
        </button>
        <button className={activeTab === "program-directory" ? "active" : ""} onClick={() => { setActiveTab("program-directory"); setFilter(""); }}>
          📁 Program Directory
        </button>
      </div>

      <main className="main-content">
        {loading ? (
          <div className="loading">Loading data...</div>
        ) : (
          <>
            {activeTab === "schools" && renderTable(
              schools, schoolsColumns, "schools", "🏫 Schools",
              { school_name: "New School" }
            )}
            {activeTab === "programs" && renderTable(
              programs, programsColumns, "programs", "📚 Programs",
              { program_name: "New Program", school_id: null, website: "", program_type: "", notes: "" }
            )}
            {activeTab === "students" && renderTable(
              students, studentsColumns, "students", "👨‍🎓 Students",
              { full_name: "New Student", email: "", pronouns: "", tshirt_size: "", year_in_school: "", areas_of_interest: "" }
            )}
            {activeTab === "student-tracker" && renderTable(
              studentTracker, studentTrackerColumns, "student-tracker", "📊 Student Participation",
              { name: "New Entry" }
            )}
            {activeTab === "can-metrics" && renderTable(
              canMetrics, canMetricsColumns, "can-metrics", "📈 CAN Metrics",
              { metric_date: null, impression: "", touchpoints: 0, engagements: 0, conversions: 0, notes: "" }
            )}
            {activeTab === "program-directory" && renderTable(
              programDirectory, programDirectoryColumns, "program-directory", "📁 Program Directory",
              { program: "New Program" }
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Switch4Good CAN - Secure Data Management System</p>
        {user?.role !== "viewer" && <p className="edit-hint">Click any cell to edit - Changes save automatically</p>}
      </footer>
    </div>
  );
}

export default App;
