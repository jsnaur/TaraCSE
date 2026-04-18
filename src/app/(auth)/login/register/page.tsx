"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, UserPlus, Mail, Lock, User, CheckCircle2 } from "lucide-react";

function PasswordStrengthBar({ password }: { password: string }) {
  const getStrength = (pw: string) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = getStrength(password);
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = [
    "",
    "bg-red-500",
    "bg-amber-500",
    "bg-yellow-400",
    "bg-emerald-500",
  ];

  if (!password) return null;

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < strength ? colors[strength] : "bg-border"
            }`}
          />
        ))}
      </div>
      {strength > 0 && (
        <p
          className={`text-xs font-medium transition-all ${
            strength === 4
              ? "text-emerald-500"
              : strength >= 2
              ? "text-amber-500"
              : "text-red-500"
          }`}
        >
          {labels[strength]} password
        </p>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1.5">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Start your CSE Journey
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Create an account to track your progress and simulate real exams.
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl shadow-black/20 space-y-5">
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {/* Full Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="fullname"
              className="block text-sm font-medium text-foreground"
            >
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="fullname"
                type="text"
                autoComplete="name"
                placeholder="Juan dela Cruz"
                className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-200"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-200"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-input bg-background pl-10 pr-11 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <PasswordStrengthBar password={password} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirm"
              className="block text-sm font-medium text-foreground"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`w-full rounded-xl border bg-background pl-10 pr-11 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200 ${
                  passwordsMismatch
                    ? "border-red-500 focus:border-red-500"
                    : passwordsMatch
                    ? "border-emerald-500 focus:border-emerald-500"
                    : "border-input focus:border-primary"
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {passwordsMatch && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            {passwordsMismatch && (
              <p className="text-xs text-red-500 font-medium">
                Passwords do not match.
              </p>
            )}
          </div>

          {/* Terms notice */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            By creating an account, you agree to our{" "}
            <Link
              href="/terms"
              className="text-primary hover:text-primary/80 underline-offset-2 hover:underline transition-colors"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-primary hover:text-primary/80 underline-offset-2 hover:underline transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p>

          {/* Submit */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm py-2.5 px-4 shadow-lg shadow-primary/25 hover:shadow-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200 active:scale-[0.98] mt-2"
          >
            <UserPlus className="w-4 h-4" />
            Create Account
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-primary font-semibold hover:text-primary/80 transition-colors underline-offset-2 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}