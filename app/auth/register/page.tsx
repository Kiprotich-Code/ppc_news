// app/auth/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import { Suspense } from "react";

// Separate component for content that uses useSearchParams
function RegisterContent() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    withdrawalAccount: string;
  }>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    withdrawalAccount: "",
  });
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Form validation
  const validateForm = (): boolean => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword || !formData.name) {
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      return false;
    }
    if (formData.password.length < 6) {
      return false;
    }
    return true;
  };

  // Final submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill all required fields and ensure passwords match.");
      return;
    }
    setIsLoading(true);
    try {
      // Prepare payload
      const payload = {
        ...formData,
        ref: searchParams.get("ref") || undefined,
      };
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Account created successfully! Please sign in.");
        router.push("/auth/signin");
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-xl">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in-up">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-600 to-red-800 rounded-2xl animate-bounce-subtle">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-red-800 to-red-900 bg-clip-text text-transparent animate-gradient">
              Create Account
            </h2>
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/signin"
                className="font-semibold text-red-600 hover:text-red-500 transition-colors duration-300 hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>

          <form className="space-y-6 mt-8" onSubmit={handleSubmit}>
            {/* Login Info */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>

              {/* Username */}
              <div className="group animate-slide-in-up">
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div
                    className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${focusedField === "username" ? "text-red-600" : "text-gray-400"
                      }`}
                  >
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => setFocusedField(null)}
                    className="block w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 hover:border-gray-300"
                    placeholder="Choose a username"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="group animate-slide-in-up">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div
                    className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${focusedField === "email" ? "text-red-600" : "text-gray-400"
                      }`}
                  >
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    className="block w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 hover:border-gray-300"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div className="group animate-slide-in-up">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div
                    className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${focusedField === "name" ? "text-red-600" : "text-gray-400"
                      }`}
                  >
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    className="block w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 hover:border-gray-300"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="group animate-slide-in-up">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div
                    className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${focusedField === "password" ? "text-red-600" : "text-gray-400"
                      }`}
                  >
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    className="block w-full pl-12 pr-12 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 hover:border-gray-300"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-red-600 transition-colors duration-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="group animate-slide-in-up">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div
                    className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${focusedField === "confirmPassword" ? "text-red-600" : "text-gray-400"
                      }`}
                  >
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField(null)}
                    className="block w-full pl-12 pr-12 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 hover:border-gray-300"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-red-600 transition-colors duration-300"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Information</h3>

              {/* Minipay Account */}
              <div className="group animate-slide-in-up">
                <label htmlFor="withdrawalAccount" className="block text-sm font-semibold text-gray-700 mb-2">
                  M-pesa No
                </label>
                <div className="relative">
                  <div
                    className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${focusedField === "withdrawalAccount" ? "text-red-600" : "text-gray-400"
                      }`}
                  >
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <input
                    id="withdrawalAccount"
                    name="withdrawalAccount"
                    type="text"
                    value={formData.withdrawalAccount}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("withdrawalAccount")}
                    onBlur={() => setFocusedField(null)}
                    className="block w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 hover:border-gray-300"
                    placeholder="Enter your Minipay account"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create Account <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}