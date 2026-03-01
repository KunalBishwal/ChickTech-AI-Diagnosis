"use client";

import { auth, googleProvider } from "@/lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async () => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back 🐥");
      router.push("/");
    } catch (err: any) {
      toast.error("Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      toast.success("Welcome back 🐔");
      router.push("/");
    } catch (err: any) {
      toast.error("Google sign-in failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 relative overflow-hidden">
      {/* Subtle floating glow */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-yellow-200 via-orange-300 to-pink-300 rounded-full blur-[160px] opacity-40 animate-pulse" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-gradient-to-tr from-orange-200 via-yellow-100 to-pink-200 rounded-full blur-[120px] opacity-40 animate-pulse" />

      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-10 rounded-[2rem] shadow-[0_0_50px_rgba(255,165,0,0.2)] dark:shadow-[0_0_50px_rgba(255,165,0,0.1)] w-full max-w-md text-center border border-white/40 dark:border-gray-700/40 transition-all hover:scale-[1.01] duration-300">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-transparent bg-clip-text">
          Welcome Back
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Sign in to access <span className="font-semibold text-orange-500">ChickTech AI Tools</span>
        </p>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400"
          />

          <Button
            onClick={handleEmailLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl shadow-md hover:opacity-90 transition-all duration-300 flex justify-center items-center gap-2"
          >
            {loading && <Loader2 className="animate-spin w-5 h-5" />}
            {!loading && "Sign in with Email"}
          </Button>

          <div className="my-4 text-gray-400 dark:text-gray-500 text-sm flex items-center justify-center gap-2">
            <div className="w-10 h-[1px] bg-gray-200 dark:bg-gray-600"></div>
            or
            <div className="w-10 h-[1px] bg-gray-200 dark:bg-gray-600"></div>
          </div>

          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 shadow-sm flex items-center justify-center gap-3 transition-all"
          >
            <img
              src="/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
          </Button>
        </div>

        <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          By continuing, you agree to our{" "}
          <span className="text-orange-500 font-medium cursor-pointer hover:underline">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
