import { useEffect, useState } from "react";
import { Trophy, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const SUPABASE_URL = "https://pftyzswxwkheomnqzytu.supabase.co";
const SUPABASE_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHl6c3d4d2toZW9tbnF6eXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjczNzksImV4cCI6MjA2OTM0MzM3OX0.TI9DGipYP9X8dSZSUh5CVQIbeYnf9vhNXAqw5e5ZVkk"; // ⚠️ Use env var in production

interface Score {
  participant_id: string;
  innovation_score: number;
  impact_score: number;
  feasibility_score: number;
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
  totalScore: number;
}

export default function ScoreboardPage() {
  const [scores, setScores] = useState<Record<string, LeaderboardEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("FYP");

  const categories = ["FYP", "IDP", "Community Services", "PG"];

  useEffect(() => {
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

          // Conditional total based on category
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
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, []);

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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-400">Loading scores...</span>
          </div>
        ) : catScores.length === 0 ? (
          <p className="text-gray-500 text-center">
            No scores available for {selectedCategory}.
          </p>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-blue-400 mb-20">
              {selectedCategory} Leaderboard
            </h2>

            {/* Podium layout for top 3 */}
            {catScores.length >= 3 && (
              <div className="flex items-end justify-center gap-6 mb-10">
                {/* 🥈 2nd Place */}
                <div className="flex-1 max-w-[200px] text-center">
                  <div className="h-[260px] flex flex-col justify-end p-4 rounded-xl bg-gradient-to-r from-gray-400/20 to-gray-300/10 border border-gray-400 shadow-lg overflow-hidden">
                    <p className="text-3xl mb-1">🥈</p>
                    <div
                      className="overflow-y-auto max-h-[140px]"
                      style={{
                        scrollbarWidth: "none", // Firefox
                        msOverflowStyle: "none", // IE/Edge
                      }}
                    >
                      <style>
                        {`
                          div::-webkit-scrollbar {
                            display: none;
                          }
                        `}
                      </style>
                      <h3 className="text-lg font-bold text-gray-200 break-words">
                        {catScores[1].participant.name}
                      </h3>
                      <p className="text-sm text-amber-400 break-words">
                        {catScores[1].participant.project_title}
                      </p>
                    </div>
                    <p className="text-xl font-extrabold text-gray-300 mt-2">
                      {catScores[1].totalScore.toFixed(1)}
                    </p>
                  </div>
                </div>

                {/* 👑 1st Place */}
                <div className="flex-1 max-w-[220px] text-center">
                  <div className="h-[300px] flex flex-col justify-end p-6 rounded-xl bg-gradient-to-r from-yellow-500/30 to-yellow-400/20 border border-yellow-500 shadow-2xl overflow-hidden">
                    <p className="text-4xl mb-1">👑</p>
                    <div
                      className="overflow-y-auto max-h-[160px]"
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                    >
                      <style>
                        {`
                          div::-webkit-scrollbar {
                            display: none;
                          }
                        `}
                      </style>
                      <h3 className="text-xl font-bold text-yellow-400 break-words">
                        {catScores[0].participant.name}
                      </h3>
                      <p className="text-sm text-amber-400 break-words">
                        {catScores[0].participant.project_title}
                      </p>
                    </div>
                    <p className="text-2xl font-extrabold text-yellow-300 mt-2">
                      {catScores[0].totalScore.toFixed(1)}
                    </p>
                  </div>
                </div>

                {/* 🥉 3rd Place */}
                <div className="flex-1 max-w-[200px] text-center">
                  <div className="h-[220px] flex flex-col justify-end p-4 rounded-xl bg-gradient-to-r from-amber-700/20 to-amber-600/10 border border-amber-600 shadow-lg overflow-hidden">
                    <p className="text-3xl mb-1">🥉</p>
                    <div
                      className="overflow-y-auto max-h-[120px]"
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                    >
                      <style>
                        {`
                          div::-webkit-scrollbar {
                            display: none;
                          }
                        `}
                      </style>
                      <h3 className="text-lg font-bold text-amber-600 break-words">
                        {catScores[2].participant.name}
                      </h3>
                      <p className="text-sm text-amber-400 break-words">
                        {catScores[2].participant.project_title}
                      </p>
                    </div>
                    <p className="text-xl font-extrabold text-amber-500 mt-2">
                      {catScores[2].totalScore.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Rest of the leaderboard */}
            <div className="space-y-4">
              {catScores.slice(3).map((item, index) => (
                <motion.div
                  key={item.participant.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 rounded-xl bg-gray-900 border border-gray-700 shadow-lg flex items-center justify-between"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl font-bold text-gray-400 w-6">
                      {index + 4}.
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
                      {item.totalScore.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Innovation: {item.totalInnovation.toFixed(1)} | Impact:{" "}
                      {item.totalImpact.toFixed(1)} | Feasibility:{" "}
                      {item.totalFeasibility.toFixed(1)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


