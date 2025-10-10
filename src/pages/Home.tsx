import { Link } from "react-router-dom";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Trophy, TrendingUp } from "lucide-react";

// --- Type Definitions ---
type Partner = { src: string; alt: string };
type Testimonial = { quote: string; name: string; role: string };

// --- Data ---
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

// --- Helper Component ---
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-800 text-center transform hover:bg-gray-800 transition duration-300">
        <div className="mb-4 inline-flex p-3 rounded-full bg-gray-700/50">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
    </div>
);


// --- Main Component ---
export default function Home() {
    const year = new Date().getFullYear();

    const isMarquee = PARTNERS.length >= 5; // Fixed: replaces 'shouldAnimate'

    const marqueeList = useMemo(() => {
        return isMarquee ? [...PARTNERS, ...PARTNERS] : PARTNERS;
    }, [isMarquee]);


    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-950 to-black text-white font-sans overflow-x-hidden">
            
            {/* Hero Section */}
            <section className="relative min-h-screen px-4 md:px-6 max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center justify-center pt-24 pb-12 lg:pb-0 gap-16">
                
                {/* Background Gradients/Effects */}
                <div className="absolute inset-0 z-0 opacity-10">
                    {/* Subtle background grid pattern */}
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#2D3748" strokeWidth="0.5"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>


                <motion.div
                    initial={{ opacity: 0, x: -40 }} // Slide in from left
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-10 text-center lg:text-left max-w-xl"
                >
                    <span className="inline-block px-4 py-1 mb-4 text-xs font-semibold uppercase tracking-wider rounded-full bg-blue-600/30 text-blue-300 border border-blue-600/50">
                        Digital Exhibition Scoring
                    </span>
                    <h1 className="text-6xl md:text-7xl font-extrabold leading-tight mb-5">
                        <span className="text-yellow-400">Rankify</span>
                        <span className="text-white"> Your</span>
                        <span className="text-blue-400 block lg:inline"> Results</span>
                    </h1>
                    <p className="text-xl text-gray-400 mb-8 max-w-lg">
                        A modern platform to make exhibition evaluations **simple, fair, and instantly transparent** for judges and participants.
                    </p>

                    <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                        
                        {/* Primary CTA: Judge Login */}
                        <Link
                            to="/azp" 
                            className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-8 py-3 rounded-xl transition hover:bg-blue-700 shadow-xl shadow-blue-500/30 transform hover:scale-[1.02]"
                        >
                            Judge Login <ArrowRight className="w-5 h-5" />
                        </Link>

                        {/* Secondary CTA: View Scoreboard */}
                        
                    </div>
                </motion.div>

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="relative z-10 w-full max-w-lg lg:max-w-xl"
                >
                    {/* Enhanced Animated Blobs */}
                    <motion.div
                        animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7], rotate: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl z-0"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5], rotate: [0, -15, 0] }}
                        transition={{ repeat: Infinity, duration: 5 }}
                        className="absolute -bottom-12 -right-12 w-52 h-52 bg-yellow-400/20 rounded-full blur-3xl z-0"
                    />
                    <img
                        src="https://png.pngtree.com/png-vector/20220620/ourmid/pngtree-judging-committee-jury-vote-judge-png-image_5132633.png"
                        alt="Judging system illustration"
                        className="relative w-full rounded-3xl shadow-2xl shadow-blue-500/20"
                    />
                </motion.div>
            </section>

            <hr className="border-gray-800 my-10 max-w-7xl mx-auto" />

            {/* Features/Value Proposition Section */}
            <section className="py-20 px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="max-w-6xl mx-auto text-center"
                >
                    <h2 className="text-4xl font-extrabold mb-10 text-yellow-400">Why Choose Rankify?</h2>
                    
                    <div className="grid gap-10 md:grid-cols-3">
                        <FeatureCard 
                            icon={<Zap className="w-8 h-8 text-blue-400" />} 
                            title="Instant Scoring"
                            description="Judges scan IDs, submit scores instantly, and eliminate manual data entry errors."
                        />
                        <FeatureCard 
                            icon={<Trophy className="w-8 h-8 text-yellow-400" />} 
                            title="Fair & Transparent"
                            description="Standardized criteria and automated calculations ensure every project is evaluated fairly."
                        />
                        <FeatureCard 
                            icon={<TrendingUp className="w-8 h-8 text-pink-400" />} 
                            title="Real-time Results"
                            description="Scoreboards are updated live, providing immediate, valuable feedback to participants."
                        />
                    </div>

                </motion.div>
            </section>

            {/* Testimonials */}
            <section className="py-24 px-4 md:px-6 bg-gray-900 border-t border-b border-gray-800">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="max-w-5xl mx-auto text-center"
                >
                    <h2 className="text-4xl font-extrabold mb-12 text-pink-400">Trusted by Key Stakeholders</h2>
                    <div className="grid gap-8 md:grid-cols-3">
                        {TESTIMONIALS.map((t, i) => (
                            <motion.div
                                key={i}
                                className="bg-gray-800 p-8 rounded-2xl border-t-4 border-blue-600/50 shadow-2xl hover:shadow-blue-500/10 transition transform duration-500"
                                whileHover={{ y: -5 }} 
                            >
                                <p className="text-lg text-gray-300 italic mb-4">“{t.quote}”</p>
                                <div className="text-left mt-6 border-t border-gray-700 pt-4">
                                    <h4 className="font-bold text-yellow-400">{t.name}</h4>
                                    <p className="text-sm text-gray-400">{t.role}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Partners */}
            <section className="relative px-4 md:px-6 py-16">
                <h3 className="text-center uppercase text-blue-400 font-bold text-xl mb-10 tracking-widest">
                    Our Ecosystem Partners
                </h3>

                <div className="relative max-w-7xl mx-auto">
                    {/* Fade effects adjusted for the new background */}
                    <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-gray-950 to-transparent z-20" />
                    <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-gray-950 to-transparent z-20" />

                    <div className={`overflow-hidden rounded-xl border border-gray-800 bg-gray-900/40 ${isMarquee ? '' : 'flex justify-center'}`}>
                        <div
                            className={`flex items-center gap-16 py-8 px-8 ${
                                isMarquee ? "marquee" : "justify-center"
                            } hover:[animation-play-state:paused]`}
                        >
                            {marqueeList.map((p, idx) => (
                                <motion.img
                                    key={`${p.alt}-${idx}`}
                                    src={p.src}
                                    alt={p.alt}
                                    className="h-10 sm:h-12 object-contain grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition duration-500 flex-shrink-0"
                                    loading="lazy"
                                    whileHover={{ scale: 1.05 }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-800 py-6 text-center text-sm text-gray-600">
                Rankify © {year} — AZP GROUP
            </footer>

            {/* CSS for Marquee Animation */}
            {isMarquee && (
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