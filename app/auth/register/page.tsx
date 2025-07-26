"use client"

import { useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Sparkles, Image as ImageIcon, MapPin, Tag, CreditCard, IdCard, FileText, Home, Shield, Zap } from "lucide-react"
import toast from "react-hot-toast"

export default function RegisterPage() {
  // Stepper state
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    // Step 1
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    // Step 2
    name: "",
    bio: "",
    location: "",
    tags: [] as string[],
    profileImage: "",
    // Step 3
    idType: "",
    idNumber: "",
    phone: "",
    kraPin: "",
    address: "",
    // Step 4
    withdrawalAccount: ""
  })
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [tagInput, setTagInput] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Handle tag add/remove
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] })
      setTagInput("")
    }
  }
  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })
  }

  // Handle image upload (simulate upload, store as base64 for now)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, profileImage: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  // Step validation
  const validateStep = () => {
    if (step === 1) {
      if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) return false
      if (formData.password !== formData.confirmPassword) return false
      if (formData.password.length < 6) return false
      return true
    }
    if (step === 2) {
      if (!formData.name) return false
      return true
    }
    if (step === 3) {
      if (!formData.idType || !formData.idNumber || !formData.phone) return false
      return true
    }
    if (step === 4) {
      if (!formData.withdrawalAccount) return false
      return true
    }
    return false
  }

  // Final submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep()) {
      toast.error("Please fill all required fields.")
      return
    }
    setIsLoading(true)
    try {
      // Prepare payload
      const payload = {
        ...formData,
        tags: JSON.stringify(formData.tags),
        ref: searchParams.get("ref") || undefined
      }
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const data = await response.json()
      if (response.ok) {
        toast.success("Account created successfully! Please sign in.")
        router.push("/auth/signin")
      } else {
        toast.error(data.error || "Registration failed")
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

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
          {/* Stepper */}
          <div className="flex justify-between items-center my-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${step >= s ? 'bg-red-600' : 'bg-gray-300'}`}>{s}</div>
                <div className={`text-xs mt-2 ${step === s ? 'text-red-700 font-semibold' : 'text-gray-400'}`}>{
                  s === 1 ? 'Account' : s === 2 ? 'Personal' : s === 3 ? 'Contact' : 'Payment'
                }</div>
              </div>
            ))}
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Step 1: Account Info */}
            {step === 1 && (
              <div className="space-y-5">
                {/* Username */}
                <div className="group animate-slide-in-up">
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${focusedField === 'username' ? 'text-red-600' : 'text-gray-400'}`}><User className="h-5 w-5" /></div>
                    <input id="username" name="username" type="text" autoComplete="username" required value={formData.username} onChange={handleChange} onFocus={() => setFocusedField('username')} onBlur={() => setFocusedField(null)} className="block w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 hover:border-gray-300" placeholder="Choose a username" />
                  </div>
                </div>
                {/* Email */}
                <div className="group animate-slide-in-up">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${focusedField === 'email' ? 'text-red-600' : 'text-gray-400'}`}><Mail className="h-5 w-5" /></div>
                    <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} className="block w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 hover:border-gray-300" placeholder="Enter your email" />
                  </div>
                </div>
                {/* Password */}
                <div className="group animate-slide-in-up">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${focusedField === 'password' ? 'text-red-600' : 'text-gray-400'}`}><Lock className="h-5 w-5" /></div>
                    <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required value={formData.password} onChange={handleChange} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} className="block w-full pl-12 pr-12 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 hover:border-gray-300" placeholder="Enter your password" />
                    <button type="button" className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-red-600 transition-colors duration-300" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}</button>
                  </div>
                </div>
                {/* Confirm Password */}
                <div className="group animate-slide-in-up">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${focusedField === 'confirmPassword' ? 'text-red-600' : 'text-gray-400'}`}><Lock className="h-5 w-5" /></div>
                    <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" required value={formData.confirmPassword} onChange={handleChange} onFocus={() => setFocusedField('confirmPassword')} onBlur={() => setFocusedField(null)} className="block w-full pl-12 pr-12 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 hover:border-gray-300" placeholder="Confirm your password" />
                    <button type="button" className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-red-600 transition-colors duration-300" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}</button>
                  </div>
                </div>
              </div>
            )}
            {/* Step 2: Personal Info */}
            {step === 2 && (
              <div className="space-y-5">
                {/* Full Name */}
                <div className="group animate-slide-in-up">
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${focusedField === 'name' ? 'text-red-600' : 'text-gray-400'}`}><User className="h-5 w-5" /></div>
                    <input id="name" name="name" type="text" autoComplete="name" required value={formData.name} onChange={handleChange} onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)} className="block w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 hover:border-gray-300" placeholder="Enter your full name" />
                  </div>
                </div>
                {/* Bio */}
                <div className="group animate-slide-in-up">
                  <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                  <textarea id="bio" name="bio" rows={2} value={formData.bio} onChange={handleChange} onFocus={() => setFocusedField('bio')} onBlur={() => setFocusedField(null)} className="block w-full pl-4 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 hover:border-gray-300" placeholder="Tell us about yourself" />
                </div>
                {/* Location */}
                <div className="group animate-slide-in-up">
                  <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${focusedField === 'location' ? 'text-red-600' : 'text-gray-400'}`}><MapPin className="h-5 w-5" /></div>
                    <input id="location" name="location" type="text" value={formData.location} onChange={handleChange} onFocus={() => setFocusedField('location')} onBlur={() => setFocusedField(null)} className="block w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 hover:border-gray-300" placeholder="Your location" />
                  </div>
                </div>
                {/* Tags/Categories (multi-select) */}
                <div className="group animate-slide-in-up">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tags / Categories</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag) => (
                      <span key={tag} className="bg-red-100 text-red-700 px-3 py-1 rounded-full flex items-center text-xs">
                        <Tag className="w-3 h-3 mr-1" />{tag}
                        <button type="button" className="ml-1 text-gray-400 hover:text-red-500" onClick={() => handleRemoveTag(tag)}>&times;</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} className="flex-1 pl-4 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500" placeholder="Add a tag/category" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }} />
                    <button type="button" className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700" onClick={handleAddTag}>Add</button>
                  </div>
                </div>
                {/* Profile Picture (image upload) */}
                <div className="group animate-slide-in-up">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Picture</label>
                  <div className="flex items-center gap-4">
                    {formData.profileImage && <img src={formData.profileImage} alt="Profile Preview" className="w-16 h-16 rounded-full object-cover border-2 border-red-200" />}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    <button type="button" className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 flex items-center gap-2" onClick={() => fileInputRef.current?.click()}><ImageIcon className="w-4 h-4" />Upload</button>
                  </div>
                </div>
              </div>
            )}
            {/* Step 3: Contact Info */}
            {step === 3 && (
              <div className="space-y-5">
                {/* ID Type */}
                <div className="group animate-slide-in-up">
                  <label htmlFor="idType" className="block text-sm font-semibold text-gray-700 mb-2">ID Type</label>
                  <select id="idType" name="idType" value={formData.idType} onChange={handleChange} className="block w-full pl-4 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 hover:border-gray-300">
                    <option value="">Select ID Type</option>
                    <option value="National ID">National ID</option>
                    <option value="Passport">Passport</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {/* ID Number */}
                <div className="group animate-slide-in-up">
                  <label htmlFor="idNumber" className="block text-sm font-semibold text-gray-700 mb-2">ID Number</label>
                  <input id="idNumber" name="idNumber" type="text" value={formData.idNumber} onChange={handleChange} className="block w-full pl-4 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 hover:border-gray-300" placeholder="Enter your ID number" />
                </div>
                {/* Phone Number */}
                <div className="group animate-slide-in-up">
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input id="phone" name="phone" type="tel" autoComplete="tel" value={formData.phone} onChange={handleChange} className="block w-full pl-4 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 hover:border-gray-300" placeholder="Enter your phone number" />
                </div>
                {/* KRA PIN (optional) */}
                <div className="group animate-slide-in-up">
                  <label htmlFor="kraPin" className="block text-sm font-semibold text-gray-700 mb-2">KRA PIN <span className="text-gray-400">(Optional)</span></label>
                  <input id="kraPin" name="kraPin" type="text" value={formData.kraPin} onChange={handleChange} className="block w-full pl-4 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 hover:border-gray-300" placeholder="Enter your KRA PIN" />
                </div>
                {/* Address */}
                <div className="group animate-slide-in-up">
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <input id="address" name="address" type="text" value={formData.address} onChange={handleChange} className="block w-full pl-4 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 hover:border-gray-300" placeholder="Enter your address" />
                </div>
              </div>
            )}
            {/* Step 4: Payment Info */}
            {step === 4 && (
              <div className="space-y-5">
                {/* Minipay Account */}
                <div className="group animate-slide-in-up">
                  <label htmlFor="withdrawalAccount" className="block text-sm font-semibold text-gray-700 mb-2">Minipay Account</label>
                  <input id="withdrawalAccount" name="withdrawalAccount" type="text" value={formData.withdrawalAccount} onChange={handleChange} className="block w-full pl-4 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 hover:border-gray-300" placeholder="Enter your Minipay account" />
                </div>
              </div>
            )}
            {/* Stepper Navigation */}
            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button type="button" className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300" onClick={() => setStep(step - 1)} disabled={isLoading}>Back</button>
              )}
              {step < 4 && (
                <button type="button" className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 ml-auto" onClick={() => { if (validateStep()) setStep(step + 1); else toast.error('Please fill all required fields.') }} disabled={isLoading}>Next</button>
              )}
              {step === 4 && (
                <button type="submit" disabled={isLoading} className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ml-auto">
                  {isLoading ? (<span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Creating account...</span>) : (<span>Create Account <ArrowRight className="w-5 h-5 inline ml-1" /></span>)}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}