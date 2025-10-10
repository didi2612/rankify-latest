import { useState, useEffect, FC } from "react";
// Assuming the environment supports routing via react-router-dom, as it was in the original code.
// If running in an environment without routing, this component will simply manage state locally.
import { useNavigate } from "react-router-dom"; 

// NOTE: In a real-world app, API keys should never be hardcoded in the frontend.
// The provided keys are used here as per the original component structure.
const SUPABASE_URL = "https://pftyzswxwkheomnqzytu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHl6c3d4d2toZW9tbnF6eXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjczNzksImV4cCI6MjA2OTM0MzM3OX0.TI9DGipYP9X8dSZSUh5CVQIbeYnf9vhNXAqw5e5ZVkk";

// Define the three possible states for the flow
const FLOW_STATES = {
  USERNAME_INPUT: 'username_input', // Initial state: check username existence/password status
  PASSWORD_SETUP: 'password_setup', // Setup state: create a new password
  LOGIN_PROMPT: 'login_prompt',     // Result state: user already has an account and password
  SETUP_SUCCESS: 'setup_success'    
};

// --- TypeScript Type Definitions ---

type MessageType = 'error' | 'success' | 'blue' | '';

interface MessageState {
  text: string;
  type: MessageType;
}

interface MessageProps {
  message: MessageState;
}

// Custom Message component to replace alert()
const Message: FC<MessageProps> = ({ message }) => {
  if (!message.text) return null;

  const baseClasses = "fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg transition-opacity duration-300 transform";
  const typeClasses = message.type === 'error' 
    ? "bg-red-600 text-white" 
    : message.type === 'success' 
    ? "bg-green-600 text-white" 
    : "bg-blue-600 text-white";

  return (
    <div className={`${baseClasses} ${typeClasses}`}>
      <p className="font-semibold">{message.text}</p>
    </div>
  );
};

