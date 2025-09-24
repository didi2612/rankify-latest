import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Modal from "../components/Modal";
import QRCode from "react-qr-code";
import Cookies from "js-cookie"; // npm install js-cookie

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
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${selectedTable}?id=eq.${id}`, {
        method: "DELETE",
        headers: { apikey: SUPABASE_API_KEY, Authorization: `Bearer ${SUPABASE_API_KEY}` },
      });
      if (res.ok) {
        toast.success("Record deleted");
        fetchTableData(selectedTable);
      } else toast.error("Failed to delete");
    } catch (err) {
      console.error(err);
      toast.error("Error deleting");
    }
  };

  // ------------------- Save -------------------
  const handleSave = async (row: any, isNew = false) => {
    try {
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
          body: JSON.stringify(row),
        }
      );
      if (res.ok) {
        toast.success(isNew ? "Record created" : "Record updated");
        fetchTableData(selectedTable);
        setNewRow({});
        setIsModalOpen(false);
      } else toast.error("Failed to save");
    } catch (err) {
      console.error(err);
      toast.error("Error saving");
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

    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
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
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white flex-col px-6">
        <h1 className="text-4xl font-extrabold text-red-500 mb-4">Access Denied</h1>
        <p className="text-gray-400 mb-6 text-center">
          You do not have permission to view this page.
        </p>
        <button
          onClick={() => (window.location.href = "/")}
          className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-xl hover:scale-105 transition-transform"
        >
          Go to Homepage
        </button>
      </div>
    );
  }

  // ------------------- Main Render -------------------
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-b from-gray-900 via-black to-gray-950 text-white font-inter">
      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-20 top-0 left-0 h-full w-64 bg-gray-900/80 backdrop-blur-lg border-r border-gray-700 p-6 flex flex-col gap-6 transition-transform duration-300 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden mb-4 text-gray-400 font-bold"
        >
          Close
        </button>

        <button
          onClick={() => (window.location.href = "/profile")}
          className="flex items-center gap-2 px-4 py-3 bg-gray-800/70 border border-gray-700 rounded-xl text-yellow-400 font-semibold hover:bg-gray-800 hover:shadow-lg transition-transform duration-200"
        >
          Profile
        </button>

        <h2 className="text-gray-400 uppercase font-bold text-sm tracking-wide">Tables</h2>
        {(["participants", "judges", "scores"] as TableType[]).map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTable(t)}
            className={`w-full text-left px-4 py-2 rounded-lg font-semibold transition ${
              selectedTable === t ? "bg-yellow-400 text-black" : "hover:bg-gray-700 text-white"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </aside>

      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-30 p-2 bg-yellow-400 rounded-xl text-black font-bold shadow-lg"
        onClick={() => setSidebarOpen(true)}
      >
        Menu
      </button>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 mt-16 md:mt-0">
        <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-300 mb-2">Admin Dashboard</h1>
        <p className="text-gray-400 mb-6">Manage participants, judges, and scores.</p>

        {/* Add New */}
        {selectedTable !== "scores" && (
          <div className="flex justify-end mb-6">
            <button
              onClick={() => {
                setNewRow({});
                setIsModalOpen(true);
              }}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-400 text-white font-semibold shadow hover:scale-105 transition-transform duration-200"
            >
              + Add {selectedTable.slice(0, -1)}
            </button>
          </div>
        )}

        {/* Table/Cards */}
        {loading ? (
          <p className="text-center text-gray-400">Loading {selectedTable}...</p>
        ) : data.length === 0 ? (
          <p className="text-center text-gray-400">No records in {selectedTable}</p>
        ) : selectedTable === "participants" ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((row) => (
              <div
                key={row.id}
                className="bg-gray-800/70 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:-translate-y-1 hover:shadow-yellow-400/50 transition-transform duration-200"
              >
                <h3 className="text-yellow-400 font-bold text-lg">{row.name}</h3>
                <p className="text-gray-400 text-sm">{row.project_title}</p>
                <p className="text-gray-400 text-sm">{row.institution}</p>
                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <QRCode id={`qr-${row.name}`} value={row.name} size={80} bgColor="#ffffff" fgColor="#000000" />
                  <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                    <button
                      onClick={() => downloadQRCode(row.name)}
                      className="px-3 py-1 rounded bg-green-500 hover:bg-green-600 text-white font-semibold"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : selectedTable === "judges" ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((judge) => (
              <div
                key={judge.id}
                className="bg-gray-800/70 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:-translate-y-1 hover:shadow-yellow-400/50 transition-transform duration-200 flex flex-col items-center"
              >
                <img
                  src={judge.avatar_url || "/default-avatar.png"}
                  className="w-20 h-20 rounded-full border-2 border-yellow-400 mb-3 object-cover"
                />
                <h3 className="text-yellow-400 font-bold">{judge.name}</h3>
                <p className="text-gray-300 text-sm">@{judge.username || "no_username"}</p>
                <p className="text-gray-400 text-sm">{judge.email}</p>
                <button
                  onClick={() => handleDelete(judge.id)}
                  className="mt-4 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((row) => (
              <div
                key={row.id}
                className="bg-gray-800/70 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:-translate-y-1 hover:shadow-yellow-400/50 transition-transform duration-200"
              >
                {Object.keys(row).map((col) => (
                  <div key={col} className="mb-2">
                    <span className="text-gray-400 text-xs uppercase">{col}</span>
                    <p className="text-white">{row[col]}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div className="relative w-full max-w-lg p-8 rounded-3xl bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40">
            <h2 className="text-3xl font-extrabold text-center text-yellow-400 mb-6">
              Add New {selectedTable.slice(0, -1)}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tableColumns[selectedTable].map((col) => (
                <div key={col} className="flex flex-col">
                  <label className="text-gray-400 text-sm mb-1 uppercase tracking-wide">{col}</label>
                  <input
                    placeholder={`Enter ${col}`}
                    value={newRow[col] ?? ""}
                    onChange={(e) => setNewRow({ ...newRow, [col]: e.target.value })}
                    className="bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all shadow-md hover:shadow-yellow-400/30"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => handleSave(newRow, true)}
              className="mt-8 w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-300 text-black font-bold shadow-lg hover:shadow-yellow-400/50 hover:scale-105 transition-transform duration-300"
            >
              Add Data
            </button>
          </div>
        </Modal>
      </main>
    </div>
  );
}
