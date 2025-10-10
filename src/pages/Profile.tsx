import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Edit, Save, X, LogOut, User, Zap, Shield, Image, TrendingUp, QrCode, FileText } from "lucide-react"; // Import professional icons

const SUPABASE_URL = "https://pftyzswxwkheomnqzytu.supabase.co";
const SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHl6c3d4d2toZW9tbnF6eXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjczNzksImV4cCI6MjA2OTM0MzM3OX0.TI9DGipYP9X8dSZSUh5CVQIbeYnf9vhNXAqw5e5ZVkk"; // Secure this key in production

const handleOpenFileForPG = () => {
  const fileUrl = "https://azmiproductions.com/kerice/rubricPG.pdf";
  const newTab = window.open(fileUrl, "_blank");
  if (!newTab) {
    alert("Please allow popups for this site.");
  }
};

const handleOpenFile = () => {
  const fileUrl = "https://azmiproductions.com/kerice/fypidp.pdf";
  const newTab = window.open(fileUrl, "_blank");
  if (!newTab) {
    alert("Please allow popups for this site.");
  }
};

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

type UserProfile = {
  id: string;
  username: string;
  avatar_url: string;
  account_type: string;
  email?: string; // Assuming email might be available
};

// Determine which table to search for the user based on context (Organisers often have higher privileges)
const fetchUserFromTable = async (table: 'organisers' | 'judges', username: string): Promise<UserProfile | null> => {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=id,username,avatar_url,account_type,email&username=eq.${username}`,
      {
        headers: {
          apikey: SUPABASE_API_KEY,
          Authorization: `Bearer ${SUPABASE_API_KEY}`,
        },
      }
    );
    const data = await res.json();
    return data?.length ? data[0] : null;
  } catch (error) {
    console.error(`Error fetching from ${table}:`, error);
    return null;
  }
};

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    setLoading(true);
    const username = getCookie("username");
    if (!username) {
        setLoading(false);
        return;
    }

    // Try fetching from 'organisers' first (which includes SuperAdmin/Organisers)
    let userProfile = await fetchUserFromTable('organisers', username);

    // If not found in 'organisers', fallback to 'judges'
    if (!userProfile) {
        userProfile = await fetchUserFromTable('judges', username);
    }
    
    if (userProfile) {
      setUser(userProfile);
      setEditUsername(userProfile.username);
      setEditAvatar(userProfile.avatar_url);
    }

    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      // NOTE: Using the provided external upload API URL
      const res = await fetch("https://azmiproductions.com/api/studyjom/upload.php?type=avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditAvatar(data.url);
        toast.success("Avatar uploaded successfully!");
      } else {
        toast.error("Upload failed. Try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error uploading file.");
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    setSaving(true);
    
    const tableToUpdate = user.account_type === 'Judge' ? 'judges' : 'organisers';

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableToUpdate}?id=eq.${user.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_API_KEY,
        Authorization: `Bearer ${SUPABASE_API_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        username: editUsername,
        avatar_url: editAvatar,
      }),
    });

    const updated = await res.json();
    setSaving(false);

    if (res.ok && updated?.length) {
      // Update cookie only if username changed
      if (user.username !== editUsername) {
        document.cookie = `username=${editUsername};path=/;max-age=86400;SameSite=Lax`;
      }
      
      setUser(updated[0]);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } else {
      toast.error("Failed to update profile.");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mr-3"></div>
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return (
        <div className="min-h-screen flex items-center justify-center text-white bg-gray-950 font-inter flex-col p-6">
            <h1 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h1>
            <p className="text-gray-400 mb-8 text-center">Please log in to view your profile.</p>
            <Link 
                to="/" 
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
                Go to Login
            </Link>
        </div>
    );
  }

  const isOrganizer = user.account_type === "Organisers" || user.account_type === "SuperAdmin";
  const isAdmin = user.account_type === "SuperAdmin";


  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-16 font-sans relative overflow-hidden">
      
      {/* Background Flare Effect (Refined) */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl opacity-70 animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-70 animate-pulse animation-delay-500" />


      <div className="max-w-4xl mx-auto relative z-10 space-y-12">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-4 text-center p-6 bg-gray-900 rounded-3xl shadow-2xl border border-gray-800">
          <img
            src={
              (isEditing ? editAvatar : user.avatar_url) ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=1f2937&color=facc15&size=128&bold=true`
            }
            alt="User Avatar"
            className="w-32 h-32 rounded-full border-4 border-yellow-400 shadow-xl object-cover ring-4 ring-gray-950"
          />
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mt-2 flex items-center gap-3">
            <User className="w-8 h-8 text-yellow-400" />
            {user.username}
          </h1>
          <span className={`px-4 py-1 text-sm font-semibold rounded-full mt-1 ${
              isAdmin ? 'bg-red-600 text-white' : isOrganizer ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
          }`}>
              {isAdmin && <Shield className="w-4 h-4 inline mr-1" />}
              {isOrganizer && <Zap className="w-4 h-4 inline mr-1" />}
              {user.account_type.toUpperCase()}
          </span>
        </div>

        {/* Profile Details and Editing Section */}
        <div className="bg-gray-800/80 backdrop-blur-lg border border-gray-700 rounded-2xl p-8 shadow-2xl space-y-6">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6 border-b border-gray-700/50 pb-3">Account Information</h2>
          
          {/* Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Username Field */}
            <div className="flex flex-col">
              <label className="text-sm text-gray-400 font-medium mb-1 flex items-center gap-1">
                <User className="w-4 h-4 text-gray-500"/> Username
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                />
              ) : (
                <p className="text-lg font-semibold text-white">{user.username}</p>
              )}
            </div>

            {/* Email Field (Assuming email exists) */}
            {user.email && (
                <div className="flex flex-col">
                    <p className="text-sm text-gray-400 font-medium mb-1 flex items-center gap-1">
                        <Zap className="w-4 h-4 text-gray-500"/> Email
                    </p>
                    <p className="text-lg font-semibold text-white">{user.email}</p>
                </div>
            )}


            {/* Avatar Upload Field */}
            <div className="flex flex-col">
              <label className="text-sm text-gray-400 font-medium mb-1 flex items-center gap-1">
                <Image className="w-4 h-4 text-gray-500"/> Avatar
              </label>
              {isEditing ? (
                <div className="flex items-center gap-4 mt-1">
                  <input
                    id="avatarInput"
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/gif"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="avatarInput"
                    className="bg-blue-600 hover:bg-blue-700 text-sm px-4 py-2 rounded-lg cursor-pointer text-white font-medium transition-colors shadow-md shadow-blue-500/30"
                  >
                    Upload New
                  </label>
                  {editAvatar && (
                    <img
                      src={editAvatar}
                      alt="Preview"
                      className="w-10 h-10 rounded-full border-2 border-yellow-400 object-cover"
                    />
                  )}
                </div>
              ) : (
                <p className="text-lg font-semibold text-gray-500">—</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-end pt-6 border-t border-gray-700/50">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setEditUsername(user.username);
                    setEditAvatar(user.avatar_url);
                    setIsEditing(false);
                  }}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium transition-colors"
                >
                  <X className="w-5 h-5"/> Cancel
                </button>
                <button
                  onClick={updateProfile}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                        Saving...
                    </>
                  ) : (
                    <><Save className="w-5 h-5"/> Save Changes</>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold transition-colors shadow-lg shadow-yellow-500/30"
              >
                <Edit className="w-5 h-5"/> Edit Profile
              </button>
            )}
          </div>
        </div>
        
        {/* --- Navigation Links Section --- */}
        <div className="bg-gray-800/80 backdrop-blur-lg border border-gray-700 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6 border-b border-gray-700/50 pb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Admin Panel Link (SuperAdmin/Organisers only) */}
              {(isAdmin || isOrganizer) && (
  <>
    <Link
      to="/admin"
      className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-transform transform hover:scale-[1.03] shadow-lg shadow-blue-500/30"
    >
      <Shield className="w-6 h-6 mb-1" />
      <span className="text-sm text-center">Admin Panel</span>
    </Link>

    <Link
      to="/explore"
      className="flex flex-col items-center justify-center p-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition-transform transform hover:scale-[1.03] shadow-lg shadow-green-500/30"
    >
      <TrendingUp className="w-6 h-6 mb-1" />
      <span className="text-sm text-center">Scoreboard</span>
    </Link>
  </>
)}

                
                {/* Evaluation Link (All Users) */}
                <Link
                    to="/qr"
                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-transform transform hover:scale-[1.03] shadow-lg shadow-purple-500/30"
                >
                    <QrCode className="w-6 h-6 mb-1"/>
                    <span className="text-sm text-center">Evaluation</span>
                </Link>

                {/* button to open file */}
                <button
                  onClick={handleOpenFileForPG}
                  className="group flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-blue-500/40 hover:shadow-blue-500/60"
                >
                  <FileText className="w-7 h-7 mb-1 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
                  <span className="text-sm text-center">Judging Rubric (PG)</span>
                  <span className="text-[10px] text-white/70 group-hover:text-white/90">Open PDF</span>
                </button>

                {/* Other Category Rubric */}
                <button
                  onClick={handleOpenFile}
                  className="group flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 shadow-amber-400/40 hover:shadow-amber-400/60"
                >
                  <FileText className="w-7 h-7 mb-1 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
                  <span className="text-sm text-center">Judging Rubric (FYP, IDP, & Community Services)</span>
                  <span className="text-[10px] text-white/70 group-hover:text-white/90">Open PDF</span>
                </button>
                
                
                {/* Log Out Button */}
                <button
                    onClick={() => {
                        document.cookie = "username=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
                        window.location.href = "/";
                    }}
                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-transform transform hover:scale-[1.03] shadow-lg shadow-red-500/30"
                >
                    <LogOut className="w-6 h-6 mb-1"/>
                    <span className="text-sm text-center">Log Out</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