export default function AuthHandler() {
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [flowState, setFlowState] = useState(FLOW_STATES.USERNAME_INPUT);
  // Apply the MessageState interface to the state hook
  const [message, setMessage] = useState<MessageState>({ text: "", type: "" });
  const navigate = useNavigate();

  // Utility to display messages
  const showMessage = (text: string, type: MessageType = 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  // Redirect if already logged in (using cookie from original logic)
  useEffect(() => {
    const cookieUsername = document.cookie
      .split("; ")
      .find((row) => row.startsWith("username="))
      ?.split("=")[1];
    if (cookieUsername && flowState !== FLOW_STATES.SETUP_SUCCESS) {
      // Redirect to profile if already authenticated
      navigate("/profile"); 
    }
  }, [navigate, flowState]);

  // --- Core Logic Functions ---

  const handleUsernameCheck = async () => {
    if (!username.trim()) {
      return showMessage("Please enter your username.", 'error');
    }

    setLoading(true);
    try {
      // Query for the judge by username and select only the password field
      const res = await fetch(`${SUPABASE_URL}/rest/v1/judges?username=eq.${username}&select=password`, {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.length > 0) {
        const userData = data[0];
        // Check if the password field is already set (non-null/non-empty)
        if (userData.password) {
          setFlowState(FLOW_STATES.LOGIN_PROMPT);
        } else {
          setFlowState(FLOW_STATES.PASSWORD_SETUP);
        }
      } else {
        showMessage("Username not found. Please contact an administrator or check your spelling.", 'error');
      }
    } catch (err) {
      console.error("Username check error:", err);
      showMessage("An unexpected error occurred during account verification.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSetup = async () => {
    if (!newPassword || !confirmPassword) {
      return showMessage("Both New Password and Reconfirm Password fields are required.", 'error');
    }
    if (newPassword !== confirmPassword) {
      return showMessage("Passwords do not match. Please re-enter.", 'error');
    }

    setLoading(true);
    try {
      // Update the user's record with the new password
      // NOTE: This assumes 'password' is a simple text field. In production, 
      // you MUST hash the password securely on the server-side before storing.
      const res = await fetch(`${SUPABASE_URL}/rest/v1/judges?username=eq.${username}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: "return=minimal" // Optimize for minimal response data
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (res.ok) {
        // Successful setup, set cookie for immediate "login" as per original logic
        document.cookie = `username=${username}; path=/; max-age=86400`;
        setFlowState(FLOW_STATES.SETUP_SUCCESS);
        showMessage("Password set successfully! Redirecting to your profile...", 'success');
        // Wait a moment for the success message to show, then navigate
        setTimeout(() => navigate("/profile"), 1500); 
      } else {
        showMessage("Failed to set password. Please try again.", 'error');
      }
    } catch (err) {
      console.error("Password setup error:", err);
      showMessage("A network error occurred during password setup.", 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Rendering Functions based on Flow State ---

  const renderUsernameInput = () => (
    <>
      <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 animate-text">
        FIRST TIME LOGIN
      </h1>
      <p className="text-gray-400 text-center mb-4">
        Enter your username to proceed
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Username</label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="eg. azmi"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            disabled={loading}
          />
        </div>
        <button
          onClick={handleUsernameCheck}
          disabled={loading || !username.trim()}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-xl transition disabled:opacity-50"
        >
          {loading ? "Checking..." : "Continue"}
        </button>
      </div>
    </>
  );

  const renderPasswordSetup = () => (
    <>
      <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 animate-text">
        First Time Setup
      </h1>
      <p className="text-gray-400 text-center mb-4">
        Welcome, **{username}**! Please set a strong password.
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">New Password</label>
          <input
            type="password"
            className="w-full px-4 py-3 rounded-xl bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Reconfirm Password</label>
          <input
            type="password"
            className="w-full px-4 py-3 rounded-xl bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            disabled={loading}
          />
        </div>
        <button
          onClick={handlePasswordSetup}
          disabled={loading || !newPassword || newPassword !== confirmPassword}
          className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
        >
          {loading ? "Saving..." : "Set Password & Continue"}
        </button>
        <button
          onClick={() => setFlowState(FLOW_STATES.USERNAME_INPUT)}
          className="w-full text-sm text-gray-400 hover:text-gray-200 transition"
          disabled={loading}
        >
          &larr; Check a different Username
        </button>
      </div>
    </>
  );

  const renderLoginPrompt = () => (
    <>
      <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 animate-text">
        Existing Account
      </h1>
      <p className="text-gray-400 text-center mb-4">
        Welcome back, **{username}**. You already have a password set.
      </p>
      <div className="space-y-4">
        <div className="p-4 bg-gray-700/50 rounded-xl">
          <p className="text-white">
            Please proceed to the main login page to enter your password and access your profile.
          </p>
        </div>
        <button
          onClick={() => navigate("/login")} // Assumes a dedicated /login route for standard login
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-xl transition"
        >
          Go to Login Page
        </button>
        <button
          onClick={() => setFlowState(FLOW_STATES.USERNAME_INPUT)}
          className="w-full text-sm text-gray-400 hover:text-gray-200 transition"
          disabled={loading}
        >
          &larr; Check a different Username
        </button>
      </div>
    </>
  );

  const renderContent = () => {
    switch (flowState) {
      case FLOW_STATES.PASSWORD_SETUP:
        return renderPasswordSetup();
      case FLOW_STATES.LOGIN_PROMPT:
        return renderLoginPrompt();
      case FLOW_STATES.SETUP_SUCCESS:
        return (
          <div className="text-center p-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-green-500 mb-2">Setup Complete!</h2>
            <p className="text-gray-400">Your password has been successfully saved. You are now being redirected.</p>
          </div>
        );
      case FLOW_STATES.USERNAME_INPUT:
      default:
        return renderUsernameInput();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white px-6 py-20 flex items-center justify-center font-inter relative overflow-hidden">
      <style jsx="true">{`
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
      
      {/* Background Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl animate-pulse delay-700" />
      
      <Message message={message} />

      <div className="relative z-10 bg-gray-800/60 backdrop-blur-lg p-10 rounded-2xl shadow-2xl w-full max-w-md space-y-6 border border-gray-700">
        {renderContent()}
      </div>
    </div>
  );
}
