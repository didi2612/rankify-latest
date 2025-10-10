import { useState, useEffect, FC } from "react";
import { useNavigate, Link } from "react-router-dom"; // Import Link for better client-side routing

// --- Constants (Keep these the same) ---
const SUPABASE_URL = "https://pftyzswxwkheomnqzytu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHl6c3d4d2toZW9tbnF6eXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjczNzksImV4cCI6MjA2OTM0MzM3OX0.TI9DGipYP9X8dSZSUh5CVQIbeYnf9vhNXAqw5e5ZVkk";

// --- TypeScript Type Definitions for Message Component ---
type MessageType = 'error' | 'success' | 'blue' | '';

interface MessageState {
  text: string;
  type: MessageType;
}

interface MessageProps {
  message: MessageState;
}

// --- Custom Message Component (Copied from firstlogin.tsx for consistency) ---
const Message: FC<MessageProps> = ({ message }) => {
  if (!message.text) return null;

  const baseClasses = "fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg transition-opacity duration-300 transform";
  const typeClasses = message.type === 'error'
    ? "bg-red-600 text-white"
    : message.type === 'success'
    ? "bg-green-600 text-white"
    : "bg-blue-600 text-white"; // Added a 'blue' type for general info

  return (
    <div className={`${baseClasses} ${typeClasses}`}>
      <p className="font-semibold">{message.text}</p>
    </div>
  );
};

// --- Login Component ---
export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<MessageState>({ text: "", type: "" }); // State for custom messages
  const navigate = useNavigate();

  // Utility to display messages (Copied from firstlogin.tsx for consistency)
  const showMessage = (text: string, type: MessageType = 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  // Redirect if already logged in
  useEffect(() => {
    const cookieUsername = document.cookie
      .split("; ")
      .find((row) => row.startsWith("username="))
      ?.split("=")[1];
    if (cookieUsername) {
      navigate("/profile");
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!username || !password) {
      return showMessage("Username and password are required.", 'error'); // Use custom message
    }

    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/judges?username=eq.${username}&password=eq.${password}`, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.length > 0) {
        document.cookie = `username=${data[0].username}; path=/; max-age=86400`;
        showMessage("Login successful! Redirecting...", 'success');
        setTimeout(() => navigate("/profile"), 1000); // Add a slight delay for message
      } else {
        showMessage("Invalid username or password.", 'error'); // Use custom message
      }
    } catch (err) {
      console.error("Login error:", err); // Log the error for debugging
      showMessage("An unexpected error occurred during login. Please try again.", 'error'); // Use custom message
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white px-6 py-20 flex items-center justify-center font-inter relative overflow-hidden">
      {/* Inline styles for text animation (or move to tailwind.config.js as discussed) */}
      <style>{`
        @keyframes text-gradient-animation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-text {
          background-size: 200% auto;
          animation: text-gradient-animation 3s ease infinite;
        }
      `}</style>
      
      {/* Background Orbs with enhanced styling */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl opacity-60 animate-blob" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-yellow-400/15 rounded-full blur-3xl opacity-60 animate-blob animation-delay-2000" />
      <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl opacity-50 animate-blob animation-delay-4000" />

      {/* Custom Message Component */}
      <Message message={message} />

      {/* Main Login Card */}
      <div className="relative z-10 bg-gray-800/70 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-3xl w-full max-w-md space-y-7 border border-gray-700/50 transform transition-all duration-300 hover:scale-[1.01]">
        <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 animate-text">
          Welcome Back
        </h1>
        <p className="text-gray-300 text-center mb-6 text-lg">
          Sign in to your account
        </p>

        <div className="space-y-5">
          <div>
            <label htmlFor="username-input" className="block text-sm text-gray-300 mb-2 font-medium">Username</label>
            <input
              id="username-input"
              type="text"
              className="w-full px-5 py-3 rounded-xl bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200 placeholder-gray-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="password-input" className="block text-sm text-gray-300 mb-2 font-medium">Password</label>
            <input
              id="password-input"
              type="password"
              className="w-full px-5 py-3 rounded-xl bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200 placeholder-gray-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading || !username.trim() || !password.trim()}
            className="w-full bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-yellow-300 hover:to-pink-400 text-gray-900 font-extrabold py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* First Time Login Link - Using Link from react-router-dom */}
          <Link to="/firsttimelogin" className="block text-sm uppercase font-bold text-right text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-purple-400 hover:from-yellow-300 hover:to-purple-300 animate-text transition-all duration-300 hover:tracking-wide">
            First time login ?
          </Link>
        </div>
      </div>

      {/* Tailwind config for custom animations (if not already in tailwind.config.js) */}
      {/* If you add this to tailwind.config.js, remove the <style> block above entirely. */}
      {/*
      <style>
        {`
          @keyframes blob {
            0%, 100% {
              transform: translate(0, 0) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
          }
          .animate-blob {
            animation: blob 7s infinite cubic-bezier(0.6, 0.01, 0.2, 1);
          }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
        `}
      </style>
      */}
    </div>
  );
}