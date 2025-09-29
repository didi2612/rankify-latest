import { useEffect, useState } from "react";
import { Trophy, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const SUPABASE_URL = "https://pftyzswxwkheomnqzytu.supabase.co";
const SUPABASE_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHl6c3d4d2toZW9tbnF6eXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjczNzksImV4cCI6MjA2OTM0MzM3OX0.TI9DGipYP9X8dSZSUh5CVQIbeYnf9vhNXAqw5e5ZVkk"; //⚠️ Use env var in production

interface Score {
  participant_id: string;
  innovation_score: number;
  impact_score: number;
  feasibility_score: number;
  comments?: string;
  participant: {
    id: string;
    name: string;
    project_title: string;
    institution: string;
    category: string;
  };
}

interface LeaderboardEntry {
  participant: {
    id: string;
    name: string;
    project_title: string;
    institution: string;
    category: string;
  };
  avgInnovation: number;
  avgImpact: number;
  avgFeasibility: number;
  avgTotal: number;
}

export default function ScoreboardPage() {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/scores?select=participant_id,innovation_score,impact_score,feasibility_score,comments,participant:participant_id(id,name,project_title,institution,category)`,
          {
            headers: {
              apikey: SUPABASE_API_KEY,
              Authorization: `Bearer ${SUPABASE_API_KEY}`,
            },
          }
        );

        const data: Score[] = await res.json();

        // Group by participant id
        const grouped = Object.values(
          data.reduce((acc: any, score: Score) => {
            if (!acc[score.participant_id]) {
              acc[score.participant_id] = {
                participant: score.participant,
                innovation: 0,
                impact: 0,
                feasibility: 0,
                totalScores: 0,
              };
            }
            acc[score.participant_id].innovation += score.innovation_score;
            acc[score.participant_id].impact += score.impact_score;
            acc[score.participant_id].feasibility += score.feasibility_score;
            acc[score.participant_id].totalScores += 1;
            return acc;
          }, {})
        ).map((entry: any) => ({
          participant: entry.participant,
          avgInnovation: entry.innovation / entry.totalScores,
          avgImpact: entry.impact / entry.totalScores,
          avgFeasibility: entry.feasibility / entry.totalScores,
          avgTotal:
            (entry.innovation + entry.impact + entry.feasibility) /
            (entry.totalScores * 3),
        }));

        // Sort by highest avgTotal
        grouped.sort((a, b) => b.avgTotal - a.avgTotal);

        setScores(grouped);
      } catch (err) {
        console.error("Error fetching scores:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 md:px-6 py-10 font-sans">
      <div className="max-w-3xl mx-auto mt-10">
        <h1 className="text-3xl font-extrabold text-amber-400 mb-20 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-500" />
          Leaderboard
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-400">Loading scores...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Podium layout for top 3 */}
            {scores.length >= 3 && (
              <div className="flex items-end justify-center gap-6 mb-10">
                {/* 2nd Place */}
                <div className="flex-1 max-w-[200px] text-center">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-gray-400/20 to-gray-300/10 border border-gray-400 shadow-lg">
                    <p className="text-3xl">🥈</p>
                    <h2 className="text-lg font-bold text-gray-200">
                      {scores[1].participant.name}
                    </h2>
                    <p className="text-sm text-amber-400">
                      {scores[1].participant.project_title}
                    </p>
                    <p className="text-xl font-extrabold text-gray-300 mt-2">
                      {Math.round(scores[1].avgTotal)}/10
                    </p>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="flex-1 max-w-[220px] text-center -mt-10">
                  <div className="p-6 rounded-xl bg-gradient-to-r from-yellow-500/30 to-yellow-400/20 border border-yellow-500 shadow-2xl">
                    <p className="text-4xl">👑</p>
                    <h2 className="text-xl font-bold text-yellow-400">
                      {scores[0].participant.name}
                    </h2>
                    <p className="text-sm text-amber-400">
                      {scores[0].participant.project_title}
                    </p>
                    <p className="text-2xl font-extrabold text-yellow-300 mt-2">
                      {Math.round(scores[0].avgTotal)}/10
                    </p>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="flex-1 max-w-[200px] text-center">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-700/20 to-amber-600/10 border border-amber-600 shadow-lg">
                    <p className="text-3xl">🥉</p>
                    <h2 className="text-lg font-bold text-amber-600">
                      {scores[2].participant.name}
                    </h2>
                    <p className="text-sm text-amber-400">
                      {scores[2].participant.project_title}
                    </p>
                    <p className="text-xl font-extrabold text-amber-500 mt-2">
                      {Math.round(scores[2].avgTotal)}/10
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Rest of the leaderboard */}
            <div className="space-y-4">
              {scores.slice(3).map((item, index) => (
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
                      <h2 className="text-lg font-bold text-white leading-tight">
                        {item.participant.name}
                      </h2>
                      <p className="text-sm text-amber-400 leading-tight">
                        {item.participant.project_title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.participant.institution} •{" "}
                        <span className="text-blue-400 font-semibold">
                          {item.participant.category}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-amber-400">
                      {Math.round(item.avgTotal)}/10
                    </p>
                    <p className="text-xs text-gray-500">
                      Innovation: {Math.round(item.avgInnovation)} | Impact:{" "}
                      {Math.round(item.avgImpact)} | Feasibility:{" "}
                      {Math.round(item.avgFeasibility)}
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

