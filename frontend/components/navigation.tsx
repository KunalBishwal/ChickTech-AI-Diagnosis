"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User as UserIcon, LayoutDashboard } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Navigation() {
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

    // Entrance animation
    if (navRef.current) {
      gsap.fromTo(
        navRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, delay: 0.3, ease: "back.out(1.7)" }
      );
    }

    // Floating logo animation
    if (logoRef.current) {
      gsap.to(logoRef.current, {
        y: -3,
        duration: 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    }

    // Scroll detection
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);

    // Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      unsubscribe();
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${isScrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg"
          : "bg-transparent backdrop-blur-0 border-transparent shadow-none"
        }`}
    >
      <div className="container mx-auto px-6 py-4 relative">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => scrollToSection("hero")}
          >
            <div
              ref={logoRef}
              className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20"
            >
              <span className="text-white font-bold text-lg filter drop-shadow-sm">
                🐔
              </span>
            </div>
            <span
              className={`font-bold text-2xl transition-colors duration-300 ${isScrolled ? "text-gray-900" : "text-white"
                }`}
            >
              ChickTech
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Our Story", id: "story" },
              { label: "AI Diagnosis", id: "diagnosis" },
              { label: "Features", id: "features" },
            ].map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`font-medium transition-all duration-300 hover:scale-105 ${isScrolled
                    ? "text-gray-600 hover:text-gray-900"
                    : "text-white/80 hover:text-white"
                  }`}
              >
                {label}
              </button>
            ))}

            {/* Auth Buttons */}
            {!user ? (
              <Button
                onClick={() => router.push("/login")}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold px-6 py-2 shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Login
              </Button>
            ) : (
              <div className="relative">
                
                {/* Avatar */}
                <button
                  onClick={toggleDropdown}
                  className="flex items-center focus:outline-none"
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-yellow-400 shadow-md hover:scale-105 transition-transform avatar-glow">
                    <Image
                      src={user.photoURL || "/default-avatar.jpg"}
                      alt="User profile"
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
                    <div className="px-5 py-4 border-b border-gray-200">
                      <p className="font-semibold text-gray-800">
                        {user.displayName || "User"}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        router.push("/logic");
                        setDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-5 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </button>

                    <button
                      onClick={() => {
                        handleLogout();
                        setDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-5 py-3 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${isScrolled ? "text-gray-900" : "text-white"
              }`}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200/20">
            <div className="flex flex-col gap-4 pt-4">
              {[
                { label: "Our Story", id: "story" },
                { label: "AI Diagnosis", id: "diagnosis" },
                { label: "Features", id: "features" },
              ].map(({ label, id }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`text-left font-medium transition-colors ${isScrolled
                      ? "text-gray-600 hover:text-gray-900"
                      : "text-white/80 hover:text-white"
                    }`}
                >
                  {label}
                </button>
              ))}

              {!user ? (
                <Button
                  onClick={() => router.push("/login")}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold mt-2"
                >
                  Login
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => router.push("/logic")}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold mt-2"
                  >
                    Dashboard
                  </Button>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="border border-gray-400 text-gray-800 hover:bg-gray-100 font-semibold mt-2"
                  >
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
