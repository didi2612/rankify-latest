import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const SUPABASE_URL = "https://pftyzswxwkheomnqzytu.supabase.co";
const SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHl6c3d4d2toZW9tbnF6eXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjczNzksImV4cCI6MjA2OTM0MzM3OX0.TI9DGipYP9X8dSZSUh5CVQIbeYnf9vhNXAqw5e5ZVkk";
const NOTES_PER_PAGE = 5;

interface Note {
  id: number;
  title: string;
  subject: string;
  filename: string;
  uploaded_by: string;
  created_at: string;
  tags?: string[];
}

export default function MyUploads() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [username, setUsername] = useState("");
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [editFields, setEditFields] = useState({ title: "", subject: "", tags: "" });
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const cookieUsername = document.cookie
      .split("; ")
      .find((row) => row.startsWith("username="))
      ?.split("=")[1];

    if (!cookieUsername) {
      toast.error("Login required to view your uploads.");
      return;
    }

    setUsername(cookieUsername);

    fetch(`${SUPABASE_URL}/rest/v1/notes?uploaded_by=eq.${cookieUsername}`, {
      headers: {
        apikey: SUPABASE_API_KEY,
        Authorization: `Bearer ${SUPABASE_API_KEY}`,
      },
    })
      .then((res) => res.json())
      .then((data) => (Array.isArray(data) ? setNotes(data) : toast.error("Failed to fetch notes.")))
      .catch(() => toast.error("Network error loading notes."));
  }, []);

  const filteredNotes = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return notes.filter((note) => {
      const titleMatch = note.title.toLowerCase().includes(term);
      const subjectMatch = note.subject.toLowerCase().includes(term);
      const tagMatch = (note.tags || []).some((tag) => tag.toLowerCase().includes(term));
      return titleMatch || subjectMatch || tagMatch;
    });
  }, [searchTerm, notes]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredNotes.length / NOTES_PER_PAGE)), [filteredNotes]);
  const currentNotes = useMemo(() => {
    const start = (page - 1) * NOTES_PER_PAGE;
    return filteredNotes.slice(start, start + NOTES_PER_PAGE);
  }, [filteredNotes, page]);

  const handleEdit = (note: Note) => {
    setEditNote(note);
    setEditFields({
      title: note.title,
      subject: note.subject,
      tags: (note.tags || []).join(", "),
    });
  };

  const handleUpdate = () => {
    if (!editNote) return;
    const updatedTags = editFields.tags.split(",").map((t) => t.trim()).filter(Boolean);

    fetch(`${SUPABASE_URL}/rest/v1/notes?id=eq.${editNote.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_API_KEY,
        Authorization: `Bearer ${SUPABASE_API_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({ title: editFields.title, subject: editFields.subject, tags: updatedTags }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setNotes((prev) => prev.map((n) => (n.id === data[0].id ? data[0] : n)));
          toast.success("Note updated.");
          setEditNote(null);
        } else {
          toast.error("Update failed.");
        }
      })
      .catch(() => toast.error("Error updating note."));
  };

  const handleOpenFile = async (filename: string) => {
    const newTab = window.open("", "_blank");
    if (!newTab) {
      alert("Please allow popups for this site.");
      return;
    }

    try {
      const encodedFilename = encodeURIComponent(filename);
      const res = await fetch(`https://azmiproductions.com/api/studyjom/upload.php?file=${encodedFilename}`);
      if (!res.ok) throw new Error("Failed to fetch file.");
      const blob = await res.blob();
      const fileURL = URL.createObjectURL(blob);
      newTab.location.href = fileURL;
    } catch {
      newTab.close();
      alert("Could not open the file. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-yellow-400">📚 My Uploaded Notes</h1>
        <p className="text-sm text-gray-400 mb-4">Hi, {username}</p>

        <a
          href="/profile"
          className="inline-block mb-6 px-4 py-2 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-400 transition"
        >
          ← Back to Profile
        </a>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search by title, subject, or tag..."
          className="w-full mb-6 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
        />

        {filteredNotes.length === 0 ? (
          <p className="text-gray-300">No matching notes found.</p>
        ) : (
          <>
            <div className="grid gap-4">
              {currentNotes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-center mb-1">
                    <h2 className="text-xl font-semibold text-yellow-300">{note.title}</h2>
                    <button
                      onClick={() => handleEdit(note)}
                      className="text-sm px-2 py-1 bg-yellow-600 text-black rounded hover:bg-yellow-500"
                    >
                      ✏️ Edit
                    </button>
                  </div>

                  <p className="text-sm text-gray-400">Uploaded by: {note.uploaded_by}</p>
                  <p className="mt-2 text-gray-200">{note.subject}</p>

                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {note.tags.map((tag, i) => (
                        <span key={i} className="text-xs bg-gray-700 px-2 py-1 rounded-full text-yellow-200">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => handleOpenFile(note.filename)}
                    className="inline-block mt-4 px-3 py-1 bg-yellow-600 text-black text-sm rounded hover:bg-yellow-500 transition"
                  >
                    View File
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-4 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="text-gray-300">
                  Page <span className="text-yellow-400 font-bold">{page}</span> of{" "}
                  <span className="text-yellow-400 font-bold">{totalPages}</span>
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editNote && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 rounded-lg p-6 w-full max-w-md"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <h2 className="text-xl font-bold mb-4 text-yellow-300">Edit Note</h2>
              <input
                type="text"
                placeholder="Title"
                className="w-full mb-3 px-3 py-2 rounded bg-gray-800 text-white"
                value={editFields.title}
                onChange={(e) => setEditFields({ ...editFields, title: e.target.value })}
              />
              <textarea
                placeholder="Subject"
                className="w-full mb-3 px-3 py-2 rounded bg-gray-800 text-white"
                rows={4}
                value={editFields.subject}
                onChange={(e) => setEditFields({ ...editFields, subject: e.target.value })}
              />
              <input
                type="text"
                placeholder="Tags (comma separated)"
                className="w-full mb-3 px-3 py-2 rounded bg-gray-800 text-white"
                value={editFields.tags}
                onChange={(e) => setEditFields({ ...editFields, tags: e.target.value })}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditNote(null)}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-400"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
