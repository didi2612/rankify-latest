import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { User, Settings, Camera, Save, X, LogOut, QrCode, Shield } from "lucide-react"; // Import professional icons

const SUPABASE_URL = "https://pftyzswxwkheomnqzytu.supabase.co";
// NOTE: For production, this key must be secured using environment variables or server-side calls.
const SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHl6c3d4d2toZW9tbnF6eXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjczNzksImV4cCI6MjA2OTM0MzM3OX0.TI9DGipYP9X8dSZSUh5CVQIbeYnf9vhNXAqw5e5ZVkk"; 

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

type UserProfile = {
  id: string;
  username: string;
  avatar_url: string;
  account_type: string; 
};

// --- Custom Components for better readability ---

interface InfoDisplayProps {
    label: string;
    value: string;
    isEditing: boolean;
    editValue: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InfoDisplay: React.FC<InfoDisplayProps> = ({ label, value, isEditing, editValue, onChange }) => (
    <div className="flex flex-col">
        <p className="text-sm font-medium text-gray-400 mb-1">{label}</p>
        {isEditing ? (
            <input
                type="text"
                value={editValue}
                onChange={onChange}
                className="bg-gray-700/50 border border-gray-700 text-white p-2 rounded-lg focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
            />
        ) : (
            <p className="text-lg font-semibold text-white">{value}</p>
        )}
    </div>
);


export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [saving, setSaving] = useState(false);

  // --- Data Fetching ---
  const fetchProfile = async () => {
    const username = getCookie("username");
    if (!username) return;

    try {
        const userRes = await fetch(
            `${SUPABASE_URL}/rest/v1/judges?select=*&username=eq.${username}`,
            {
                headers: {
                    apikey: SUPABASE_API_KEY,
                    Authorization: `Bearer ${SUPABASE_API_KEY}`,
                },
            }
        );
        const userData = await userRes.json();
        if (!userData?.length) {
            toast.error("User profile not found.");
            return;
        }

        const userProfile = userData[0];
        setUser(userProfile);
        setEditUsername(userProfile.username);
        setEditAvatar(userProfile.avatar_url);
    } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile data.");
    }
  };

  // --- Avatar Upload ---
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      // NOTE: Using a hypothetical external upload service. In a professional setting, this would be a Supabase storage bucket.
      const res = await fetch("https://azmiproductions.com/api/studyjom/upload.php?type=avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditAvatar(data.url);
        toast.success("Avatar uploaded successfully!");
      } else {
        toast.error(`Upload failed: ${data.message || 'Check external service.'}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error during file upload.");
    }
  };

  // --- Profile Update ---
  const updateProfile = async () => {
    if (!user || saving) return;
    setSaving(true);

    if (!editUsername.trim()) {
        toast.error("Username cannot be empty.");
        setSaving(false);
        return;
    }

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/judges?id=eq.${user.id}`, {
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
        
        if (res.ok && updated.length > 0) {
            // Update cookie with new username
            document.cookie = `username=${encodeURIComponent(editUsername)};path=/;max-age=86400;SameSite=Lax`;

            setUser(updated[0]);
            setIsEditing(false);
            toast.success("Profile updated successfully! ✨");
        } else {
            const error = updated[0]?.message || "Failed to update profile due to server error.";
            toast.error(error);
        }
    } catch (error) {
        console.error("Profile update error:", error);
        toast.error("A network error occurred while saving.");
    } finally {
        setSaving(false);
    }
  };

  // --- Effects ---
  useEffect(() => {
    fetchProfile();
  }, []);

  // --- Loading State ---
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gray-950">
        <svg className="animate-spin h-5 w-5 mr-3 text-cyan-400" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p>Loading profile...</p>
      </div>
    );
  }
  
  // --- Main Render ---
  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 md:px-6 py-10 font-sans">
      <div className="max-w-3xl mx-auto space-y-12">
        
        {/* Profile Header and Avatar */}
        <div className="flex flex-col items-center gap-4 text-center p-6 bg-gray-900 rounded-xl border border-gray-800 shadow-2xl">
            <div className="relative">
                <img
                    src={
                        (isEditing ? editAvatar : user.avatar_url) ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=1f2937&color=60a5fa&bold=true`
                    }
                    alt="User Avatar"
                    className="w-32 h-32 rounded-full border-4 border-cyan-500 shadow-lg object-cover"
                />
                {isEditing && (
                    <label 
                        htmlFor="avatarInput" 
                        className="absolute bottom-0 right-0 p-2 bg-cyan-600 rounded-full cursor-pointer hover:bg-cyan-500 transition border-2 border-gray-900"
                        title="Change Avatar"
                    >
                        <Camera className="w-5 h-5 text-white" />
                        <input
                            id="avatarInput"
                            type="file"
                            accept="image/png, image/jpeg, image/jpg, image/gif"
                            onChange={handleAvatarUpload}
                            className="hidden"
                        />
                    </label>
                )}
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold text-amber-400 tracking-tight">
                Welcome, {user.username}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                <User className="w-4 h-4 text-cyan-500"/>
                <span>{user.account_type} Account</span>
            </div>
        </div>

        {/* --- Profile Information & Editing Card --- */}
        <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Settings className="w-6 h-6 text-cyan-500"/> Profile Settings
                </h2>
                
                {/* Edit/Save Buttons */}
                {isEditing ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setEditUsername(user.username);
                                setEditAvatar(user.avatar_url);
                                setIsEditing(false);
                                toast.info("Editing cancelled.");
                            }}
                            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition"
                            title="Cancel"
                        >
                            <X className="w-5 h-5"/>
                        </button>
                        <button
                            onClick={updateProfile}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold transition shadow-md"
                    >
                        <Settings className="w-4 h-4" />
                        Edit Profile
                    </button>
                )}
            </div>

            {/* Profile Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InfoDisplay
                    label="Username"
                    value={user.username}
                    isEditing={isEditing}
                    editValue={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                />
                
                {/* Account Type Display */}
                <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-400 mb-1">Account ID</p>
                    <p className="text-lg font-mono text-gray-300 break-all">{user.id}</p>
                </div>
            </div>
        </div>
        
        {/* --- Action Links Section --- */}
        <div className="pt-6 border-t border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-4">Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Evaluation Link */}
                <Link
                    to="/qr"
                    className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-6 py-4 rounded-xl shadow-lg transition-all duration-200"
                >
                    <QrCode className="w-5 h-5" />
                    Evaluation
                </Link>

                {/* Admin Link (Conditional) */}
                {user.account_type === "SuperAdmin" && (
                    <Link
                        to="/admin"
                        className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold px-6 py-4 rounded-xl shadow-lg transition-all duration-200"
                    >
                        <Shield className="w-5 h-5" />
                        Admin Panel
                    </Link>
                )}
                
                {/* Log Out Button */}
                <button
                    onClick={() => {
                        document.cookie = "username=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
                        window.location.href = "/";
                    }}
                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200"
                >
                    <LogOut className="w-5 h-5" />
                    Log Out
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}