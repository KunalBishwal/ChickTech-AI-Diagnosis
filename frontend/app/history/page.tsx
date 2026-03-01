"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock,
    ArrowLeft,
    CheckCircle,
    XCircle,
    Activity,
    Loader2,
    Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";
import dynamic from "next/dynamic";

const PrismaticBurst = dynamic(
    () => import("@/components/reactbits/prismatic-burst"),
    { ssr: false }
);

interface Prediction {
    id: string;
    disease: string;
    confidence: number;
    created_at: Date;
}

export default function HistoryPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);

    // Listen for auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
            if (!currentUser) {
                router.push("/login");
            }
        });
        return unsubscribe;
    }, [router]);

    // Fetch prediction history from Firestore
    useEffect(() => {
        if (!user) return;

        const fetchHistory = async () => {
            try {
                const q = query(
                    collection(db, "predictions"),
                    where("user_id", "==", user.uid),
                    orderBy("created_at", "desc")
                );
                const snapshot = await getDocs(q);
                const data: Prediction[] = snapshot.docs.map((doc) => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        disease: d.disease,
                        confidence: d.confidence,
                        created_at: d.created_at?.toDate?.() ?? new Date(),
                    };
                });
                setPredictions(data);
            } catch (err) {
                console.error("History fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <Navigation />
            <main className="min-h-screen relative pt-28 pb-16 px-4 sm:px-6">
                {/* PrismaticBurst Background */}
                <div className="fixed inset-0 z-0">
                    <PrismaticBurst
                        animationType="rotate3d"
                        intensity={1.5}
                        speed={0.3}
                        distort={0}
                        paused={false}
                        offset={{ x: 0, y: 0 }}
                        hoverDampness={0.25}
                        rayCount={0}
                        mixBlendMode="none"
                        colors={['#ff007a', '#4d3dff', '#ffffff']}
                    />
                </div>

                <div className="container mx-auto max-w-4xl relative z-10">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="text-center mb-12"
                    >
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                            <Clock className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                            Prediction{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                History
                            </span>
                        </h1>
                        <p className="text-gray-300 text-lg max-w-xl mx-auto drop-shadow-md">
                            Review all your past AI diagnoses in one place.
                        </p>
                    </motion.div>

                    {/* Back button */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mb-8"
                    >
                        <Button
                            variant="outline"
                            onClick={() => router.push("/")}
                            className="gap-2 border-2 border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-md text-white hover:bg-white/20 hover:scale-105 transition-all duration-300"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Home
                        </Button>
                    </motion.div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                            <p className="text-gray-300 text-lg">Loading your history...</p>
                        </div>
                    ) : predictions.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="text-center py-24"
                        >
                            <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Inbox className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">
                                No predictions yet
                            </h3>
                            <p className="text-gray-400 mb-6 max-w-md mx-auto">
                                Upload a chicken image in the AI Diagnosis section to get started. Your results will appear here.
                            </p>
                            <Button
                                onClick={() => router.push("/")}
                                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 shadow-xl hover:scale-105 transition-all duration-300"
                            >
                                🐔 Start Diagnosing
                            </Button>
                        </motion.div>
                    ) : (
                        <AnimatePresence>
                            <div className="grid gap-4">
                                {predictions.map((pred, index) => {
                                    const isHealthy = pred.disease.toLowerCase().includes("healthy");
                                    const confidencePercent = (pred.confidence * 100).toFixed(1);

                                    return (
                                        <motion.div
                                            key={pred.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                duration: 0.4,
                                                delay: index * 0.08,
                                                ease: "easeOut",
                                            }}
                                            className="p-6 bg-white/10 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 dark:border-gray-700/40 shadow-lg rounded-2xl hover:shadow-xl hover:bg-white/15 transition-all duration-300 group"
                                        >
                                            <div className="flex items-center justify-between flex-wrap gap-4">
                                                {/* Left: Status + Disease */}
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${isHealthy
                                                            ? "bg-gradient-to-br from-green-400 to-emerald-500"
                                                            : "bg-gradient-to-br from-red-400 to-orange-500"
                                                            }`}
                                                    >
                                                        {isHealthy ? (
                                                            <CheckCircle className="w-6 h-6 text-white" />
                                                        ) : (
                                                            <XCircle className="w-6 h-6 text-white" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4
                                                            className={`text-lg font-bold ${isHealthy ? "text-green-400" : "text-red-400"
                                                                }`}
                                                        >
                                                            {pred.disease}
                                                        </h4>
                                                        <p className="text-sm text-gray-400">
                                                            {formatDate(pred.created_at)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Right: Confidence */}
                                                <div className="flex items-center gap-3">
                                                    <Activity
                                                        className={`w-5 h-5 ${isHealthy ? "text-green-400" : "text-red-400"
                                                            }`}
                                                    />
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-400 font-medium">
                                                            Confidence
                                                        </p>
                                                        <p
                                                            className={`text-xl font-bold ${isHealthy ? "text-green-400" : "text-red-400"
                                                                }`}
                                                        >
                                                            {confidencePercent}%
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Confidence Bar */}
                                            <div className="mt-4 w-full bg-white/10 dark:bg-gray-700/40 rounded-full h-2 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${confidencePercent}%` }}
                                                    transition={{
                                                        duration: 0.8,
                                                        delay: index * 0.08 + 0.3,
                                                        ease: "easeOut",
                                                    }}
                                                    className={`h-2 rounded-full ${isHealthy
                                                        ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                                        : "bg-gradient-to-r from-red-400 to-orange-500"
                                                        }`}
                                                />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </AnimatePresence>
                    )}

                    {/* Summary footer */}
                    {predictions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="mt-10 text-center"
                        >
                            <p className="text-gray-400 text-sm">
                                Showing {predictions.length} prediction
                                {predictions.length !== 1 ? "s" : ""} •{" "}
                                <button
                                    onClick={() => router.push("/")}
                                    className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                                >
                                    Run a new diagnosis
                                </button>
                            </p>
                        </motion.div>
                    )}
                </div>
            </main>
        </>
    );
}
