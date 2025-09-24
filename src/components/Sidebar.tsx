import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Cookies from "js-cookie";

const SUPABASE_URL = "https://pftyzswxwkheomnqzytu.supabase.co";
const SUPABASE_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHl6c3d4d2toZW9tbnF6eXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjczNzksImV4cCI6MjA2OTM0MzM3OX0.TI9DGipYP9X8dSZSUh5CVQIbeYnf9vhNXAqw5e5ZVkk";

const defaultAvatar =
  "https://cliply.co/wp-content/uploads/2020/08/442008110_GLANCING_AVATAR_3D_400px.gif";

const Sidebar = () => {
  const location = useLocation();
  const [user, setUser] = useState<{ username: string; avatar_url?: string } | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const username = Cookies.get("username");
      if (!username) {
        setUser(null);
        return;
      }

      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/users?username=eq.${username}&select=avatar_url`,
          {
            headers: {
              apikey: SUPABASE_API_KEY,
              Authorization: `Bearer ${SUPABASE_API_KEY}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch avatar");
        const data = await res.json();
        const avatar_url = data[0]?.avatar_url ?? null;

        setUser({ username, avatar_url });
      } catch (error) {
        console.error("Error fetching avatar:", error);
        setUser({ username }); // fallback without avatar
      }
    };

    fetchUserData();
  }, [location]);

  const targetPath = user ? "/profile" : "/azp";

  const Avatar = () => (
    <img
      src={user?.avatar_url || defaultAvatar}
      alt="Profile"
      className="w-8 h-8 rounded-full object-cover border border-white"
    />
  );

  return (
    <header className="bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 text-white shadow-sm fixed top-0 left-0 w-full z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Left Side: Title */}
         <Link to="/" className="text-lg font-bold text-yellow-400 tracking-wide hover:text-white">
      STUDY JOM
    </Link>

        {/* Right Side: Profile */}
        <div className="flex items-center justify-end">
          <Link
            to={targetPath}
            className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-gray-800 transition"
          >
            {user ? <Avatar /> : <span className="text-sm font-medium">Login</span>}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Sidebar;
