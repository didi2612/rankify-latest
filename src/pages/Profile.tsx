import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const SUPABASE_URL = "https://pftyzswxwkheomnqzytu.supabase.co";
const SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHl6c3d4d2toZW9tbnF6eXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjczNzksImV4cCI6MjA2OTM0MzM3OX0.TI9DGipYP9X8dSZSUh5CVQIbeYnf9vhNXAqw5e5ZVkk"; // Secure this key in production

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

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchProfileAndNotes = async () => {
    const username = getCookie("username");
    if (!username) return;

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
    if (!userData?.length) return;

    const userProfile = userData[0];
    setUser(userProfile);
    setEditUsername(userProfile.username);
    setEditAvatar(userProfile.avatar_url);

    
    
   
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("https://azmiproductions.com/api/studyjom/upload.php?type=avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditAvatar(data.url);
        toast.success("Avatar uploaded successfully !");
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
    setSaving(false);

    if (res.ok) {
      document.cookie = `username=${editUsername};path=/;max-age=86400;SameSite=Lax`;

      setUser(updated[0]);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } else {
      toast.error("Failed to update profile.");
    }
  };

  useEffect(() => {
    fetchProfileAndNotes();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black font-inter">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white px-6 py-20 font-inter relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <img
            src={
              (isEditing ? editAvatar : user.avatar_url) ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}`
            }
            alt="User Avatar"
            className="w-28 h-28 rounded-full border-4 border-yellow-400 shadow-md object-cover"
          />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-yellow-300">
            Hola, {user.username} 🌟
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">Your personalized space</p>
        </div>

        <div className="bg-gray-800/70 backdrop-blur-md border border-gray-700 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-400">Username</p>
              
                <p className="text-lg font-semibold text-white">{user.username}</p>
              
            </div>

            <div>
              <p className="text-sm text-gray-400">Avatar</p>
              {isEditing ? (
                <div className="flex items-center gap-3 mt-1">
                  <input
                    id="avatarInput"
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/gif"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="avatarInput"
                    className="bg-gray-600 hover:bg-gray-700 text-sm px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Change Avatar
                  </label>
                  {editAvatar && (
                    <img
                      src={editAvatar}
                      alt="Preview"
                      className="w-10 h-10 rounded-full border object-cover"
                    />
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">—</p>
              )}
            </div>

</div>
          <div className="flex flex-wrap gap-4 justify-between items-center pt-4">
            {isEditing ? (
              <>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditUsername(user.username);
                      setEditAvatar(user.avatar_url);
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateProfile}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black font-semibold"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-4 flex-wrap">
          
        {/* Conditionally render based on account_type */}
  {user.account_type == "SuperAdmin" && (
    <>
      <Link
        to="/admin"
        className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-200"
      >
        Admin Panel
      </Link>
      
      
     
    </>
  )}
    <Link
        to="/qr"
        className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-200"
      >
     Evaluation
      </Link>
          <button
            onClick={() => {
              document.cookie = "username=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";

              window.location.href = "/";
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
