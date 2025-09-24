import { useState, useEffect } from "react";
import { FaSearch, FaBookOpen, FaFilter, FaLink,FaSave,FaCheckCircle  } from "react-icons/fa";
import { motion } from "framer-motion";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";


const SUPABASE_URL = "https://pftyzswxwkheomnqzytu.supabase.co";
const SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHl6c3d4d2toZW9tbnF6eXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjczNzksImV4cCI6MjA2OTM0MzM3OX0.TI9DGipYP9X8dSZSUh5CVQIbeYnf9vhNXAqw5e5ZVkk"; // ← Use env var in prod

type Note = {
  id: string;
  title: string;
  subject: string;
  uploaded_by: string;
  tags: string[];
  filename: string;
};

export default function Search() {
    const [savedNoteIds, setSavedNoteIds] = useState<string[]>([]);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Note[]>([]);
  const [latestNotes, setLatestNotes] = useState<Note[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 6;
useEffect(() => {
  const fetchSavedNotes = async () => {
    const username = Cookies.get("username");
    if (!username) return;

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/users?select=saved_notes&username=eq.${username}`,
      {
        headers: {
          apikey: SUPABASE_API_KEY,
          Authorization: `Bearer ${SUPABASE_API_KEY}`,
        },
      }
    );
    const [user] = await res.json();
    if (user?.saved_notes) {
      setSavedNoteIds(user.saved_notes);
    }
  };

  fetchSavedNotes();
}, []);

 const fetchLatestNotes = async () => {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/notes?select=*`,
    {
      headers: {
        apikey: SUPABASE_API_KEY,
        Authorization: `Bearer ${SUPABASE_API_KEY}`,
      },
    }
  );
  const data = await res.json();

  const allNotes = Array.isArray(data)
    ? data.map((n: any) => ({
        ...n,
        tags: Array.isArray(n.tags) ? n.tags : [],
      }))
    : [];

  // Shuffle array using Fisher-Yates algorithm
  for (let i = allNotes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allNotes[i], allNotes[j]] = [allNotes[j], allNotes[i]];
  }

  // Select first 6 notes after shuffling
  setLatestNotes(allNotes.slice(0, 6));
};

const handleToggleSaveNote = async (noteId: string) => {
  const username = Cookies.get("username");
  if (!username) {
    toast.error("You must be logged in to save notes.");
    return;
  }

  const isAlreadySaved = savedNoteIds.includes(noteId);
  const updated = isAlreadySaved
    ? savedNoteIds.filter((id) => id !== noteId)
    : [...savedNoteIds, noteId];

  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${username}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_API_KEY,
      Authorization: `Bearer ${SUPABASE_API_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ saved_notes: updated }),
  });

  if (res.ok) {
    setSavedNoteIds(updated);
    toast.success(isAlreadySaved ? "Removed from saved notes." : "Note saved!");
  } else {
    toast.error("Failed to update saved notes.");
  }
};


  const handleSearch = async () => {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    const encodedTags = encodeURIComponent(`{${query}}`);

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/notes?or=(title.ilike.*${query}*,subject.ilike.*${query}*,uploaded_by.ilike.*${query}*,tags.cs.${encodedTags})&select=*`,
      {
        headers: {
          apikey: SUPABASE_API_KEY,
          Authorization: `Bearer ${SUPABASE_API_KEY}`,
          Range: `${from}-${to}`,
          Prefer: "count=exact",
        },
      }
    );

    const data = await res.json();
    const range = res.headers.get("content-range");
    const total = range ? parseInt(range.split("/")[1]) : 0;

    setResults(Array.isArray(data) ? data.map((n: any) => ({
      ...n,
      tags: Array.isArray(n.tags) ? n.tags : [],
    })) : []);
    setTotalCount(total);
  };

const handleOpenFile = async (filename: string) => {
  const newTab = window.open("", "_blank"); // Open tab immediately
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
    newTab.location.href = fileURL; // Assign blob URL to opened tab
  } catch (error) {
    newTab.close(); // Clean up failed tab
    alert("Could not open the file. Please try again later.");
  }
};



  // Load query from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setQuery(q);
  }, []);

  // Auto search on query change (debounced)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTotalCount(0);
      return;
    }
    const delay = setTimeout(() => {
      handleSearch();
    }, 400);
    return () => clearTimeout(delay);
  }, [query, page]);

  // Update URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (query.trim()) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    window.history.replaceState({}, "", `${window.location.pathname}?${params}`);
  }, [query]);

  // Latest notes & auto-suggestion
  useEffect(() => {
    fetchLatestNotes();
  }, []);

  useEffect(() => {
    if (!latestNotes.length) return;
    const interval = setInterval(() => {
      setSuggestionIndex((i) => (i + 1) % latestNotes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [latestNotes]);

  const shownNotes = query ? results : latestNotes;
  const totalPages = Math.ceil(totalCount / perPage);

  return (
    
    <div className="min-h-screen bg-gradient-to-b mt-10 from-gray-900 via-gray-950 to-black text-white px-6 py-16 font-inter">
         <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto text-center space-y-6 mb-12">
        <div className="text-5xl animate-bounce">📚</div>
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-500 animate-text">
          Search Study Notes
        </h1>
        <p className="text-base text-gray-400">
          Browse shared notes from friends, seniors, and kind strangers with good handwriting ✨
        </p>
        <p className="text-sm text-pink-300 italic">
          Try: <span className="text-yellow-400">{latestNotes[suggestionIndex]?.title || "Final Tips"}</span>
        </p>
      </div>

      {/* Search bar */}
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center sm:gap-2 mb-12 space-y-4 sm:space-y-0">
        <input
          type="text"
          placeholder="e.g. UG3 Calculus, Fuzzy Logic, Past Year..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          className="flex-1 px-5 py-4 rounded-xl bg-gray-800/60 backdrop-blur-sm text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-md transition"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="bg-yellow-400 hover:bg-yellow-300 text-black px-5 py-4 rounded-xl font-bold shadow-md transition duration-200"
          >
            <FaSearch />
          </button>
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                setPage(1);
              }}
              className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-4 rounded-xl font-bold shadow-md transition duration-200"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast("Link copied to clipboard!");
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-4 rounded-xl font-bold shadow-md transition duration-200"
          >
            <FaLink />
          </button>
         
          
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto space-y-10">
        {query && results.length > 0 && (
          <div className="text-sm text-gray-400 flex items-center gap-2 mb-4">
            <FaFilter className="text-yellow-300" />
            Showing {results.length} results for{" "}
            <span className="text-pink-300 font-semibold">"{query}"</span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shownNotes.map((note, idx) => (
            <motion.div
  key={idx}
  whileHover={{ scale: 1.03 }}
  onClick={() => handleOpenFile(note.filename)}
  className="rounded-2xl bg-gray-800/60 backdrop-blur-md border border-gray-700 p-5 shadow-md hover:shadow-pink-400/30 transition-all cursor-pointer"
>
  <div className="flex items-start gap-4">
    <FaBookOpen className="text-pink-300 text-2xl mt-1" />
    <div className="flex-1">
      <h3 className="text-lg font-semibold text-white">{note.title}</h3>
      <p className="text-sm text-gray-400">
        <span className="text-yellow-400">{note.subject}</span> • Shared by {note.uploaded_by}
      </p>

      {/* Tags */}
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

      {/* Save Button */}
    <button
  onClick={(e) => {
    e.stopPropagation();
    handleToggleSaveNote(note.id);
  }}
  className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full transition-colors duration-200 shadow-sm ${
    savedNoteIds.includes(note.id)
      ? "bg-green-800/20 text-green-300 hover:bg-red-800/30 hover:text-red-300"
      : "bg-gray-800 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300"
  }`}
>
  {savedNoteIds.includes(note.id) ? (
    <>
      <FaCheckCircle className="text-lg" />
      <span className="font-medium">Saved (Click to Remove)</span>
    </>
  ) : (
    <>
      <FaSave className="text-lg" />
      <span className="font-medium">Save Note</span>
    </>
  )}
</button>




    </div>
  </div>
</motion.div>

          ))}
        </div>

        {/* Pagination */}
        {query && results.length > 0 && totalPages > 1 && (
          <div className="flex justify-center gap-4 mt-10 items-center">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40"
            >
              ⬅ Prev
            </button>
            <span className="text-sm text-gray-300">
              Page <span className="text-yellow-300">{page}</span> of{" "}
              <span className="text-yellow-300">{totalPages}</span>
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40"
            >
              Next ➡
            </button>
          </div>
        )}

        {/* No results */}
        {query && results.length === 0 && (
          <div className="text-center text-gray-500 mt-20 text-lg">
            😔 No notes found. Try different keywords or contribute yours!
          </div>
        )}
      </div>
    </div>
  );
}
