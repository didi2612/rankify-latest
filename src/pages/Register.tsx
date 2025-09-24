import { useEffect,useState } from "react";
import { useNavigate } from "react-router-dom";

const SUPABASE_URL = "https://pftyzswxwkheomnqzytu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHl6c3d4d2toZW9tbnF6eXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjczNzksImV4cCI6MjA2OTM0MzM3OX0.TI9DGipYP9X8dSZSUh5CVQIbeYnf9vhNXAqw5e5ZVkk";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const cookieUsername = document.cookie
      .split("; ")
      .find((row) => row.startsWith("username="))
      ?.split("=")[1];
    if (cookieUsername) {
      navigate("/profile");
    }
  }, [navigate]);
  const handleRegister = async () => {
    if (!username || !password || !email) {
      return alert("All fields are required");
    }

    setLoading(true);

    try {
      // Check for existing username
      const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${username}`, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });

      const existing = await checkRes.json();

      if (existing.length > 0) {
        alert("Username already taken");
        return;
      }

      // Register user
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          username,
          password,
          email,
        }),
      });

      const result = await insertRes.json();

      if (insertRes.ok && result.length > 0) {
        document.cookie = `username=${username}; path=/; max-age=86400`;
        navigate("/profile");
      } else {
        alert("Registration failed");
      }
    } catch (err) {
      alert("Registration error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white px-6 py-20 flex items-center justify-center font-inter relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl animate-pulse" />

      <div className="relative z-10 bg-gray-800/60 backdrop-blur-lg p-10 rounded-2xl shadow-2xl w-full max-w-md space-y-6 border border-gray-700">
        <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 animate-text">
          Create Account 🚀
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Username</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="eg. azmistudent"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-xl bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="eg. azmi@example.com"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-xl transition"
          >
            {loading ? "Registering..." : "Register"}
          </button>
            <p className="text-sm text-gray-400 text-center">
           Already a studypanda members?{" "}
            <a
              href="/azp"
              className="text-yellow-400 hover:underline transition"
            >
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
