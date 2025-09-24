import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Modal from "../components/Modal";
import QRCode from "react-qr-code";

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

  // ------------------- Fetch Data -------------------
  const fetchTableData = async (table: TableType) => {
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
        headers: {
          apikey: SUPABASE_API_KEY,
          Authorization: `Bearer ${SUPABASE_API_KEY}`,
        },
      });
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch data");
    }
    setLoading(false);
  };

  // ------------------- Delete Record -------------------
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${selectedTable}?id=eq.${id}`,
        {
          method: "DELETE",
          headers: {
            apikey: SUPABASE_API_KEY,
            Authorization: `Bearer ${SUPABASE_API_KEY}`,
          },
        }
      );
      if (res.ok) {
        toast.success("Record deleted");
        fetchTableData(selectedTable);
      } else toast.error("Failed to delete");
    } catch (err) {
      console.error(err);
      toast.error("Error deleting");
    }
  };

  // ------------------- Save Record -------------------
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
      } else {
        toast.error("Failed to save record");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving");
    }
  };

  useEffect(() => {
    fetchTableData(selectedTable);
  }, [selectedTable]);

  // ------------------- QR Download Function -------------------
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

  // ------------------- Render -------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-950 text-white px-6 py-20 font-inter relative overflow-hidden">
      {/* glowing blobs */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
      
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-10">
        {/* Back to Profile Button */}
<div className="flex justify-start mb-6">
  <button
    onClick={() => window.location.href = "/profile"}
    className="flex items-center gap-3 px-5 py-3 bg-gray-800/70 border border-gray-700 rounded-2xl shadow-lg hover:shadow-yellow-400/50 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-yellow-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
    <span className="text-yellow-400 font-semibold text-sm sm:text-base">
      Back to Profile
    </span>
  </button>
</div>

        <h1 className="text-4xl font-extrabold text-yellow-300 text-center">
          Admin Panel
        </h1>
        <p className="text-center text-gray-400">
          Manage Participants, Judges, and Scores
        </p>

        {/* Table selector */}
        <div className="flex justify-center gap-4 flex-wrap">
          {(["participants", "judges", "scores"] as TableType[]).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTable(t)}
              className={`px-6 py-3 rounded-xl font-semibold shadow-md transition ${
                selectedTable === t
                  ? "bg-yellow-400 text-black"
                  : "bg-gray-700 hover:bg-gray-600 text-white"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Add New Button */}
        {selectedTable !== "scores" && (
          <div className="text-center">
            <button
              onClick={() => {
                setNewRow({});
                setIsModalOpen(true);
              }}
              className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold shadow-md"
            >
              + Add {selectedTable.slice(0, -1)}
            </button>
          </div>
        )}

        {/* Table Rendering */}
        {loading ? (
          <p className="p-6 text-center text-gray-400">
            Loading {selectedTable}...
          </p>
        ) : data.length === 0 ? (
          <p className="p-6 text-center text-gray-400">
            No records in {selectedTable}.
          </p>
        ) : selectedTable === "participants" ? (
          <div className="bg-gray-800/70 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
            <ul>
              {data.map((row) => (
                <li
                  key={row.id}
                  className="flex justify-between items-center p-4 border-b border-gray-700 hover:bg-gray-700 transition"
                >
                  <div>
                    <p className="font-semibold text-yellow-400">{row.name}</p>
                    <p className="text-gray-400 text-sm">{row.project_title}</p>
                    <p className="text-gray-400 text-sm">{row.institution}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <QRCode
                      id={`qr-${row.name}`}
                      value={row.name}
                      size={128}
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
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
                </li>
              ))}
            </ul>
          </div>
        ) : selectedTable === "judges" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((judge) => (
              <div
                key={judge.id}
                className="bg-gray-800/70 backdrop-blur-md border border-gray-700 rounded-2xl shadow-xl p-6 relative hover:-translate-y-2 hover:shadow-2xl transition"
              >
                <div className="flex flex-col items-center mb-4">
                  <img
                    src={judge.avatar_url || "/default-avatar.png"}
                    alt={judge.name}
                    className="w-20 h-20 rounded-full border-2 border-yellow-400 object-cover mb-2"
                  />
                  <h3 className="text-yellow-400 font-bold text-lg">{judge.name}</h3>
                  <p className="text-gray-300 text-sm">@{judge.username || "no_username"}</p>
                  <p className="text-gray-400 text-sm">{judge.email}</p>
                </div>

                <div className="mt-4 flex justify-center gap-4">
                  <button
                    onClick={() => handleDelete(judge.id)}
                    className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((row) => (
              <div
                key={row.id}
                className="bg-gray-800/70 backdrop-blur-md border border-gray-700 rounded-2xl shadow-xl p-6 relative hover:-translate-y-2 hover:shadow-2xl transition"
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

        {/* Modal for Add New Record */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div className="relative w-full p-8 rounded-3xl bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40">
            <h2 className="text-3xl font-extrabold text-center text-yellow-400 mb-6 drop-shadow-lg">
              Add New {selectedTable.charAt(0).toUpperCase() + selectedTable.slice(1, -1)}
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
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
              Add
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
