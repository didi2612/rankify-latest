import { useState } from "react";
import { FaBook, FaCloudUploadAlt, FaTags } from "react-icons/fa";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

const SUPABASE_URL = "https://pftyzswxwkheomnqzytu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHl6c3d4d2toZW9tbnF6eXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjczNzksImV4cCI6MjA2OTM0MzM3OX0.TI9DGipYP9X8dSZSUh5CVQIbeYnf9vhNXAqw5e5ZVkk"; // (keep it secret in prod)

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    const uploadedBy = getCookie("username");

    if (!file || !title || !subject || !uploadedBy) {
      toast.error("All fields required (including login)!");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const phpUploadRes = await fetch(
        "https://azmiproductions.com/api/studyjom/upload.php",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!phpUploadRes.ok) throw new Error("File upload failed");

      const uploadData = await phpUploadRes.json();
      if (!uploadData.success) throw new Error(uploadData.error);

      const uploadedFilename = `https://azmiproductions.com/api/studyjom/uploads/${uploadData.filename}`;

      const tagsArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/notes`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          title,
          subject,
          filename: uploadedFilename,
          uploaded_by: uploadedBy,
          tags: tagsArray,
        }),
      });

      if (!insertRes.ok) {
        const error = await insertRes.text();
        throw new Error("Failed to save metadata.\n" + error);
      }

      toast.success("Uploaded successfully!");
      setTitle("");
      setSubject("");
      setFile(null);
      setTags("");
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1f2937] via-[#0f172a] to-[#1e3a8a] text-white px-4 py-20 flex justify-center items-start font-sans">
      <Toaster position="top-center" />
      <div className="w-full max-w-2xl bg-[#0f172a]/60 border border-gray-700 rounded-3xl shadow-2xl p-8 space-y-8 backdrop-blur-sm">
        <div className="text-center space-y-2">
          <div className="text-5xl">📚</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-yellow-300">
            Upload Your Study Notes
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Share your handwritten or digital notes with the community and help
            others thrive 🎓
          </p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm text-gray-300 mb-1 flex items-center gap-2">
            <FaBook className="text-indigo-400" /> Notes Title
          </label>
          <input
            type="text"
            placeholder="e.g., Linear Algebra Summary"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 rounded-xl bg-[#1e293b] text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />

          <label className="block text-sm text-gray-300 mb-1 flex items-center gap-2">
            <FaBook className="text-indigo-400" /> Subject
          </label>
          <input
            type="text"
            placeholder="e.g., Mathematics"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-3 rounded-xl bg-[#1e293b] text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />

          <label className="block text-sm text-gray-300 mb-1 flex items-center gap-2">
            <FaTags className="text-indigo-400" /> Tags
          </label>
          <input
            type="text"
            placeholder="e.g., KOE"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full p-3 rounded-xl bg-[#1e293b] text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />

          <label className="block text-sm text-gray-300 mb-1 flex items-center gap-2">
            <FaCloudUploadAlt className="text-indigo-400" /> Upload File
          </label>
          <motion.label
            initial={{ opacity: 0.95, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-500 bg-[#1e293b]/40 rounded-xl px-4 py-10 cursor-pointer text-center hover:shadow-lg hover:bg-[#1e293b]/60 transition-all"
          >
            <FaCloudUploadAlt className="text-indigo-400 text-4xl mb-3 animate-bounce" />
            <p className="text-white text-sm font-medium">
              Drag & drop your file here or{" "}
              <span className="underline text-yellow-300">click to browse</span>
            </p>
   <input
  type="file"
  accept=".pdf,.pptx,.txt,.doc,.docx,.png,.jpeg,.jpg"
  onChange={(e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
        "text/plain",
        "application/msword", // .doc
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "image/png",
        "image/jpeg",
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error("Only PDF, PPTX, TXT, DOC, DOCX, PNG, JPG, and JPEG are allowed.");
        return;
      }
      setFile(selectedFile);
    }
  }}
  className="hidden"
/>


            {file && (
              <p className="mt-2 text-xs text-green-400">
                Selected: <span className="font-semibold">{file.name}</span>
              </p>
            )}
          </motion.label>
        </div>

        <button
          onClick={handleUpload}
          className={`w-full bg-yellow-400 hover:bg-yellow-300 text-black py-3 rounded-xl font-semibold transition duration-200 shadow-md ${
            loading && "opacity-50 pointer-events-none"
          }`}
        >
          {loading ? "Uploading..." : "🚀 Upload Now"}
        </button>

        <div className="text-center mt-6">
          <Link
            to="/profile"
            className="text-sm text-yellow-400 underline hover:text-yellow-300 transition duration-150"
          >
            ← Back to Profile
          </Link>
        </div>

        <p className="text-center text-gray-500 text-xs mt-4">
          Thanks for sharing your knowledge 🌙
        </p>
      </div>
    </div>
  );
}
