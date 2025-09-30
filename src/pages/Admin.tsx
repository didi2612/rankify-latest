import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Modal from "../components/Modal";
import QRCode from "react-qr-code";
import Cookies from "js-cookie";
import { Menu, X, User, LogOut, Download, Trash2, PlusCircle, Server, Code } from "lucide-react"; // Importing professional icons

const SUPABASE_URL = "https://pftyzswxwkheomnqzytu.supabase.co";
const SUPABASE_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHl6c3d4d2toZW9tbnF6eXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjczNzksImV4cCI6MjA2OTM0MzM3OX0.TI9DGipYP9X8dSZSUh5CVQIbeYnf9vhNXAqw5e5ZVkk";

type TableType = "participants" | "judges" | "scores";

const tableColumns: Record<TableType, string[]> = {
  participants: ["name", "project_title", "institution", "email", "phone", "category"],
  judges: ["name", "email", "username", "password", "avatar_url"],
  scores: [
    "participant_id",
    "judge_id",
    "innovation_score",
    "impact_score",
    "feasibility_score",
    "comments",
  ],
};

export default function AdminPanel() {
  const [selectedTable, setSelectedTable] = useState<TableType>("participants");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newRow, setNewRow] = useState<any>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [participants, setParticipants] = useState<any[]>([]);
const [judges, setJudges] = useState<any[]>([]);
const [editing, setEditing] = useState<{ rowId: string | null; col: string | null }>({
  rowId: null,
  col: null,
});
const [editValue, setEditValue] = useState("");



