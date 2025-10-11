"use client";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDiagnosisHistory } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function LogicPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else {
      getDiagnosisHistory(user.uid).then(setHistory);
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen px-6 py-16 bg-gradient-to-b from-yellow-50 via-white to-orange-50 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 -z-10 opacity-40 bg-[radial-gradient(circle_at_20%_30%,rgba(255,204,128,0.3)_0%,transparent_70%),radial-gradient(circle_at_80%_70%,rgba(255,183,77,0.3)_0%,transparent_70%)]"></div>

      {/* Back to home */}
      <div className="absolute top-6 left-6">
        <Button
          variant="outline"
          className="flex items-center gap-2 border-2 border-yellow-400 text-yellow-700 hover:bg-yellow-50"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </div>

      <div className="max-w-5xl mx-auto text-center mb-12 mt-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-transparent bg-clip-text">
          Welcome, {user.displayName || user.email} 🐔
        </h1>
        <p className="text-gray-600 text-lg">
          Here’s your AI diagnosis history. Each record shows your latest health checks.
        </p>
      </div>

      {/* History Grid */}
      {history.length === 0 ? (
        <p className="text-gray-500 text-center text-lg">
          No diagnosis records yet.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-yellow-100 p-6 transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <h3
                className={`text-2xl font-bold ${
                  item.result.toLowerCase().includes("healthy")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {item.result}
              </h3>
              <p className="text-gray-600 mt-2">
                Confidence: {(item.confidence * 100).toFixed(2)}%
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {item.createdAt.toDate().toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center mt-16">
        <Button
          onClick={logout}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-3 rounded-xl shadow-lg hover:opacity-90"
        >
          Log out
        </Button>
      </div>
    </div>
  );
}
