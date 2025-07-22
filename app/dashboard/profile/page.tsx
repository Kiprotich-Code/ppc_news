"use client"

import { useState, useRef, useEffect } from "react"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Navigation } from "@/components/Navigation"
import { Sidebar } from "@/components/Sidebar"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Tag, Image as ImageIcon, IdCard, Home, CreditCard, Sparkles } from "lucide-react"

type Profile = {
  username: string
  email: string
  name: string
  bio: string
  location: string
  tags: string[]
  profileImage: string
  idType: string
  idNumber: string
  kraPin: string
  address: string
  phone: string
  withdrawalAccount: string
  referralCode: string
  role: string
}

const emptyProfile: Profile = {
  username: "",
  email: "",
  name: "",
  bio: "",
  location: "",
  tags: [],
  profileImage: "",
  idType: "",
  idNumber: "",
  kraPin: "",
  address: "",
  phone: "",
  withdrawalAccount: "",
  referralCode: "",
  role: "",
}

export default function ProfilePage() {
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState(emptyProfile)
  const [form, setForm] = useState(emptyProfile)
  const [editMode, setEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState("")
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { data: session, status } = useSession()
  const router = useRouter()

  // Fetch user profile from API
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          const user = data.user;
          setProfile({
            username: user?.username || "",
            email: user?.email || "",
            name: user?.name || "",
            bio: user?.bio || "",
            location: user?.location || "",
            tags: user?.tags ? (typeof user.tags === "string" ? JSON.parse(user.tags) : user.tags) : [],
            profileImage: user?.profileImage || "",
            idType: user?.idType || "",
            idNumber: user?.idNumber || "",
            kraPin: user?.kraPin || "",
            address: user?.address || "",
            phone: user?.phone || "",
            withdrawalAccount: user?.withdrawalAccount || "",
            referralCode: user?.referralCode || "",
            role: user?.role || "",
          });
          setForm({
            username: user?.username || "",
            email: user?.email || "",
            name: user?.name || "",
            bio: user?.bio || "",
            location: user?.location || "",
            tags: user?.tags ? (typeof user.tags === "string" ? JSON.parse(user.tags) : user.tags) : [],
            profileImage: user?.profileImage || "",
            idType: user?.idType || "",
            idNumber: user?.idNumber || "",
            kraPin: user?.kraPin || "",
            address: user?.address || "",
            phone: user?.phone || "",
            withdrawalAccount: user?.withdrawalAccount || "",
            referralCode: user?.referralCode || "",
            role: user?.role || "",
          });
        }
      } catch (e) {
        // Optionally handle error
      }
    };
    fetchProfile();
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Not Authenticated</h2>
          <p className="text-gray-700">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }
  const handleAddTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] })
      setTagInput("")
    }
  }
  const handleRemoveTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter((t: string) => t !== tag) })
  }
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm({ ...form, profileImage: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }
  const handleSave = async () => {
    setIsLoading(true)
    try {
      const payload = {
        name: form.name,
        bio: form.bio,
        location: form.location,
        tags: JSON.stringify(form.tags),
        profileImage: form.profileImage,
        address: form.address,
        withdrawalAccount: form.withdrawalAccount
      };
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setProfile(prev => ({
          ...prev,
          ...payload,
          tags: payload.tags ? JSON.parse(payload.tags) : [],
        }));
        setEditMode(false);
      }
    } catch (e) {}
    setIsLoading(false);
  }
  const handleCancel = () => {
    setForm(profile)
    setEditMode(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="flex">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <main className={`flex-1 transition-all duration-200 ${sidebarOpen ? 'ml-64' : 'ml-20'} mt-4`}>
          <div className="w-full max-w-2xl mx-auto px-4 py-10">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in-up">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-lg font-semibold">Profile</h2>
                {!editMode && (
                  <button className="border px-4 py-2 rounded text-sm text-gray-700 hover:bg-gray-100" onClick={() => setEditMode(true)}>
                    Edit Profile
                  </button>
                )}
              </div>
              {/* Stepper */}
              <div className="flex justify-between items-center mb-8">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex-1 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${step >= s ? 'bg-indigo-600' : 'bg-gray-300'}`}>{s}</div>
                    <div className={`text-xs mt-2 ${step === s ? 'text-indigo-700 font-semibold' : 'text-gray-400'}`}>{
                      s === 1 ? 'Account' : s === 2 ? 'Personal' : s === 3 ? 'Contact' : 'Payment'
                    }</div>
                  </div>
                ))}
              </div>
              <form className="space-y-6" onSubmit={e => { e.preventDefault(); handleSave(); }}>
                {/* Step 1: Account Info (non-editable) */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-400 uppercase mb-2">Profile Picture</span>
                      {form.profileImage && <img src={form.profileImage} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-indigo-200" />}
                      {editMode && <>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                        <button type="button" className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 flex items-center gap-2" onClick={() => fileInputRef.current?.click()}><ImageIcon className="w-4 h-4" />Upload</button>
                      </>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs text-gray-400 uppercase">Username</label>
                        <input name="username" value={form.username} disabled className="w-full mt-1 px-2 py-1 border rounded bg-gray-100" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 uppercase">Email</label>
                        <input name="email" value={form.email} disabled className="w-full mt-1 px-2 py-1 border rounded bg-gray-100" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 uppercase">ID Number</label>
                        <input name="idNumber" value={form.idNumber} disabled className="w-full mt-1 px-2 py-1 border rounded bg-gray-100" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 uppercase">Referral Code</label>
                        <input name="referralCode" value={form.referralCode} disabled className="w-full mt-1 px-2 py-1 border rounded bg-gray-100 font-mono" />
                      </div>
                    </div>
                  </div>
                )}
                {/* Step 2: Personal Info (editable) */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs text-gray-400 uppercase">Full Name</label>
                      <input name="name" value={form.name} onChange={handleChange} disabled={!editMode} className={`w-full mt-1 px-2 py-1 border rounded ${!editMode ? 'bg-gray-100' : ''}`} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 uppercase">Bio</label>
                      <textarea name="bio" value={form.bio} onChange={handleChange} disabled={!editMode} className={`w-full mt-1 px-2 py-1 border rounded ${!editMode ? 'bg-gray-100' : ''}`} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 uppercase">Location</label>
                      <input name="location" value={form.location} onChange={handleChange} disabled={!editMode} className={`w-full mt-1 px-2 py-1 border rounded ${!editMode ? 'bg-gray-100' : ''}`} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 uppercase">Tags / Categories</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {form.tags.map((tag: string) => (
                          <span key={tag} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full flex items-center text-xs">
                            <Tag className="w-3 h-3 mr-1" />{tag}
                            {editMode && <button type="button" className="ml-1 text-gray-400 hover:text-red-500" onClick={() => handleRemoveTag(tag)}>&times;</button>}
                          </span>
                        ))}
                      </div>
                      {editMode && <div className="flex gap-2">
                        <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} className="flex-1 pl-4 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500" placeholder="Add a tag/category" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }} />
                        <button type="button" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700" onClick={handleAddTag}>Add</button>
                      </div>}
                    </div>
                  </div>
                )}
                {/* Step 3: Contact Info (address editable) */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs text-gray-400 uppercase">ID Type</label>
                      <input name="idType" value={form.idType} disabled className="w-full mt-1 px-2 py-1 border rounded bg-gray-100" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 uppercase">ID Number</label>
                      <input name="idNumber" value={form.idNumber} disabled className="w-full mt-1 px-2 py-1 border rounded bg-gray-100" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 uppercase">Phone Number</label>
                      <input name="phone" value={form.phone} disabled className="w-full mt-1 px-2 py-1 border rounded bg-gray-100" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 uppercase">KRA PIN</label>
                      <input name="kraPin" value={form.kraPin} disabled className="w-full mt-1 px-2 py-1 border rounded bg-gray-100" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 uppercase">Address</label>
                      <input name="address" value={form.address} onChange={handleChange} disabled={!editMode} className={`w-full mt-1 px-2 py-1 border rounded ${!editMode ? 'bg-gray-100' : ''}`} />
                    </div>
                  </div>
                )}
                {/* Step 4: Payment Info (editable) */}
                {step === 4 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs text-gray-400 uppercase">Minipay Account</label>
                      <input name="withdrawalAccount" value={form.withdrawalAccount} onChange={handleChange} disabled={!editMode} className={`w-full mt-1 px-2 py-1 border rounded ${!editMode ? 'bg-gray-100' : ''}`} />
                    </div>
                  </div>
                )}
                {/* Stepper Navigation */}
                <div className="flex justify-between mt-8">
                  {step > 1 && (
                    <button type="button" className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300" onClick={() => setStep(step - 1)} disabled={isLoading}>Back</button>
                  )}
                  {step < 4 && (
                    <button type="button" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 ml-auto" onClick={() => setStep(step + 1)} disabled={isLoading}>Next</button>
                  )}
                  {step === 4 && editMode && (
                    <button type="submit" disabled={isLoading} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ml-auto">
                      {isLoading ? (<span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Saving...</span>) : (<span>Save Changes</span>)}
                    </button>
                  )}
                </div>
                {editMode && (
                  <div className="flex gap-4 mt-4">
                    <button type="button" className="px-6 py-2 border rounded" onClick={handleCancel}>Cancel</button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 