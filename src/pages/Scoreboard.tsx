import { useEffect, useState } from "react";
import { Trophy, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const SUPABASE_URL = "https://pftyzswxwkheomnqzytu.supabase.co";
const SUPABASE_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHl6c3d4d2toZW9tbnF6eXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjczNzksImV4cCI6MjA2OTM0MzM3OX0.TI9DGipYP9X8dSZSUh5CVQIbeYnf9vhNXAqw5e5ZVkk";

// 🔹 Helper: Get judge ID by username
const fetchJudgeId = async (username: string) => {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/judges?username=eq.${encodeURIComponent(
      username
    )}&select=id`,
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

interface Score {
  participant_id: string;
  innovation_score: number;
  impact_score: number;
  feasibility_score: number;
  market_score: number;
  publication_score: number;
  others_score: number;
  participant: {
    id: string;
    name: string;
    project_title: string;
    institution: string;
    category: string;
  };
}

interface LeaderboardEntry {
  participant: Score["participant"];
  totalInnovation: number;
  totalImpact: number;
  totalFeasibility: number;
  totalMarket: number;
  totalPublication: number;
  totalOthers: number;
  totalScore: number;
}

export default function ScoreboardPage() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<Record<string, LeaderboardEntry[]>>({});
  const [selectedCategory, setSelectedCategory] = useState("FYP");

  const navigate = useNavigate();
  const categories = ["FYP", "IDP", "Community Services", "PG"];

  const getMaxScore = (category: string) =>
    category.toLowerCase() === "pg" ? 45 : 40;

  // 🔹 Step 1: Check if logged-in user is SuperAdmin
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const username = Cookies.get("username");
        if (!username) {
          alert("Session expired. Please log in again.");
          navigate("/Home");
          return;
        }

        const judgeId = await fetchJudgeId(username);
        if (!judgeId) {
          alert("Judge not found. Redirecting...");
          navigate("/Home");
          return;
        }

        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/judges?id=eq.${judgeId}&select=account_type`,
          {
            headers: {
              apikey: SUPABASE_API_KEY,
              Authorization: `Bearer ${SUPABASE_API_KEY}`,
            },
          }
        );
        const data = await res.json();

        if (data.length === 0) {
          alert("Account not found. Redirecting...");
          navigate("/Home");
          return;
        }

        const accountType = data[0].account_type;
        if (accountType === "SuperAdmin") {
          setAuthorized(true);
        } else {
          alert("Only admin can view.");
          navigate("/Home");
        }
      } catch (error) {
        console.error("Error checking judge permission:", error);
        alert("Something went wrong. Redirecting...");
        navigate("/Home");
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [navigate]);

  // 🔹 Step 2: Fetch leaderboard data if authorized
  useEffect(() => {
    if (!authorized) return;

    const fetchScores = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/scores?select=participant_id,innovation_score,impact_score,feasibility_score,market_score,publication_score,others_score,participant:participant_id(id,name,project_title,institution,category)`,
          {
            headers: {
              apikey: SUPABASE_API_KEY,
              Authorization: `Bearer ${SUPABASE_API_KEY}`,
            },
          }
        );

        const data: Score[] = await res.json();

        // Group by participant and calculate totals
        const grouped = Object.values(
          data.reduce((acc: any, score: any) => {
            const category = score.participant.category?.toLowerCase() || "";

            if (!acc[score.participant_id]) {
              acc[score.participant_id] = {
                participant: score.participant,
                category,
                innovation: 0,
                impact: 0,
                feasibility: 0,
                market: 0,
                publication: 0,
                others: 0,
              };
            }

            acc[score.participant_id].innovation += score.innovation_score || 0;
            acc[score.participant_id].impact += score.impact_score || 0;
            acc[score.participant_id].feasibility += score.feasibility_score || 0;
            acc[score.participant_id].market += score.market_score || 0;

            if (category === "pg") {
              acc[score.participant_id].publication += score.publication_score || 0;
              acc[score.participant_id].others += score.others_score || 0;
            }

            return acc;
          }, {})
        ).map((entry: any) => {
          const category = entry.category;
          const total =
            category === "pg"
              ? entry.innovation +
                entry.impact +
                entry.feasibility +
                entry.market +
                entry.publication +
                entry.others
              : entry.innovation +
                entry.impact +
                entry.feasibility +
                entry.market;

          return {
            participant: entry.participant,
            totalInnovation: entry.innovation,
            totalImpact: entry.impact,
            totalFeasibility: entry.feasibility,
            totalMarket: entry.market,
            totalPublication: entry.publication,
            totalOthers: entry.others,
            totalScore: total,
          };
        });

        const byCategory: Record<string, LeaderboardEntry[]> = grouped.reduce(
          (acc, entry) => {
            const cat = entry.participant.category.toLowerCase();
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(entry);
            return acc;
          },
          {} as Record<string, LeaderboardEntry[]>
        );

        Object.keys(byCategory).forEach((cat) => {
          byCategory[cat].sort((a, b) => b.totalScore - a.totalScore);
        });

        setScores(byCategory);
      } catch (err) {
        console.error("Error fetching scores:", err);
      }
    };

    fetchScores();
  }, [authorized]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-300">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Checking access...
      </div>
    );
  }

  if (!authorized) return null;

  const catKey = selectedCategory.toLowerCase();
  const catScores = scores[catKey] || [];

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 md:px-6 py-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-amber-400 mt-10 mb-6 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-500" />
          Leaderboards
        </h1>

        {/* Category Dropdown */}
        <div className="mb-10">
          <label className="block text-gray-300 text-sm mb-2">
            Select Category:
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-gray-200 px-4 py-2 rounded-lg w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {catScores.length === 0 ? (
          <p className="text-gray-500 text-center">
            No scores available for {selectedCategory}.
          </p>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-blue-400 mb-20">
              {selectedCategory} Leaderboard
            </h2>

            {/* 🥇🥈🥉 Podium Tiers */}
            {["gold", "silver", "bronze"].map((tier, tIndex) => {
              const start = tIndex * 3;
              const end = start + 3;
              const tierScores = catScores.slice(start, end);
              if (tierScores.length === 0) return null;

              const colors =
                tier === "gold"
                  ? "from-yellow-500/30 to-yellow-400/20 border-yellow-500 text-yellow-400"
                  : tier === "silver"
                  ? "from-gray-400/20 to-gray-300/10 border-gray-400 text-gray-200"
                  : "from-amber-700/20 to-amber-600/10 border-amber-600 text-amber-500";

              const medalEmoji =
                tier === "gold" ? "🥇" : tier === "silver" ? "🥈" : "🥉";
              const tierTitle =
                tier === "gold"
                  ? "Gold Podium"
                  : tier === "silver"
                  ? "Silver Podium"
                  : "Bronze Podium";

              return (
                <div key={tier} className="mb-16">
                  <h3
                    className={`text-2xl font-bold mb-8 text-center ${
                      tier === "gold"
                        ? "text-yellow-400"
                        : tier === "silver"
                        ? "text-gray-300"
                        : "text-amber-500"
                    }`}
                  >
                    {tierTitle}
                  </h3>

                  <div className="flex flex-wrap justify-center gap-6">
                    {tierScores.map((item, index) => (
                      <motion.div
                        key={item.participant.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex-1 max-w-[220px] min-w-[180px] text-center rounded-xl p-5 bg-gradient-to-r ${colors} shadow-lg border`}
                      >
                        <p className="text-3xl mb-1">{medalEmoji}</p>
                        <div
                          className="overflow-y-auto max-h-[120px]"
                          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                        >
                          <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                          <h3 className="text-lg font-bold break-words">
                            {item.participant.name}
                          </h3>
                          <p className="text-sm text-amber-400 break-words">
                            {item.participant.project_title}
                          </p>
                        </div>
                        <p className="text-xl font-extrabold mt-3">
                          {item.totalScore.toFixed(1)} /{" "}
                          {getMaxScore(item.participant.category)}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* 🧾 Other Participants */}
            {catScores.length > 9 && (
              <div>
                <h3 className="text-2xl font-bold text-gray-400 mb-6 text-center">
                  Other Participants
                </h3>
                <div className="space-y-4">
                  {catScores.slice(9).map((item, index) => (
                    <motion.div
                      key={item.participant.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-5 rounded-xl bg-gray-900 border border-gray-700 shadow-lg flex items-center justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl font-bold text-gray-400 w-6">
                          {index + 10}.
                        </span>
                        <div>
                          <h3 className="text-lg font-bold text-white leading-tight">
                            {item.participant.name}
                          </h3>
                          <p className="text-sm text-amber-400 leading-tight">
                            {item.participant.project_title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.participant.institution}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-extrabold text-amber-400">
                          {item.totalScore.toFixed(1)} /{" "}
                          {getMaxScore(item.participant.category)}
                        </p>
                        <p className="text-xs text-gray-500">
                          (
                          {(
                            (item.totalScore /
                              getMaxScore(item.participant.category)) *
                            100
                          ).toFixed(1)}
                          %)
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
