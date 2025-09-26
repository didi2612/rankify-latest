import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { LogIn } from "lucide-react"; // Importing icons for the login/profile link

const SUPABASE_URL = "https://pftyzswxwkheomnqzytu.supabase.co";
const SUPABASE_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHl6c3d4d2toZW9tbnF6eXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjczNzksImV4cCI6MjA2OTM0MzM3OX0.TI9DGipYP9X8dSZSUh5CVQIbeYnf9vhNXAqw5e5ZVkk";

// Use a more neutral, professional default avatar
const defaultAvatar =
  "https://via.placeholder.com/150/0F172A/94A3B8?text=J"; // Subtle placeholder with brand colors

const Sidebar = () => {
  const location = useLocation();
  const [user, setUser] = useState<{ username: string; avatar_url?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
        setIsLoading(true);
      const username = Cookies.get("username");
      if (!username) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/judges?username=eq.${username}&select=avatar_url`,
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [location]);

  const targetPath = user ? "/profile" : "/azp";

  const Avatar = () => (
    <img
      src={user?.avatar_url || defaultAvatar}
      alt="Profile"
      className="w-8 h-8 rounded-full object-cover border-2 border-blue-400 ring-2 ring-gray-700/50" // Added a strong border/ring combo
    />
  );
  
  // A subtle shimmer effect for the loading state
  const LoadingAvatar = () => (
    <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse border-2 border-gray-600"></div>
  );


  return (
    <header 
      className="
        bg-gray-950/95 
        backdrop-blur-md 
        text-white 
        fixed top-0 left-0 w-full z-50 
        shadow-xl shadow-black/30 
        border-b border-blue-900/50
      "
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        
        {/* Left Side: Title - Enhanced Branding */}
        <Link 
          to="/" 
          className="text-2xl font-extrabold text-blue-400 tracking-widest transition-colors duration-300 hover:text-blue-300"
        >
          <span className="text-yellow-400">R</span>ANKIFY
        </Link>

        {/* Right Side: Profile/Login */}
        <div className="flex items-center justify-end">
            {isLoading ? (
                <div className="flex items-center gap-2 px-3 py-1">
                    <LoadingAvatar />
                    <span className="text-sm font-medium text-gray-500">Loading...</span>
                </div>
            ) : (
                <Link
                    to={targetPath}
                    className="
                        flex items-center gap-2 
                        pl-2 pr-3 py-1 
                        rounded-full 
                        bg-gray-800 border border-gray-700
                        transition-all duration-300 
                        hover:bg-blue-600 hover:text-white hover:border-blue-600 
                        shadow-md hover:shadow-lg hover:shadow-blue-500/20
                    "
                >
                    {user ? (
                        <>
                            <Avatar />
                            <span className="text-sm font-semibold">{user.username}</span>
                        </>
                    ) : (
                        <>
                            <LogIn className="w-5 h-5 text-yellow-400" />
                            <span className="text-sm font-medium text-gray-300 group-hover:text-white">Sign In</span>
                        </>
                    )}
                </Link>
            )}
        </div>
      </div>
    </header>
  );
};

export default Sidebar;