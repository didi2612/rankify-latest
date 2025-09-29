import { useState, useEffect } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import { ArrowLeft, QrCode, Copy, User, Zap, Star, TrendingUp, Send, Loader2, MessageSquare } from "lucide-react"; // Added MessageSquare, Loader2
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import Cookies from "js-cookie";


const SUPABASE_URL = "https://pftyzswxwkheomnqzytu.supabase.co";
const SUPABASE_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHl6c3d4d2toZW9tbnF6eXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjczNzksImV4cCI6MjA2OTM0MzM3OX0.TI9DGipYP9X8dSZSUh5CVQIbeYnf9vhNXKqw5e5ZVkk";
const [judgeId, setJudgeId] = useState<string | null>(null); 
// TODO: Replace with the logged-in judge UUID from your auth system
// Get logged-in judge username from cookies
// fetch the judge ui instead of username

useEffect(() => {
    const loadJudgeId = async () => {
      const username = Cookies.get("username") || "";
      if (!username) return;
      const id = await fetchJudgeId(username);
      setJudgeId(id);
    };
    loadJudgeId();
  }, []);
const fetchJudgeId = async (username: string) => {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/judges?username=eq.${encodeURIComponent(username)}&select=id`,
    {
      headers: {
        apikey: SUPABASE_API_KEY,
        Authorization: `Bearer ${SUPABASE_API_KEY}`,
      },
    }
  );
  const data = await res.json();
  return data.length > 0 ? data[0].id : null;
};



// --- Custom Components for better readability and reusability ---

interface ScoreInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    icon: React.ReactNode;
}

// Enhanced Score Input with better visual separation and hover effects
const ScoreInput: React.FC<ScoreInputProps> = ({ label, value, onChange, icon }) => (
    <div className="flex flex-col">
        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
            {icon} {label}
        </label>
        <div className="flex items-center bg-gray-700 border border-gray-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition duration-200">
            <input
                type="number"
                placeholder="0"
                min="0"
                max="10"
                value={value}
                onChange={(e) => {
                    const val = e.target.value;
                    // Enforce max 10
                    if (val === "" || (Number(val) >= 0 && Number(val) <= 10)) {
                        onChange(val);
                    }
                }}
                className="w-full bg-gray-800/70 px-4 py-3 text-white placeholder-gray-500 text-xl font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-gray-400 font-medium px-4">/ 10</span>
        </div>
    </div>
);

interface ParticipantCardProps {
    participant: any;
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({ participant }) => (
    <div className="mb-6 text-left p-4 bg-gray-900 rounded-lg border border-gray-700 shadow-lg">
        <div className="flex items-start gap-3">
            <User className="w-6 h-6 text-blue-500 mt-1"/>
            <div>
                <h2 className="text-xl font-bold text-white leading-tight">{participant.name}</h2>
                <p className="text-amber-400 font-medium text-sm leading-tight">{participant.project_title}</p>
            </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs text-gray-400">
            <span>{participant.institution}</span>
            <span className="font-semibold text-blue-400">{participant.category}</span>
        </div>
    </div>
);


// ---------------------------------------------------------------

export default function QRScannerPage() {
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState({ innovation: "", impact: "", feasibility: "", comments: "" }); // Added comments
  const navigate = useNavigate();

  // ------------------ Copy QR text ------------------
  const handleCopy = () => {
    if (scannedData) {
      navigator.clipboard.writeText(scannedData);
      toast.success("QR Code content copied to clipboard! 📋");
    }
  };

  // ------------------ Fetch participant ------------------
  useEffect(() => {
    if (!scannedData) return;

    const fetchParticipant = async () => {
      setLoading(true);
      setParticipant(null); // Clear previous participant data
      setScores({ innovation: "", impact: "", feasibility: "", comments: "" }); // Clear previous scores

      try {
        const res = await fetch(
          // Use `ilike` for case-insensitive search if supported by your RLS/DB configuration, 
          // but sticking to `eq` for safety based on original code
          `${SUPABASE_URL}/rest/v1/participants?name=eq.${encodeURIComponent(scannedData)}&select=id,name,project_title,institution,category`,
          {
            headers: {
              apikey: SUPABASE_API_KEY,
              Authorization: `Bearer ${SUPABASE_API_KEY}`,
            },
          }
        );
        const result = await res.json();
        if (result.length > 0) {
          setParticipant(result[0]);
          toast.success(`Participant found: ${result[0].name}`);
        } else {
          toast.error("Participant not found. Check the QR code content.");
          setParticipant(null);
        }
      } catch (err) {
        console.error(err);
        toast.error("Error fetching participant data");
      }
      setLoading(false);
    };

    fetchParticipant();
  }, [scannedData]);

  // ------------------ Submit Scores ------------------
  const handleSubmitScores = async () => {
    if (!participant) return;

    const { innovation, impact, feasibility, comments } = scores;

    // Validate scores 0-10
    const scoreFields = [
      { key: 'Innovation', value: innovation },
      { key: 'Impact', value: impact },
      { key: 'Feasibility', value: feasibility },
    ];

    for (const field of scoreFields) {
        const numValue = Number(field.value);
        if (
            !field.value || 
            isNaN(numValue) || 
            numValue < 0 || 
            numValue > 10
        ) {
            toast.error(`Invalid score for ${field.key}. Must be a number between 0 and 10.`);
            return;
        }
    }

   if (!judgeId) {
    toast.error("CONFIGURATION ERROR: Judge ID is not set.", {
      autoClose: 8000
    });
    return;
    }

    try {
      // Check for existing score
      const existingScoreRes = await fetch(
        `${SUPABASE_URL}/rest/v1/scores?participant_id=eq.${participant.id}&judge_id=eq.${judgeId}&select=id`,
        {
          headers: { apikey: SUPABASE_API_KEY, Authorization: `Bearer ${SUPABASE_API_KEY}` },
        }
      );
      const existingScore = await existingScoreRes.json();
      
      const payload = {
        participant_id: participant.id,
        judge_id: judgeId,
        innovation_score: Number(innovation),
        impact_score: Number(impact),
        feasibility_score: Number(feasibility),
        comments: comments || null,
      };

      let res;
      if (existingScore.length > 0) {
        // PATCH/UPDATE existing score
        res = await fetch(`${SUPABASE_URL}/rest/v1/scores?id=eq.${existingScore[0].id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_API_KEY,
                Authorization: `Bearer ${SUPABASE_API_KEY}`,
                Prefer: "return=representation",
            },
            body: JSON.stringify(payload),
        });
      } else {
        // POST/CREATE new score
        res = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_API_KEY,
                Authorization: `Bearer ${SUPABASE_API_KEY}`,
                Prefer: "return=representation",
            },
            body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const action = existingScore.length > 0 ? "updated" : "submitted";
        toast.success(`Scores successfully ${action} for ${participant.name}! 🎉`);
        setScores({ innovation: "", impact: "", feasibility: "", comments: "" });
        setScannedData(null);
        setParticipant(null);
      } else {
        const errorData = await res.json();
        console.error("Supabase Error:", errorData);
        toast.error(`Failed to submit scores. ${errorData.message || 'Server error.'}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("A network error occurred while submitting scores.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 md:px-6 py-10 font-sans">
      <div className="max-w-xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/profile")}
          className="inline-flex items-center gap-2 mb-8 px-5 py-2 rounded-full bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200 shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium text-sm">Back to Profile</span>
        </button>

        {/* Header */}
        <h1 className="text-2xl font-extrabold text-blue-400 mb-2 flex items-center gap-3">
          <QrCode className="w-8 h-8" />
         Evaluation page
        </h1>
        <p className="text-gray-400 mb-8">Scan the participant's ID to begin scoring their project presentation.</p>

        {/* Scanner & Scoring Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-700"
        >
          <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700/50 pb-3">QR Scanner</h2>
          <div className="w-full max-w-xs mx-auto aspect-square rounded-xl overflow-hidden border-4 border-amber-500 shadow-inner shadow-amber-500/30">
            <BarcodeScannerComponent
              width="100%"
              height="100%"
              onUpdate={(_err, result) => {
                if (result) setScannedData(result.getText());
              }}
             
            />
          </div>

          {/* Result Area */}
          <div className="mt-6 text-center w-full">
            {scannedData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 border border-gray-700 px-6 py-3 rounded-xl shadow-inner shadow-black/30 mb-6"
              >
                <p className="text-gray-500 text-xs mb-1">SCANNED ID</p>
                <div className="flex items-center justify-center gap-3">
                    <p className="text-amber-400 font-mono break-all text-sm md:text-base">{scannedData}</p>
                    <button
                        onClick={handleCopy}
                        className="p-2 bg-gray-700 text-blue-400 rounded-lg hover:bg-gray-600 transition"
                        title="Copy ID"
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                </div>
              </motion.div>
            )}

            {/* Participant Info Card & Score Form */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="mt-6"
            >
                {loading && (
                    <div className="flex items-center justify-center p-6 bg-gray-800 rounded-xl">
                        <Loader2 className="animate-spin mr-3 h-5 w-5 text-blue-500" />
                        <p className="text-gray-400">Fetching participant details...</p>
                    </div>
                )}

                {participant && !loading && (
                    <div
                        className="bg-gray-900 p-6 rounded-xl border border-blue-500/30 shadow-2xl shadow-blue-500/10"
                    >
                        <ParticipantCard participant={participant} />

                        {/* Score Inputs */}
                        <div className="grid gap-4 mb-6">
                            <ScoreInput
                                label="Innovation & Originality"
                                value={scores.innovation}
                                onChange={(value) => setScores({ ...scores, innovation: value })}
                                icon={<Zap className="w-5 h-5" />}
                            />
                            <ScoreInput
                                label="Impact & Relevance"
                                value={scores.impact}
                                onChange={(value) => setScores({ ...scores, impact: value })}
                                icon={<TrendingUp className="w-5 h-5" />}
                            />
                            <ScoreInput
                                label="Technical Feasibility"
                                value={scores.feasibility}
                                onChange={(value) => setScores({ ...scores, feasibility: value })}
                                icon={<Star className="w-5 h-5" />}
                            />
                            
                            {/* Comment Box for professionalism */}
                            <div className="flex flex-col">
                                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <MessageSquare className="w-4 h-4"/> Comments (Optional)
                                </label>
                                <textarea
                                    placeholder="Enter your qualitative feedback here..."
                                    value={scores.comments}
                                    onChange={(e) => setScores({ ...scores, comments: e.target.value })}
                                    className="w-full bg-gray-800/70 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    rows={3}
                                />
                            </div>
                        </div>
                        
                        <button
                            onClick={handleSubmitScores}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors duration-200 shadow-xl shadow-blue-500/40 flex items-center justify-center gap-2 disabled:opacity-50"
                            disabled={!scores.innovation || !scores.impact || !scores.feasibility}
                        >
                            <Send className="w-5 h-5" />
                            Finalize & Submit Scores
                        </button>
                    </div>
                )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
