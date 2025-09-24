import { Link } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";

type Partner = { src: string; alt: string };
type Testimonial = { quote: string; name: string; role: string };

const PARTNERS: Partner[] = [
  {
    src: "https://upload.wikimedia.org/wikipedia/en/3/31/International_Islamic_University_Malaysia_emblem.svg",
    alt: "IIUM",
  },
  {
    src: "https://azmiproductions.com/tempazp/img/azp.png",
    alt: "AZP",
  },
  {
    src: " https://cute.iium.edu.my/home/wp-content/uploads/2021/11/cutelogo5-2.png",
    alt: "CUTE IIUM",
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Study Jom helped me ace my finals with shared notes from seniors!",
    name: "Aina Khalid",
    role: "Kulliyyah of Engineering",
  },
  {
    quote: "Uploading my notes was super easy and rewarding!",
    name: "Hafiz Ramli",
    role: "AI Student, IIUM",
  },
  {
    quote: "A cozy and helpful platform for last-minute revision!",
    name: "Farah Nadhirah",
    role: "ICT, IIUM",
  },
];

const SUPABASE_URL = "https://pftyzswxwkheomnqzytu.supabase.co";
const SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHl6c3d4d2toZW9tbnF6eXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjczNzksImV4cCI6MjA2OTM0MzM3OX0.TI9DGipYP9X8dSZSUh5CVQIbeYnf9vhNXAqw5e5ZVkk";

export default function Home() {
  const year = new Date().getFullYear();
  const [userCount, setUserCount] = useState<number | null>(null);

  const marqueeList = useMemo(() => {
    return PARTNERS.length >= 5 ? [...PARTNERS, ...PARTNERS] : PARTNERS;
  }, []);

  const shouldAnimate = PARTNERS.length >= 5;

  useEffect(() => {
  const fetchUserCount = async () => {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/users?select=id`,
        {
          method: "GET",
          headers: {
            apikey: SUPABASE_API_KEY,
            Authorization: `Bearer ${SUPABASE_API_KEY}`,
            Prefer: "count=planned", // ✅ Correct header
          },
        }
      );

      const contentRange = res.headers.get("content-range");
      const count = contentRange?.split("/")[1];
      if (count) {
        setUserCount(parseInt(count));
      } else {
        console.error("Could not get user count");
      }
    };

    fetchUserCount();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white font-inter">
      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6 max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-14">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center lg:text-left max-w-xl"
        >
          <h1 className="text-5xl font-extrabold leading-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-500 animate-text">
            Study better, together.
          </h1>
          <p className="text-lg text-gray-300 mb-4">
            Upload your notes. Explore resources. Learn smarter with the Study Jom community.
          </p>
          <p className="text-pink-400 text-xl font-semibold mb-8">
            {userCount !== null ? `🎓 ${userCount}+ students joined!` : "Loading user count..."}
          </p>
          <div className="flex flex-wrap justify-center lg:justify-start gap-4">
            <Link
              to="/explore"
              className="border border-yellow-400 hover:bg-yellow-400 hover:text-black text-yellow-400 font-semibold px-6 py-3 rounded-xl transition"
            >
              Browse Notes
            </Link>
            
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="relative w-full max-w-lg"
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute -top-8 -left-8 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="absolute -bottom-10 -right-6 w-40 h-40 bg-yellow-400/10 rounded-full blur-3xl"
          />
          <img
            src="https://i.pinimg.com/originals/57/3c/da/573cdaf5205bebaac51ca29273dd5514.gif"
            alt="Study girl"
            className="relative w-full rounded-3xl"
          />
        </motion.div>
      </section>

      {/* About Us */}
      <section className="py-20 px-6 bg-black/40 border-t border-gray-800">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold mb-4 text-yellow-400">About Study Jom</h2>
          <p className="text-gray-300 text-lg mb-4">
            Study Jom is a cozy, student-powered platform to share notes, explore revision materials,
            and learn collaboratively. Whether you're preparing for finals or helping juniors,
            we're here to make studying less stressful and more fun.
          </p>
          
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-5xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold mb-10 text-pink-400">What Students Say</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:scale-105 transition transform duration-300 shadow-lg"
                whileHover={{ scale: 1.05 }}
              >
                <p className="text-yellow-300 italic mb-4">“{t.quote}”</p>
                <h4 className="font-semibold text-white">{t.name}</h4>
                <p className="text-sm text-gray-400">{t.role}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Partners */}
      <section className="relative px-6 py-16 mb-10">
        <h3 className="text-center uppercase text-yellow-400 font-bold text-xl mb-8">
          Our partners
        </h3>

        <div className="relative max-w-7xl mx-auto">
          <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-black to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-black to-transparent" />

          <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/40">
            <div
              className={`flex items-center gap-12 py-6 px-8 ${
                shouldAnimate ? "marquee" : "justify-center"
              } hover:[animation-play-state:paused]`}
            >
              {marqueeList.map((p, idx) => (
                <motion.img
                  key={`${p.alt}-${idx}`}
                  src={p.src}
                  alt={p.alt}
                  className="h-12 sm:h-14 object-contain opacity-80 hover:opacity-100 transition"
                  loading="lazy"
                  whileHover={{ scale: 1.1 }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 text-center text-sm text-gray-500">
        Made with ☕ & 💡 by Study Jom team — {year}
      </footer>

      {shouldAnimate && (
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee {
            width: max-content;
            animation: marquee 28s linear infinite;
          }
        `}</style>
      )}
    </div>
  );
}
