import { useState, useEffect } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import { FaArrowLeft, FaQrcode, FaCopy } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

const SUPABASE_URL = "https://pftyzswxwkheomnqzytu.supabase.co";
const SUPABASE_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHl6c3d4d2toZW9tbnF6eXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjczNzksImV4cCI6MjA2OTM0MzM3OX0.TI9DGipYP9X8dSZSUh5CVQIbeYnf9vhNXAqw5e5ZVkk";

// TODO: Replace with the logged-in judge UUID from your auth system
const LOGGED_IN_JUDGE_ID = "<uuid-of-logged-in-judge>";

export default function QRScannerPage() {
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState({ innovation: "", impact: "", feasibility: "" });
  const navigate = useNavigate();

  // ------------------ Copy QR text ------------------
  const handleCopy = () => {
    if (scannedData) {
      navigator.clipboard.writeText(scannedData);
      toast.success("QR Code content copied to clipboard!");
    }
  };

  // ------------------ Fetch participant ------------------
  useEffect(() => {
    if (!scannedData) return;

    const fetchParticipant = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/participants?name=eq.${encodeURIComponent(scannedData)}`,
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
        } else {
          toast.error("Participant not found!");
          setParticipant(null);
        }
      } catch (err) {
        console.error(err);
        toast.error("Error fetching participant");
      }
      setLoading(false);
    };

    fetchParticipant();
  }, [scannedData]);

  // ------------------ Submit Scores ------------------
  const handleSubmitScores = async () => {
    if (!participant) return;

    const { innovation, impact, feasibility } = scores;

    // Validate scores 0-10
    if (
      !innovation || isNaN(Number(innovation)) || Number(innovation) < 0 || Number(innovation) > 10 ||
      !impact || isNaN(Number(impact)) || Number(impact) < 0 || Number(impact) > 10 ||
      !feasibility || isNaN(Number(feasibility)) || Number(feasibility) < 0 || Number(feasibility) > 10
    ) {
      toast.error("Scores must be numbers between 0 and 10");
      return;
    }

    try {
      // Check if judge already scored
      const existingScoreRes = await fetch(
        `${SUPABASE_URL}/rest/v1/scores?participant_id=eq.${participant.id}&judge_id=eq.${LOGGED_IN_JUDGE_ID}`,
        {
          headers: {
            apikey: SUPABASE_API_KEY,
            Authorization: `Bearer ${SUPABASE_API_KEY}`,
          },
        }
      );
      const existingScore = await existingScoreRes.json();
      if (existingScore.length > 0) {
        toast.info("You have already scored this participant");
        return;
      }

      // Submit score
      const payload = {
        participant_id: participant.id,
        judge_id: LOGGED_IN_JUDGE_ID,
        innovation_score: Number(innovation),
        impact_score: Number(impact),
        feasibility_score: Number(feasibility),
        comments: "",
      };

      const res = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_API_KEY,
          Authorization: `Bearer ${SUPABASE_API_KEY}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Scores submitted successfully!");
        setScores({ innovation: "", impact: "", feasibility: "" });
        setScannedData(null);
        setParticipant(null);
      } else {
        toast.error("Failed to submit scores");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error submitting scores");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/profile")}
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-gray-800 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 transition-colors duration-200 shadow-md"
        >
          <FaArrowLeft />
          <span className="font-medium">Back to Profile</span>
        </button>

        {/* Header */}
        <h1 className="text-3xl font-bold text-yellow-400 mb-6 flex items-center gap-3">
          <FaQrcode className="text-2xl" />
          QR Code Scanner
        </h1>

        {/* Scanner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-gray-800 p-4 rounded-2xl shadow-xl flex flex-col items-center justify-center"
        >
          <div className="w-full max-w-md aspect-square rounded-xl overflow-hidden border-2 border-yellow-400 shadow-lg">
            <BarcodeScannerComponent
              width="100%"
              height="100%"
              onUpdate={(_err, result) => {
                if (result) setScannedData(result.getText());
              }}
            />
          </div>

          {/* Result */}
          <div className="mt-6 text-center w-full">
            {scannedData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-700 px-6 py-4 rounded-xl shadow-lg"
              >
                <p className="text-gray-300 text-sm mb-2">Scanned QR Code:</p>
                <p className="text-yellow-300 font-semibold break-all">{scannedData}</p>

                <button
                  onClick={handleCopy}
                  className="mt-3 px-4 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition mr-2"
                >
                  <FaCopy className="inline mr-2" />
                  Copy to Clipboard
                </button>
              </motion.div>
            )}

            {/* Participant form */}
            {loading && <p className="text-gray-400 mt-4">Loading participant...</p>}

            {participant && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 p-6 rounded-xl mt-4 shadow-lg"
              >
                <h2 className="text-yellow-400 font-bold mb-4">Enter Scores for {participant.name}</h2>
                <div className="grid gap-4">
                  <input
                    type="number"
                    placeholder="Innovation Score"
                    value={scores.innovation}
                    onChange={(e) => setScores({ ...scores, innovation: e.target.value })}
                    className="bg-gray-700 px-4 py-2 rounded-lg text-white focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Impact Score"
                    value={scores.impact}
                    onChange={(e) => setScores({ ...scores, impact: e.target.value })}
                    className="bg-gray-700 px-4 py-2 rounded-lg text-white focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Feasibility Score"
                    value={scores.feasibility}
                    onChange={(e) => setScores({ ...scores, feasibility: e.target.value })}
                    className="bg-gray-700 px-4 py-2 rounded-lg text-white focus:outline-none"
                  />
                  <button
                    onClick={handleSubmitScores}
                    className="mt-2 px-4 py-2 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition"
                  >
                    Submit Scores
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