const handleSaveScore = async (rowId: string, col: string, newValue: string) => {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/scores?id=eq.${rowId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_API_KEY,
        Authorization: `Bearer ${SUPABASE_API_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ [col]: Number(newValue) }),
    });

    if (res.ok) {
      // update local data instantly
      setData((prev) =>
        prev.map((row) =>
          row.id === rowId ? { ...row, [col]: Number(newValue) } : row
        )
      );
    } else {
      console.error("Failed to update");
    }
  } catch (err) {
    console.error(err);
  } finally {
    setEditing({ rowId: null, col: null });
  }
};


  // Helper to map table type to a display name
  const tableDisplayNames: Record<TableType, string> = {
    participants: "Participants",
    judges: "Judges",
    scores: "Scores",
  };
useEffect(() => {
  if (accountType === "SuperAdmin") {
    fetchTableData(selectedTable);

    // fetch participants
    fetch(`${SUPABASE_URL}/rest/v1/participants?select=id,name`, {
      headers: { apikey: SUPABASE_API_KEY, Authorization: `Bearer ${SUPABASE_API_KEY}` },
    })
      .then((res) => res.json())
      .then(setParticipants);

    // fetch judges
    fetch(`${SUPABASE_URL}/rest/v1/judges?select=id,name`, {
      headers: { apikey: SUPABASE_API_KEY, Authorization: `Bearer ${SUPABASE_API_KEY}` },
    })
      .then((res) => res.json())
      .then(setJudges);
  }
}, [selectedTable, accountType]);
const getParticipantName = (id: string) => {
  const p = participants.find((x) => String(x.id) === String(id));
  return p ? p.name : `ID ${id}`;
};

const getJudgeName = (id: string) => {
  const j = judges.find((x) => String(x.id) === String(id));
  return j ? j.name : `ID ${id}`;
};

  // ------------------- Fetch user from cookie -------------------
  useEffect(() => {
    const username = Cookies.get("username");
    if (!username) {
      setAccountType(null);
      return;
    }

    const fetchAccountType = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/judges?username=eq.${username}&select=account_type`,
          {
            headers: { apikey: SUPABASE_API_KEY, Authorization: `Bearer ${SUPABASE_API_KEY}` },
          }
        );
        const result = await res.json();
        if (result.length > 0) setAccountType(result[0].account_type);
        else setAccountType(null);
      } catch (err) {
        console.error(err);
        setAccountType(null);
      }
    };

    fetchAccountType();
  }, []);

  // ------------------- Fetch Table Data -------------------
  const fetchTableData = async (table: TableType) => {
    if (accountType !== "SuperAdmin") return;
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
        headers: { apikey: SUPABASE_API_KEY, Authorization: `Bearer ${SUPABASE_API_KEY}` },
      });
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch data");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (accountType === "SuperAdmin") fetchTableData(selectedTable);
  }, [selectedTable, accountType]);

  // ------------------- Delete -------------------
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${selectedTable}?id=eq.${id}`, {
        method: "DELETE",
        headers: { apikey: SUPABASE_API_KEY, Authorization: `Bearer ${SUPABASE_API_KEY}` },
      });
      if (res.ok) {
        toast.success("Record deleted successfully");
        fetchTableData(selectedTable);
      } else toast.error("Failed to delete record");
    } catch (err) {
      console.error(err);
      toast.error("Error deleting record");
    }
  };

  // ------------------- Save -------------------
  const handleSave = async (row: any, isNew = false) => {
    try {
      // Clean up empty strings or nulls to allow Supabase defaults/nullability to work
      const dataToSave = Object.fromEntries(
        Object.entries(row).filter(([_, value]) => value !== "" && value !== null)
      );

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${selectedTable}${isNew ? "" : `?id=eq.${row.id}`}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_API_KEY,
            Authorization: `Bearer ${SUPABASE_API_KEY}`,
            Prefer: "return=representation",
          },
          body: JSON.stringify(dataToSave),
        }
      );
      if (res.ok) {
        toast.success(isNew ? "Record created successfully" : "Record updated successfully");
        fetchTableData(selectedTable);
        setNewRow({});
        setIsModalOpen(false);
      } else {
        const errorText = await res.text();
        toast.error(`Failed to save: ${errorText.substring(0, 100)}...`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving record");
    }
  };

  // ------------------- QR -------------------
  const downloadQRCode = (value: string, filename = "qrcode.png") => {
    const svgElement = document.getElementById(`qr-${value}`);
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    // Use Blob to handle SVG content securely and correctly
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Set canvas size to match the SVG for a high-quality download
      const size = 300; // Increased size for better quality download
      canvas.width = size;
      canvas.height = size;
      
      // Calculate scale factor to center and fill the canvas
      const scale = Math.min(size / img.width, size / img.height);
      const x = (size / 2) - (img.width / 2) * scale;
      const y = (size / 2) - (img.height / 2) * scale;
      
      // Draw the image, ensuring a white background for the QR code
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      }
      
      URL.revokeObjectURL(url);

      const pngImg = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngImg;
      link.download = filename;
      link.click();
    };

    img.src = url;
  };

  // ------------------- Access Denied -------------------
  if (accountType !== "SuperAdmin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white flex-col px-6">
        <div className="p-10 rounded-xl bg-gray-800/50 backdrop-blur-sm border border-red-700 shadow-2xl">
          <h1 className="text-4xl font-extrabold text-red-500 mb-4 flex items-center gap-3">
            <X className="w-8 h-8"/> Access Denied
          </h1>
          <p className="text-gray-400 mb-6 text-center">
            You must be logged in as a **SuperAdmin** to view this page.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
          >
            Go to Login / Homepage
          </button>
        </div>
      </div>
    );
  }

  // ------------------- Main Render -------------------
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-950 text-white font-sans">
      
      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-20 top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col gap-8 transition-transform duration-300 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-amber-400">Admin Panel</h2>
            <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden text-gray-400 hover:text-white"
            >
                <X className="w-6 h-6"/>
            </button>
        </div>

        <button
          onClick={() => (window.location.href = "/profile")}
          className="flex items-center gap-3 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-medium hover:bg-gray-700/70 transition-colors shadow-md"
        >
          <User className="w-5 h-5 text-blue-400" />
          User Profile
        </button>

        <div>
            <h3 className="text-gray-400 uppercase font-bold text-xs tracking-wider mb-3">Data Tables</h3>
            {(["participants", "judges", "scores"] as TableType[]).map((t) => (
                <button
                    key={t}
                    onClick={() => {setSelectedTable(t); setSidebarOpen(false);}}
                    className={`w-full text-left flex items-center gap-3 px-4 py-2 my-1 rounded-lg font-medium transition duration-150 ${
                        selectedTable === t 
                            ? "bg-amber-500 text-gray-900 shadow-md" 
                            : "hover:bg-gray-800 text-gray-300"
                    }`}
                >
                    <Server className="w-4 h-4"/>
                    {tableDisplayNames[t]}
                </button>
            ))}
        </div>
        
        {/* Logout Button - Added for completeness */}
        <button
            onClick={() => { Cookies.remove('username'); window.location.href = "/"}}
            className="mt-auto flex items-center gap-3 px-4 py-3 bg-red-600 rounded-lg text-white font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
        >
          <LogOut className="w-5 h-5"/>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10">
        {/* Mobile Toggle Button */}
        <button
          className="md:hidden fixed top-4 left-4 z-30 p-2 bg-amber-500 rounded-lg text-gray-900 font-bold shadow-lg"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-6 h-6"/>
        </button>
        
        <header className="mb-8 mt-12 md:mt-0">
            <h1 className="text-4xl font-extrabold text-white mb-2">
                <span className="text-amber-500">{tableDisplayNames[selectedTable]}</span> Management
            </h1>
            <p className="text-gray-400">
                Viewing and managing data for the **{tableDisplayNames[selectedTable]}** table.
            </p>
        </header>


        {/* Add New */}
        {selectedTable !== "scores" && (
          <div className="flex justify-end mb-8">
            <button
              onClick={() => {
                setNewRow({});
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-colors duration-200"
            >
              <PlusCircle className="w-5 h-5"/>
              Add New {tableDisplayNames[selectedTable].slice(0, -1)}
            </button>
          </div>
        )}
{/* Search Box */}
<div className="flex justify-start mb-6">
  <div className="relative w-full max-w-sm">
    {/* Search Icon */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
    </svg>

    {/* Input */}
    <input
      type="text"
      placeholder={`Search ${tableDisplayNames[selectedTable]}...`}
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-sm hover:border-gray-600"
    />
  </div>
</div>


        {/* Data Display Area */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
             <p className="text-gray-400 animate-pulse text-lg">Loading {tableDisplayNames[selectedTable]} data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex justify-center items-center h-64">
             <p className="text-gray-400 text-lg">No records found in **{tableDisplayNames[selectedTable]}**.</p>
          </div>
        ) : selectedTable === "participants" ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
           {data
  .filter((row) =>
    Object.values(row).some((val) =>
     String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  )
  .map((row) => (
              <div
                key={row.id}
                className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl transition-all duration-300 hover:shadow-amber-500/20"
              >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-col">
                        <h3 className="text-white font-bold text-lg">{row.name}</h3>
                        <p className="text-amber-400 text-sm font-medium">{row.project_title}</p>
                        <p className="text-gray-400 text-xs mt-1">{row.institution}</p>
                    </div>
                    <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">{row.category}</span>
                </div>
                
                <div className="mt-4 flex justify-between items-center gap-4 border-t border-gray-700 pt-4">
                  <div className="flex flex-col items-center">
                    <QRCode id={`qr-${row.id}`} value={`${row.id}`} size={70} bgColor="#ffffff" fgColor="#000000" />
                    <p className="text-gray-500 text-xs mt-1">ID: {row.id}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => downloadQRCode(row.name, `${row.name.replace(/\s/g, '_')}_QR.png`)}
                      className="flex items-center justify-center gap-1 px-3 py-1 text-sm rounded-md bg-green-600 hover:bg-green-700 text-white font-medium transition"
                    >
                      <Download className="w-4 h-4" /> Download QR
                    </button>
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="flex items-center justify-center gap-1 px-3 py-1 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white font-medium transition"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : selectedTable === "judges" ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {data
  .filter((judge) =>
    Object.values(judge).some((val) =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  )
  .map((judge) => (
              <div
                key={judge.id}
                className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl transition-all duration-300 hover:shadow-amber-500/20 flex flex-col items-center text-center"
              >
                <img
                  src={judge.avatar_url || "/default-avatar.png"}
                  alt={judge.name}
                  className="w-20 h-20 rounded-full border-4 border-amber-500 mb-4 object-cover shadow-lg"
                />
                <h3 className="text-white font-bold text-lg">{judge.name}</h3>
                <p className="text-gray-300 text-sm">@{judge.username || "no_username"}</p>
                <p className="text-gray-400 text-sm mb-4">{judge.email}</p>
                <button
                  onClick={() => handleDelete(judge.id)}
                  className="mt-2 w-full max-w-[120px] px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition shadow-md shadow-red-500/30"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
            // Scores Table: Clean, tabular presentation is often better, but keeping the card layout for consistency and simplicity.
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data
  .filter((row) => {
    return tableColumns[selectedTable].some((col) => {
      let value;

      // resolve special columns
      if (col === "participant_id") {
        value = getParticipantName(row[col]); // 👈 use name instead of id
      } else if (col === "judge_id") {
        value = getJudgeName(row[col]);
      } else {
        value = row[col];
      }

      return String(value)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    });
  })
  .map((row) => (
              <div
                key={row.id}
                className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl transition-all duration-300 hover:shadow-amber-500/20"
              >
                <h4 className="text-lg font-bold text-amber-400 mb-3">Score ID: {row.id}</h4>
                {tableColumns[selectedTable].map((col) => (
                  <div key={col} className="flex justify-between border-b border-gray-700/50 py-2 last:border-b-0">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">{col.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
  {editing.rowId === row.id && editing.col === col ? (
    <>
      <input
        type="number"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="bg-gray-900 text-white border border-gray-700 rounded px-2 py-1 w-20"
        autoFocus
      />
      <button
        onClick={() => handleSaveScore(row.id, col, editValue)}
        className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
      >
        Save
      </button>
      <button
        onClick={() => setEditing({ rowId: null, col: null })}
        className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded"
      >
        Cancel
      </button>
    </>
  ) : (
    <>
      <span
        className={`text-white font-medium ${
          col.includes("score") ? "text-lg text-blue-300" : "text-sm"
        }`}
      >
        {col === "participant_id"
          ? getParticipantName(row[col])
          : col === "judge_id"
          ? getJudgeName(row[col])
          : row[col]}
      </span>
      {col.includes("score") && (
        <button
          onClick={() => {
            setEditing({ rowId: row.id, col });
            setEditValue(row[col]);
          }}
          className="px-2 py-1 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded"
        >
          Edit
        </button>
      )}
    </>
  )}
</div>



                  </div>
                ))}
                {/* No delete button for scores as they should likely be updated, not deleted */}
              </div>
            ))}
          </div>
        )}

        {/* Modal for Add New */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div className="relative w-full max-w-lg p-10 rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl shadow-black/70">
            <h2 className="text-3xl font-extrabold text-center text-amber-400 mb-8">
                <PlusCircle className="inline w-7 h-7 mr-2"/>
              Add New {tableDisplayNames[selectedTable].slice(0, -1)}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tableColumns[selectedTable].map((col) => (
                <div key={col} className="flex flex-col">
                  <label className="text-gray-400 text-sm mb-2 uppercase font-medium tracking-wider">{col.replace(/_/g, ' ')}</label>
                  <input
                    type={
                        col.includes('password') ? 'password' :
                        col.includes('email') ? 'email' :
                        col.includes('score') ? 'number' :
                        'text'
                    }
                    placeholder={`Enter ${col.replace(/_/g, ' ')}`}
                    value={newRow[col] ?? ""}
                    onChange={(e) => setNewRow({ ...newRow, [col]: e.target.value })}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-sm"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => handleSave(newRow, true)}
              className="mt-10 w-full py-3 rounded-lg bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/40 hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center gap-2"
            >
                <Code className="w-5 h-5"/>
              Create Record
            </button>
          </div>
        </Modal>
      </main>
    </div>
  );
}