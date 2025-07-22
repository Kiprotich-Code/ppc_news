"use client"

import { useState } from "react"
import { Navigation } from "@/components/Navigation"
import { Sidebar } from "@/components/Sidebar"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect } from "react"

const initialProfile = {
  photo: "/public/vercel.svg", // Replace with actual user photo path
  wemediaName: "fleek",
  category: "",
  description: "Passionate sports writer, committed to making an impact one article at a time.",
  referAFriend: "https://hub.opera.com/login?refer=JWDAYAQ",
  contact: {
    legalName: "",
    location: "",
    idType: "",
    idNumber: "",
    email: "",
    phoneNumber: "",
    minipayAccount: "",
    kraPin: "",
  },
  payment: {
    minipayAccount: "",
    bankName: "",
    bankAccount: "",
    bankBranch: "",
    bankCode: "",
    mobileMoney: "",
  },
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'personal' | 'payment'>("personal")
  const [profile, setProfile] = useState(initialProfile)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState(profile)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { data: session, status } = useSession()
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  if (status === "loading" || !session) {
    return null;
  }

  const handleTab = (tab: 'personal' | 'payment') => {
    setActiveTab(tab)
    setEditMode(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name.startsWith("contact.")) {
      setForm({
        ...form,
        contact: { ...form.contact, [name.replace("contact.", "")]: value },
      })
    } else if (name.startsWith("payment.")) {
      setForm({
        ...form,
        payment: { ...form.payment, [name.replace("payment.", "")]: value },
      })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const handleSave = () => {
    setProfile(form)
    setEditMode(false)
    // TODO: Add API call to persist changes
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
          <div className="w-full mx-auto px-10 py-10">
            {/* Tabs */}
            <div className="flex mb-8">
              <button
                className={`px-6 py-2 font-semibold focus:outline-none border-b-2 ${activeTab === 'personal' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}
                onClick={() => handleTab('personal')}
              >
                Personal Info
              </button>
              <button
                className={`px-6 py-2 font-semibold focus:outline-none border-b-2 ${activeTab === 'payment' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}
                onClick={() => handleTab('payment')}
              >
                Payment method
              </button>
            </div>

            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className="bg-white rounded-lg shadow p-8 mb-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-lg font-semibold">Account information</h2>
                  {!editMode && (
                    <button className="border px-4 py-2 rounded text-sm text-gray-700 hover:bg-gray-100" onClick={() => setEditMode(true)}>
                      Edit Profile
                    </button>
                  )}
                </div>
                {editMode ? (
                  <form className="space-y-8" onSubmit={e => { e.preventDefault(); handleSave(); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="flex flex-col items-center md:items-start">
                        <span className="text-xs text-gray-400 uppercase mb-2">Photo</span>
                        <Image src={form.photo} alt="Profile photo" width={60} height={60} className="rounded-full" />
                        {/* TODO: Add photo upload */}
                      </div>
                      <div className="space-y-6 w-full">
                        <div>
                          <span className="text-xs text-gray-400 uppercase">Wemedia Name</span>
                          <input name="wemediaName" value={form.wemediaName} onChange={handleChange} className="w-full mt-1 px-2 py-1 border rounded" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 uppercase">Category</span>
                          <input name="category" value={form.category} onChange={handleChange} className="w-full mt-1 px-2 py-1 border rounded" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 uppercase">Description</span>
                          <textarea name="description" value={form.description} onChange={handleChange} className="w-full mt-1 px-2 py-1 border rounded" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 uppercase">Refer-a-friend</span>
                          <input name="referAFriend" value={form.referAFriend} onChange={handleChange} className="w-full mt-1 px-2 py-1 border rounded" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-8">
                      <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                      <button type="button" className="px-6 py-2 border rounded" onClick={handleCancel}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="flex flex-col items-center md:items-start">
                        <span className="text-xs text-gray-400 uppercase mb-2">Photo</span>
                        <Image src={profile.photo} alt="Profile photo" width={60} height={60} className="rounded-full" />
                      </div>
                      <div className="space-y-6">
                        <div>
                          <span className="text-xs text-gray-400 uppercase">Wemedia Name</span>
                          <div className="text-base text-gray-800 mt-1">{profile.wemediaName}</div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 uppercase">Category</span>
                          <div className="text-base text-gray-800 mt-1">{profile.category}</div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 uppercase">Description</span>
                          <div className="text-base text-gray-800 mt-1">{profile.description}</div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 uppercase">Refer-a-friend</span>
                          <div className="text-base mt-1">
                            <a href={profile.referAFriend} className="text-red-400 hover:underline" target="_blank" rel="noopener noreferrer">
                              {profile.referAFriend}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                      <div className="space-y-6">
                        <div>
                          <span className="text-xs text-gray-400 uppercase">Legal Name</span>
                          <div className="text-base text-gray-800 mt-1">{profile.contact.legalName}</div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 uppercase">Location</span>
                          <div className="text-base text-gray-800 mt-1">{profile.contact.location}</div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 uppercase">ID Type</span>
                          <div className="text-base text-gray-800 mt-1">{profile.contact.idType}</div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 uppercase">ID Number</span>
                          <div className="text-base text-gray-800 mt-1">{profile.contact.idNumber}</div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <span className="text-xs text-gray-400 uppercase">Email</span>
                          <div className="text-base text-gray-800 mt-1">{profile.contact.email}</div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 uppercase">Phone Number</span>
                          <div className="text-base text-gray-800 mt-1">{profile.contact.phoneNumber}</div>
                        </div>
              <div>
                          <span className="text-xs text-gray-400 uppercase">Minipay Account</span>
                          <div className="text-base text-gray-800 mt-1">{profile.contact.minipayAccount}</div>
              </div>
              <div>
                          <span className="text-xs text-gray-400 uppercase">KRA Pin</span>
                          <div className="text-base text-gray-800 mt-1">{profile.contact.kraPin}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Payment Info Tab */}
            {activeTab === 'payment' && (
              <div className="bg-white rounded-lg shadow p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-lg font-semibold">Payment Information</h2>
                  {!editMode && (
                    <button className="border px-4 py-2 rounded text-sm text-gray-700 hover:bg-gray-100" onClick={() => setEditMode(true)}>
                      Edit Payment Info
                    </button>
                  )}
                </div>
                {editMode ? (
                  <form className="space-y-8" onSubmit={e => { e.preventDefault(); handleSave(); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <span className="text-xs text-gray-400 uppercase">Minipay Account</span>
                          <input name="payment.minipayAccount" value={form.payment.minipayAccount} onChange={handleChange} className="w-full mt-1 px-2 py-1 border rounded" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 uppercase">Bank Name</span>
                          <input name="payment.bankName" value={form.payment.bankName} onChange={handleChange} className="w-full mt-1 px-2 py-1 border rounded" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 uppercase">Bank Account</span>
                          <input name="payment.bankAccount" value={form.payment.bankAccount} onChange={handleChange} className="w-full mt-1 px-2 py-1 border rounded" />
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <span className="text-xs text-gray-400 uppercase">Bank Branch</span>
                          <input name="payment.bankBranch" value={form.payment.bankBranch} onChange={handleChange} className="w-full mt-1 px-2 py-1 border rounded" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 uppercase">Bank Code</span>
                          <input name="payment.bankCode" value={form.payment.bankCode} onChange={handleChange} className="w-full mt-1 px-2 py-1 border rounded" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 uppercase">Mobile Money</span>
                          <input name="payment.mobileMoney" value={form.payment.mobileMoney} onChange={handleChange} className="w-full mt-1 px-2 py-1 border rounded" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-8">
                      <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                      <button type="button" className="px-6 py-2 border rounded" onClick={handleCancel}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <span className="text-xs text-gray-400 uppercase">Minipay Account</span>
                        <div className="text-base text-gray-800 mt-1">{profile.payment.minipayAccount}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 uppercase">Bank Name</span>
                        <div className="text-base text-gray-800 mt-1">{profile.payment.bankName}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 uppercase">Bank Account</span>
                        <div className="text-base text-gray-800 mt-1">{profile.payment.bankAccount}</div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <span className="text-xs text-gray-400 uppercase">Bank Branch</span>
                        <div className="text-base text-gray-800 mt-1">{profile.payment.bankBranch}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 uppercase">Bank Code</span>
                        <div className="text-base text-gray-800 mt-1">{profile.payment.bankCode}</div>
              </div>
              <div>
                        <span className="text-xs text-gray-400 uppercase">Mobile Money</span>
                        <div className="text-base text-gray-800 mt-1">{profile.payment.mobileMoney}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
} 