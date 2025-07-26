"use client"

import { useState, useRef, useEffect } from "react"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Navigation } from "@/components/Navigation"
import { Sidebar } from "@/components/Sidebar"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Tag, Image as ImageIcon, IdCard, Home, CreditCard, Sparkles } from "lucide-react"
import { DashboardMobileNav } from "@/components/DashboardMobileNav"

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

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        {/* Sidebar for md+ */}
        <div className="hidden md:block">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={session?.user?.name} />
        </div>
        <main className={`flex-1 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'} mt-4 pb-20`}>
          <LoadingSpinner />
        </main>
        {/* Bottom nav for mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <DashboardMobileNav />
        </div>
      </div>
    )
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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar for md+ */}
      <div className="hidden md:block">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={session?.user?.name} />
      </div>
      <div className="flex-1 flex flex-col">
        <main className={`flex-1 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'} mt-4 pb-20`}>
          <div className="w-full mx-auto px-4 py-10">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in-up">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
                {!editMode && (
                  <button onClick={() => setEditMode(true)} className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-300 shadow-md hover:shadow-lg">
                    Edit Profile
                  </button>
                )}
              </div>
              {/* Stepper */}
              <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex-1 flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg ${step >= s ? 'bg-red-600' : 'bg-gray-300'}`}>
                      {s}
                    </div>
                    <div className={`text-sm mt-2 ${step === s ? 'text-red-700 font-semibold' : 'text-gray-500'}`}>
                      {s === 1 ? 'Account' : s === 2 ? 'Personal' : s === 3 ? 'Contact' : 'Payment'}
                    </div>
                  </div>
                ))}
              </div>
              <form className="space-y-8" onSubmit={e => { e.preventDefault(); handleSave(); }}>
                {/* Step 1: Account Info (non-editable) */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center">
                      <span className="text-sm text-gray-600 uppercase mb-4">Profile Picture</span>
                      <div className="relative">
                        {form.profileImage && <img src={form.profileImage} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-red-100 shadow-lg" />}
                        {editMode && (
                          <>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2">
                              <ImageIcon className="w-5 h-5" /> Upload New
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm text-gray-600 uppercase">Username</label>
                        <input name="username" value={form.username} disabled className="w-full mt-2 px-4 py-2 border rounded-lg bg-gray-50 text-lg text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 uppercase">Email</label>
                        <input name="email" value={form.email} disabled className="w-full mt-2 px-4 py-2 border rounded-lg bg-gray-50 text-lg text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 uppercase">ID Number</label>
                        <input name="idNumber" value={form.idNumber} disabled className="w-full mt-2 px-4 py-2 border rounded-lg bg-gray-50 text-lg text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 uppercase">Referral Code</label>
                        <input name="referralCode" value={form.referralCode} disabled className="w-full mt-2 px-4 py-2 border rounded-lg bg-gray-50 text-lg text-gray-900 font-mono" />
                      </div>
                    </div>
                  </div>
                )}
                {/* Step 2: Personal Info (editable) */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm text-gray-600 uppercase">Full Name</label>
                      <input name="name" value={form.name} onChange={handleChange} disabled={!editMode} className={`w-full mt-2 px-4 py-2 border rounded-lg text-lg text-gray-900 ${editMode ? 'border-gray-300 focus:border-red-500 focus:ring-red-500' : 'bg-gray-50'}`} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 uppercase">Bio</label>
                      <textarea name="bio" value={form.bio} onChange={handleChange} disabled={!editMode} className={`w-full mt-2 px-4 py-2 border rounded-lg text-lg text-gray-900 ${editMode ? 'border-gray-300 focus:border-red-500 focus:ring-red-500' : 'bg-gray-50'} min-h-[120px]`} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 uppercase">Location</label>
                      <input name="location" value={form.location} onChange={handleChange} disabled={!editMode} className={`w-full mt-2 px-4 py-2 border rounded-lg text-lg text-gray-900 ${editMode ? 'border-gray-300 focus:border-red-500 focus:ring-red-500' : 'bg-gray-50'}`} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 uppercase">Tags / Categories</label>
                      <div className="flex flex-wrap gap-3 mb-4">
                        {form.tags.map((tag: string) => (
                          <span key={tag} className="bg-red-50 text-red-700 px-4 py-2 rounded-full flex items-center text-base shadow-sm">
                            <Tag className="w-5 h-5 mr-2" />{tag}
                            {editMode && <button type="button" className="ml-2 text-red-500 hover:text-red-700" onClick={() => handleRemoveTag(tag)}>&times;</button>}
                          </span>
                        ))}
                      </div>
                      {editMode && (
                        <div className="flex gap-4">
                          <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 text-lg text-gray-900" placeholder="Add a tag/category" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }} />
                          <button type="button" onClick={handleAddTag} className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-300 shadow-md hover:shadow-lg">
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Step 3: Contact Info (address editable) */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm text-gray-600 uppercase">ID Type</label>
                      <input name="idType" value={form.idType} disabled className="w-full mt-2 px-4 py-2 border rounded-lg bg-gray-50 text-lg text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 uppercase">ID Number</label>
                      <input name="idNumber" value={form.idNumber} disabled className="w-full mt-2 px-4 py-2 border rounded-lg bg-gray-50 text-lg text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 uppercase">Phone Number</label>
                      <input name="phone" value={form.phone} disabled className="w-full mt-2 px-4 py-2 border rounded-lg bg-gray-50 text-lg text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 uppercase">KRA PIN</label>
                      <input name="kraPin" value={form.kraPin} disabled className="w-full mt-2 px-4 py-2 border rounded-lg bg-gray-50 text-lg text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 uppercase">Address</label>
                      <input name="address" value={form.address} onChange={handleChange} disabled={!editMode} className={`w-full mt-2 px-4 py-2 border rounded-lg text-lg text-gray-900 ${editMode ? 'border-gray-300 focus:border-red-500 focus:ring-red-500' : 'bg-gray-50'}`} />
                    </div>
                  </div>
                )}
                {/* Step 4: Payment Info (editable) */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm text-gray-600 uppercase">Minipay Account</label>
                      <input name="withdrawalAccount" value={form.withdrawalAccount} onChange={handleChange} disabled={!editMode} className={`w-full mt-2 px-4 py-2 border rounded-lg text-lg text-gray-900 ${editMode ? 'border-gray-300 focus:border-red-500 focus:ring-red-500' : 'bg-gray-50'}`} />
                    </div>
                  </div>
                )}
                {/* Stepper Navigation */}
                <div className="flex justify-between mt-8">
                  {step > 1 && (
                    <button type="button" onClick={() => setStep(step - 1)} disabled={isLoading} className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-300 shadow-md">
                      Back
                    </button>
                  )}
                  {step < 4 && (
                    <button type="button" onClick={() => setStep(step + 1)} disabled={isLoading} className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-300 shadow-md ml-auto">
                      Next
                    </button>
                  )}
                  {step === 4 && editMode && (
                    <button type="submit" disabled={isLoading} className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-500/50 ml-auto">
                      {isLoading ? (<span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Saving...</span>) : (<span>Save Changes</span>)}
                    </button>
                  )}
                </div>
                {editMode && (
                  <div className="flex gap-4 mt-4">
                    <button type="button" onClick={handleCancel} className="px-6 py-3 border-2 border-gray-300 text-gray-800 rounded-lg hover:bg-gray-100 transition-all duration-300">
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </main>
      </div>
      {/* Bottom nav for mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <DashboardMobileNav />
      </div>
    </div>
  );
}