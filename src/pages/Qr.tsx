import { useState, useEffect } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import { ArrowLeft, QrCode, Copy, User, Zap, Star, TrendingUp, Send, Loader2 } from "lucide-react"; // Added MessageSquare, Loader2
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import Cookies from "js-cookie";



const SUPABASE_URL = "https://pftyzswxwkheomnqzytu.supabase.co";
const SUPABASE_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHl6c3d4d2toZW9tbnF6eXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjczNzksImV4cCI6MjA2OTM0MzM3OX0.TI9DGipYP9X8dSZSUh5CVQIbeYnf9vhNXAqw5e5ZVkk";

// TODO: Replace with the logged-in judge UUID from your
// Get logged-in judge username from cookies
// fetch the judge ui instead of username
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

interface CheckBoxInputProps {
  label: string;
  value: number | null; // 2.5 = Yes, 0 = No, null = not selected yet
  onChange: (value: number) => void;
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
            <span className="px-3 text-gray-400 text-sm font-semibold border-l border-gray-600">
              / 10
            </span>
        </div>
    </div>
);

const CheckBoxInput: React.FC<CheckBoxInputProps> = ({ label, value, onChange, icon }) => (
  <div className="flex flex-col">
    <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
      {icon} {label}
    </label>
    <div className="flex items-center gap-4 bg-gray-700 border border-gray-700 rounded-lg px-4 py-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          checked={value === 2.5}
          onChange={() => onChange(2.5)}
          className="form-radio text-blue-500"
        />
        <span className="text-white">Yes (2.5)</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          checked={value === 0}
          onChange={() => onChange(0)}
          className="form-radio text-blue-500"
        />
        <span className="text-white">No (0)</span>
      </label>
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
                <p className="text-amber-400 font-medium text-sm leading-tight">
                  {participant.project_title}
                </p>
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
  const [judgeId, setJudgeId] = useState<string | null>(null);
  const [scores, setScores] = useState({ innovation: "", impact: "", feasibility: "", comments: "", market: "", publication: null as number | null, others: null as number | null});
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAlreadySubmittedModal, setShowAlreadySubmittedModal] = useState(false);

    useEffect(() => {
    const loadJudgeId = async () => {
      const username = Cookies.get("username") || "";
      if (!username) return;
      const id = await fetchJudgeId(username);
      setJudgeId(id);
    };
    loadJudgeId();
  }, []);

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
      setParticipant(null);
      setScores({ innovation: "", impact: "", feasibility: "", comments: "", market: "", publication: null, others: null });

      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/participants?id=eq.${encodeURIComponent(scannedData)}&select=id,name,project_title,institution,category`,
          {
            headers: {
              apikey: SUPABASE_API_KEY,
              Authorization: `Bearer ${SUPABASE_API_KEY}`,
            },
          }
        );
        const result = await res.json();

        if (result.length > 0) {
          const participantData = result[0];
          setParticipant(participantData);

          // 🔎 Check if judge already submitted score
          if (judgeId) {
            const scoreRes = await fetch(
              `${SUPABASE_URL}/rest/v1/scores?participant_id=eq.${participantData.id}&judge_id=eq.${judgeId}&select=*`,
              {
                headers: {
                  apikey: SUPABASE_API_KEY,
                  Authorization: `Bearer ${SUPABASE_API_KEY}`,
                },
              }
            );
            const scoreData = await scoreRes.json();

            if (scoreData.length > 0) {
              setSubmitted(true);
              const existing = scoreData[0];
              setScores({
                innovation: String(existing.innovation_score ?? ""),
                impact: String(existing.impact_score ?? ""),
                feasibility: String(existing.feasibility_score ?? ""),
                comments: existing.comments ?? "",
                market: String(existing.market_score ?? ""),
                publication: existing.publication_score,
                others: existing.others_score,
              });

              // 🚨 Show popup modal instead of inline text
              setShowAlreadySubmittedModal(true);
            } else {
              setSubmitted(false);
            }
          }

          toast.success(`Participant found: ${participantData.name}`);
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

    if (submitted) {
    console.log("You already submitted");
    return;
  }

  // 🚀 Do your actual submission logic here (e.g., Supabase insert)
  console.log("Submitting scores...");

  // Mark as submitted
  setSubmitted(true);

    const { innovation, impact, feasibility, market} = scores;

    // Validate scores 0-10
    const scoreFields = [
      { key: 'Innovation', value: innovation },
      { key: 'Impact', value: impact },
      { key: 'Feasibility', value: feasibility },
      { key: "Market", value: market },
    ];

    let errors: string[] = [];
    for (const field of scoreFields) {
      if (field.key === "Publication" || field.key === "Others") {
        // ✅ only check if they are null (not chosen yet)
        if (field.value === null || field.value === undefined) {
          errors.push(`${field.key} must be selected (Yes or No).`);
        }
      } else {
        // ✅ normal numeric range validation (0–10)
        if (isNaN(Number(field.value)) || Number(field.value) < 0 || Number(field.value) > 10) {
          errors.push(`${field.key} must be a number between 0 and 10.`);
        }
      }
    }

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

    

    try {
      // Check for existing score
      const existingScoreRes = await fetch(
        `${SUPABASE_URL}/rest/v1/scores?participant_name=eq.${participant.id}&judge_id=eq.${judgeId}&select=id`,
        {
          headers: { apikey: SUPABASE_API_KEY, Authorization: `Bearer ${SUPABASE_API_KEY}` },
        }
      );
      const existingScore = await existingScoreRes.json();
      
      const payload = {
        participant_id: participant.id,
        judge_id: judgeId,
        category: participant.category,
        innovation_score: Number(innovation),
        impact_score: Number(impact),
        feasibility_score: Number(feasibility),
        market_score: Number(scores.market),
        publication_score:
          participant?.category?.toLowerCase() === "pg"
            ? scores.publication ?? 0
            : null,
        others_score:
          participant?.category?.toLowerCase() === "pg"
            ? scores.others ?? 0
            : null,
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

        // Reset everything
        setScores({
          innovation: "",
          impact: "",
          feasibility: "",
          comments: "",
          market: "",
          publication: null,
          others: null,
        });
        setScannedData(null);
        setParticipant(null);

        // ✅ Show success popup
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("A network error occurred while submitting scores.");
    }
  };

  const calculateTotalScore = () => {
    const { innovation, impact, feasibility, market, publication, others } = scores;

    // Convert numeric scores safely
    const baseScores = [innovation, impact, feasibility, market]
      .map((s) => Number(s) || 0);

    // Add optional checkboxes (only if not null)
    const extraScores = [
      publication !== null ? publication : 0,
      others !== null ? others : 0,
    ];

    const total = [...baseScores, ...extraScores].reduce((a, b) => a + b, 0);
    return total;
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
                                label="Novelty and Inventiveness (0-10)"
                                value={scores.innovation}
                                onChange={(value) => setScores({ ...scores, innovation: value })}
                                icon={<Zap className="w-5 h-5" />}
                            />
                            <ScoreInput
                                label="Usefulness and Application (0-10)"
                                value={scores.impact}
                                onChange={(value) => setScores({ ...scores, impact: value })}
                                icon={<TrendingUp className="w-5 h-5" />}
                            />
                            <ScoreInput
                                label="Presentation and Demonstration (0-10)"
                                value={scores.feasibility}
                                onChange={(value) => setScores({ ...scores, feasibility: value })}
                                icon={<Star className="w-5 h-5" />}
                            />
                            <ScoreInput
                                label="Market and Commercial Potential (0-10)"
                                value={scores.market}
                                onChange={(value) => setScores({ ...scores, market: value })}
                                icon={<Star className="w-5 h-5" />}
                            />
                            
                            {/* Show extra fields ONLY if category is pg */}
                            {participant?.category?.toLowerCase() === "pg" && (
                              <>
                                <CheckBoxInput
                                  label="Publication (0-10)"
                                  value={scores.publication}
                                  onChange={(value) => setScores({ ...scores, publication: value })}
                                  icon={<Star className="w-5 h-5" />}
                                />
                                <CheckBoxInput
                                  label="Any LOI, NDA, MoU or MoA (0-10)"
                                  value={scores.others}
                                  onChange={(value) => setScores({ ...scores, others: value })}
                                  icon={<Star className="w-5 h-5" />}
                                />
                              </>
                            )}
                        </div>

                        {!submitted && (
                          <button
                            onClick={() => setShowConfirmModal(true)}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors duration-200 shadow-xl shadow-blue-500/40 flex items-center justify-center gap-2 disabled:opacity-50"
                            disabled={!scores.innovation || !scores.impact || !scores.feasibility}
                          >
                            <Send className="w-5 h-5" />
                            Finalize & Submit Scores
                          </button>
                        )}
                    </div>
                )}
            </motion.div>
          </div>
        </motion.div>
      </div>
      {/* --- Confirmation Modal --- */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl shadow-2xl p-8 text-center max-w-sm mx-auto border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-3">Confirm Submission</h3>

            <div className="bg-gray-900 rounded-lg p-6 mb-5 border border-gray-700">
              <p className="text-gray-400 text-sm mb-2">Total Score</p>
              <span className="text-4xl font-extrabold text-amber-400">
                {calculateTotalScore().toFixed(2)}
              </span>
            </div>

            <p className="text-gray-400 mb-6">
              Are you sure you want to submit this total score? You won’t be able to edit it later.
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  handleSubmitScores();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Success Modal --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-green-700 rounded-xl shadow-2xl p-8 text-center max-w-sm mx-auto border border-green-500">
            <h3 className="text-lg font-bold text-white mb-3">✅ Submitted Successfully!</h3>
            <p className="text-green-100 mb-6">Your scores have been recorded.</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="px-4 py-2 bg-white text-green-700 font-semibold rounded-lg hover:bg-gray-100 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* --- Already Submitted Modal --- */}
      {showAlreadySubmittedModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-yellow-700 rounded-xl shadow-2xl p-8 text-center max-w-sm mx-auto border border-yellow-500">
            <h3 className="text-lg font-bold text-white mb-3">⚠️ Already Submitted</h3>
            <p className="text-yellow-100 mb-6">
              You have already submitted scores for this participant.
            </p>
            <button
              onClick={() => {
                setShowAlreadySubmittedModal(false);
                setParticipant(null);
                setScannedData(null);
              }}
              className="px-4 py-2 bg-white text-yellow-700 font-semibold rounded-lg hover:bg-gray-100 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
