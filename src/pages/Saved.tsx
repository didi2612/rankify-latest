import { useEffect, useState, useMemo } from "react";
import Cookies from "js-cookie";
import { FaDownload, FaUser, FaArrowLeft, FaTrashAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const SUPABASE_URL = "https://pftyzswxwkheomnqzytu.supabase.co";
const SUPABASE_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHl6c3d4d2toZW9tbnF6eXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjczNzksImV4cCI6MjA2OTM0MzM3OX0.TI9DGipYP9X8dSZSUh5CVQIbeYnf9vhNXAqw5e5ZVkk"; // Replace securely

interface Note {
  id: string;
  title: string;
  filename: string;
  tags: string[];
  uploaded_by: string;
  subject: string;
}

const NOTES_PER_PAGE = 10;

export default function Saved() {
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [removingIds, setRemovingIds] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSavedNotes = async () => {
      const username = Cookies.get("username");
      if (!username) return;

      const userRes = await fetch(
        `${SUPABASE_URL}/rest/v1/users?username=eq.${username}`,
        {
          headers: {
            apikey: SUPABASE_API_KEY,
            Authorization: `Bearer ${SUPABASE_API_KEY}`,
          },
        }
      );
      const userData = await userRes.json();
      const savedIds = userData?.[0]?.saved_notes ?? [];

      if (savedIds.length === 0) {
        setSavedNotes([]);
        setLoading(false);
        return;
      }

      const notesRes = await fetch(
        `${SUPABASE_URL}/rest/v1/notes?id=in.(${savedIds
          .map((id: string) => `"${id}"`)
          .join(",")})`,
        {
          headers: {
            apikey: SUPABASE_API_KEY,
            Authorization: `Bearer ${SUPABASE_API_KEY}`,
          },
        }
      );
      const notes = await notesRes.json();
      setSavedNotes(notes);
      setLoading(false);
    };

    fetchSavedNotes();
  }, []);

  // Filter saved notes by search term (title or subject, case insensitive)
  const filteredNotes = useMemo(() => {
    if (!searchTerm.trim()) return savedNotes;
    const lowerSearch = searchTerm.toLowerCase();
    return savedNotes.filter(
      (note) =>
        note.title.toLowerCase().includes(lowerSearch) ||
        note.subject.toLowerCase().includes(lowerSearch)
    );
  }, [savedNotes, searchTerm]);

  const totalPages = Math.ceil(filteredNotes.length / NOTES_PER_PAGE);

  // Paginate filtered notes
  const pagedNotes = useMemo(() => {
    const startIndex = (page - 1) * NOTES_PER_PAGE;
    return filteredNotes.slice(startIndex, startIndex + NOTES_PER_PAGE);
  }, [filteredNotes, page]);

  // Reset page if filteredNotes or searchTerm changes and page is out of range
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const handleOpenFile = async (filename: string) => {
    const newTab = window.open("", "_blank");
    if (!newTab) {
      alert("Please allow popups for this site.");
      return;
    }

    try {
      const encodedFilename = encodeURIComponent(filename);
      const res = await fetch(
        `https://azmiproductions.com/api/studyjom/upload.php?file=${encodedFilename}`
      );
      if (!res.ok) throw new Error("Failed to fetch file.");
      const blob = await res.blob();
      const fileURL = URL.createObjectURL(blob);
      newTab.location.href = fileURL;
    } catch (error) {
      newTab.close();
      alert("Could not open the file. Please try again later.");
    }
  };

  // Remove note from saved list both locally and on backend
  const handleRemoveNote = async (noteId: string) => {
    if (removingIds.includes(noteId)) return; // prevent double click
    setRemovingIds((ids) => [...ids, noteId]);

    const username = Cookies.get("username");
    if (!username) {
      alert("You must be logged in.");
      setRemovingIds((ids) => ids.filter((id) => id !== noteId));
      return;
    }

    try {
      // Optimistically update UI
      setSavedNotes((notes) => notes.filter((note) => note.id !== noteId));

      // Fetch current saved_notes again to be safe
      const userRes = await fetch(
        `${SUPABASE_URL}/rest/v1/users?username=eq.${username}`,
        {
          headers: {
            apikey: SUPABASE_API_KEY,
            Authorization: `Bearer ${SUPABASE_API_KEY}`,
          },
        }
      );
      const userData = await userRes.json();
      let savedIds = userData?.[0]?.saved_notes ?? [];

      // Remove noteId
      savedIds = savedIds.filter((id: string) => id !== noteId);

      // Update user saved_notes column
      const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${username}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_API_KEY,
          Authorization: `Bearer ${SUPABASE_API_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({ saved_notes: savedIds }),
      });

      if (!patchRes.ok) {
        throw new Error("Failed to update saved notes");
      }
    } catch (error) {
      alert("Failed to remove note from saved list.");
      // Rollback UI update if failed
      // Refetch saved notes or add back removed note
      setLoading(true);
      const fetchSavedNotes = async () => {
        const username = Cookies.get("username");
        if (!username) return;
        const userRes = await fetch(
          `${SUPABASE_URL}/rest/v1/users?username=eq.${username}`,
          {
            headers: {
              apikey: SUPABASE_API_KEY,
              Authorization: `Bearer ${SUPABASE_API_KEY}`,
            },
          }
        );
        const userData = await userRes.json();
        const savedIds = userData?.[0]?.saved_notes ?? [];

        if (savedIds.length === 0) {
          setSavedNotes([]);
          setLoading(false);
          return;
        }

        const notesRes = await fetch(
          `${SUPABASE_URL}/rest/v1/notes?id=in.(${savedIds
            .map((id: string) => `"${id}"`)
            .join(",")})`,
          {
            headers: {
              apikey: SUPABASE_API_KEY,
              Authorization: `Bearer ${SUPABASE_API_KEY}`,
            },
          }
        );
        const notes = await notesRes.json();
        setSavedNotes(notes);
        setLoading(false);
      };

      fetchSavedNotes();
    } finally {
      setRemovingIds((ids) => ids.filter((id) => id !== noteId));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Back to Profile Button */}
        <button
          onClick={() => navigate("/profile")}
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-gray-800 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 transition-colors duration-200 shadow-md"
        >
          <FaArrowLeft />
          <span className="font-medium">Back to Profile</span>
        </button>

        <h1 className="text-3xl font-bold text-yellow-400 mb-6">📚 Saved Notes</h1>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search saved notes by title or subject..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1); // reset page on search change
          }}
          className="w-full max-w-md mb-8 px-4 py-3 rounded-xl bg-gray-800 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-md transition"
        />

        {loading ? (
          <p className="text-gray-400">Loading your saved notes...</p>
        ) : filteredNotes.length === 0 ? (
          <p className="text-gray-500 italic">
            No saved notes found{searchTerm ? " for your search." : "."}
          </p>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {pagedNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    className="relative bg-gray-800 hover:bg-gray-700 rounded-2xl p-5 shadow-xl hover:shadow-yellow-400/10 transition-all cursor-pointer group"
                  >
                    <div
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveNote(note.id);
                      }}
                      title="Remove from saved"
                    >
                      <button
                        disabled={removingIds.includes(note.id)}
                        className="p-2 rounded-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-md focus:outline-none focus:ring-2 focus:ring-red-400"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>

                    <div onClick={() => handleOpenFile(note.filename)}>
                      <h2 className="text-lg font-semibold text-yellow-300 group-hover:text-white">
                        {note.title}
                      </h2>
                      <p className="text-sm text-gray-400 mt-1">{note.subject}</p>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {Array.isArray(note.tags) &&
                          note.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="bg-pink-500/10 text-pink-300 text-xs px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>

                      <div className="flex items-center gap-2 mt-3 text-sm text-gray-400">
                        <FaUser className="text-xs" />
                        <span className="italic">{note.uploaded_by}</span>
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-sm text-yellow-400 group-hover:text-yellow-300 transition">
                        <FaDownload className="text-base" />
                        <span>Click to open</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40 transition"
                >
                  ← Prev
                </button>
                <span className="text-gray-300 text-sm">
                  Page{" "}
                  <span className="text-yellow-400 font-semibold">{page}</span> of{" "}
                  <span className="text-yellow-400 font-semibold">{totalPages}</span>
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40 transition"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
