// src/app/not-found.tsx
// World-class 404 page with premium animations

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Home,
  Search,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  MapPin,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl animate-pulse-slow" />

        {/* Floating icons */}
        {mounted && (
          <>
            <ShoppingBag className="absolute top-1/4 left-1/4 w-8 h-8 text-primary/20 animate-float-slow" />
            <Star className="absolute top-1/3 right-1/3 w-6 h-6 text-accent/20 animate-float-delayed" />
            <Sparkles className="absolute bottom-1/3 left-1/3 w-7 h-7 text-primary/20 animate-float" />
            <MapPin className="absolute bottom-1/4 right-1/4 w-6 h-6 text-accent/20 animate-float-slow" />
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* 404 Number with Premium Animation */}
        <div className="relative mb-8">
          <h1
            className={`text-[180px] md:text-[240px] font-black leading-none bg-gradient-to-br from-primary via-primary/80 to-accent bg-clip-text text-transparent select-none transition-all duration-1000 ${
              mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            style={{
              textShadow: '0 0 80px rgba(var(--primary), 0.3)',
            }}
          >
            404
          </h1>

          {/* Animated decoration */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 delay-200 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-3xl rounded-full animate-pulse-slow" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className={`space-y-3 mb-8 transition-all duration-700 delay-300 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Oops! You've wandered off the map
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            The page you're looking for seems to have taken a shopping break.
            Let's help you find your way back!
          </p>
        </div>

        {/* Search Box */}
        <div className={`mb-10 transition-all duration-700 delay-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="relative max-w-md mx-auto group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              type="text"
              placeholder="Search for stores, events, or promotions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 h-14 text-base bg-background/80 backdrop-blur border-2 transition-all duration-300 focus:border-primary focus:ring-4 focus:ring-primary/20 focus:bg-background"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-700 delay-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <Link href="/">
            <Button
              size="lg"
              className="group relative overflow-hidden min-w-[200px] h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center gap-2">
                <Home className="w-5 h-5" />
                Back to Home
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </div>
            </Button>
          </Link>

          <Link href="/tenants">
            <Button
              size="lg"
              variant="outline"
              className="group min-w-[200px] h-14 text-base font-semibold border-2 hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12" />
                Explore Tenants Directory Admin
              </div>
            </Button>
          </Link>
        </div>

        {/* Help Text */}
        <div className={`mt-12 transition-all duration-700 delay-900 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}>
          <p className="text-sm text-muted-foreground">
            Lost? Contact Elang Alfarez for support assistance.
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full" />
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-30px) translateX(-15px);
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(5deg);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 10s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
