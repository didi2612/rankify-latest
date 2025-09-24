import { Link } from "react-router-dom";
import { useMemo} from "react";
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
    src: "https://cute.iium.edu.my/home/wp-content/uploads/2021/11/cutelogo5-2.png",
    alt: "CUTE IIUM",
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "The scoring system streamlined our judging process and made evaluations fairer.",
    name: "Dr. Aisha",
    role: "Chief Judge, KERICE 2025",
  },
  {
    quote: "Easy to use and transparent — it saved us hours of manual calculation!",
    name: "Prof. Hamdan",
    role: "Exhibition Committee",
  },
  {
    quote: "As a participant, I loved how the feedback was clear and structured.",
    name: "Nabilah",
    role: "Student Exhibitor",
  },
];

export default function Home() {
  const year = new Date().getFullYear();

  const marqueeList = useMemo(() => {
    return PARTNERS.length >= 5 ? [...PARTNERS, ...PARTNERS] : PARTNERS;
  }, []);

  const shouldAnimate = PARTNERS.length >= 5;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white font-inter">
      {/* Hero Section */}
      <section className="min-h-screen px-6 max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center justify-center gap-14">
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 1 }}
    className="text-center lg:text-left max-w-xl"
  >
    <h1 className="text-5xl font-extrabold leading-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-500 animate-text">
      Rankify
    </h1>
    <p className="text-lg text-gray-300 mb-4">
      A modern digital platform for managing exhibition evaluations simple,
      fair, and efficient.
    </p>
    <p className="text-pink-400 text-xl font-semibold mb-8">
      Trusted by judges and participants
    </p>
    <div className="flex flex-wrap justify-center lg:justify-start gap-4">
      <Link
        to="/judging"
        className="border border-yellow-400 hover:bg-yellow-400 hover:text-black text-yellow-400 font-semibold px-6 py-3 rounded-xl transition"
      >
        Start Judging
      </Link>
      <Link
        to="/explore"
        className="border border-pink-400 hover:bg-pink-400 hover:text-black text-pink-400 font-semibold px-6 py-3 rounded-xl transition"
      >
        View Results
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
      src="https://png.pngtree.com/png-vector/20220620/ourmid/pngtree-judging-committee-jury-vote-judge-png-image_5132633.png"
      alt="Judging system illustration"
      className="relative w-full rounded-3xl"
    />
  </motion.div>
</section>


      {/* About */}
      <section className="py-20 px-6 bg-black/40 border-t border-gray-800">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold mb-4 text-yellow-400">Why This System?</h2>
          <p className="text-gray-300 text-lg mb-4">
            The Exhibition Scoring System was built to simplify and digitize
            the evaluation of research, innovation, and projects. Judges can
            score participants seamlessly, results are auto-calculated, and
            participants get transparent feedback instantly.
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
          <h2 className="text-3xl font-bold mb-10 text-pink-400">What People Say</h2>
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
          Our Partners
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
        Exhibition Scoring System © {year} — Built with ☕ & 💡
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
