"use client";

import React from "react";
import Link from "next/link";
import { FileText, PenTool, DollarSign, Users, BarChart2, Globe, Clock, Award, BookOpen, ShieldCheck } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-white via-gray-50 to-red-50 py-20 md:py-32 border-b border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-6">
          <div className="max-w-xl w-full mb-12 md:mb-0">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-4 leading-tight"
            >
              Your Words, <span className="text-red-600">Global Impact</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-gray-700 text-lg md:text-xl mb-8"
            >
              Join Africa's fastest-growing writer platform. Earn from your expertise while reaching millions of engaged readers.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/auth/signin">
                <button className="bg-red-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-red-700 transition-all hover:shadow-lg transform hover:scale-[1.02] text-lg">
                  Start Writing Now
                </button>
              </Link>
              <Link href="#how-it-works">
                <button className="border-2 border-red-600 text-red-600 px-8 py-4 rounded-lg font-medium hover:bg-red-50 transition-all hover:shadow-lg transform hover:scale-[1.02] text-lg">
                  How It Works
                </button>
              </Link>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex-1 flex justify-center md:justify-end relative"
          >
            <div className="relative w-full max-w-lg aspect-video">
              <Image
                src="/dashboard.png"
                alt="POSTPAY Hub Dashboard Mockup"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 6, repeat: Infinity }}
                className="absolute -bottom-8 -left-8 hidden lg:block"
              >
                <Image
                  src="/article.png"
                  alt="Sample Article"
                  width={160}
                  height={200}
                  className="rounded-lg shadow-xl border-2 border-white"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-100 rounded-full filter blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-50 rounded-full filter blur-3xl opacity-50 animate-pulse delay-1000"></div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <Globe className="h-10 w-10 text-red-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900">35K</p>
              <p className="text-gray-600">Monthly Readers</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <Users className="h-10 w-10 text-red-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900">400</p>
              <p className="text-gray-600">Active Writers</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <DollarSign className="h-10 w-10 text-red-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900">$200+</p>
              <p className="text-gray-600">Paid to Writers</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <BookOpen className="h-10 w-10 text-red-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900">9.2K+</p>
              <p className="text-gray-600">Published Articles</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How POSTPAY Hub Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From signing up to earning money - we've made the process simple and rewarding
            </p>
          </div>
          
          <div className="relative">
            {/* Timeline */}
            <div className="hidden md:block absolute left-1/2 h-full w-1 bg-red-100 transform -translate-x-1/2"></div>
            
            <div className="space-y-16 md:space-y-0">
              {/* Step 1 */}
              <div className="relative md:flex items-center justify-between">
                <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="md:w-5/12 mb-8 md:mb-0"
                >
                  <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex items-center mb-4">
                      <div className="bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-4">1</div>
                      <h3 className="text-xl font-bold text-gray-900">Create Your Account</h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Sign up in under 2 minutes. No upfront costs or commitments.
                    </p>
                    <Image
                      src="/signup.png"
                      alt="Signup Process"
                      width={400}
                      height={250}
                      className="rounded-lg border border-gray-200"
                    />
                  </div>
                </motion.div>
                
                <div className="hidden md:flex justify-center md:w-2/12">
                  <div className="bg-red-600 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold shadow-lg">
                    1
                  </div>
                </div>
                
                <div className="md:w-5/12"></div>
              </div>
              
              {/* Step 2 */}
              <div className="relative md:flex items-center justify-between">
                <div className="md:w-5/12"></div>
                
                <div className="hidden md:flex justify-center md:w-2/12">
                  <div className="bg-red-600 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold shadow-lg">
                    2
                  </div>
                </div>
                
                <motion.div 
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="md:w-5/12 mt-8 md:mt-0"
                >
                  <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex items-center mb-4">
                      <div className="bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-4">2</div>
                      <h3 className="text-xl font-bold text-gray-900">Write & Publish</h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Use our intuitive editor to craft your story. Add images, videos, and format with ease.
                    </p>
                    <Image
                      src="/new.png"
                      alt="Editor Screenshot"
                      width={400}
                      height={250}
                      className="rounded-lg border border-gray-200"
                    />
                  </div>
                </motion.div>
              </div>
              
              {/* Step 3 */}
              <div className="relative md:flex items-center justify-between">
                <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="md:w-5/12 mb-8 md:mb-0"
                >
                  <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex items-center mb-4">
                      <div className="bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-4">3</div>
                      <h3 className="text-xl font-bold text-gray-900">Reach Millions</h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Your article gets distributed across our network of 350M+ readers.
                    </p>
                    <Image
                      src="/mpesa.png"
                      alt="Distribution Map"
                      width={400}
                      height={250}
                      className="rounded-lg border border-gray-200"
                    />
                  </div>
                </motion.div>
                
                <div className="hidden md:flex justify-center md:w-2/12">
                  <div className="bg-red-600 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold shadow-lg">
                    3
                  </div>
                </div>
                
                <div className="md:w-5/12"></div>
              </div>
              
              {/* Step 4 */}
              <div className="relative md:flex items-center justify-between">
                <div className="md:w-5/12"></div>
                
                <div className="hidden md:flex justify-center md:w-2/12">
                  <div className="bg-red-600 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold shadow-lg">
                    4
                  </div>
                </div>
                
                <motion.div 
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="md:w-5/12 mt-8 md:mt-0"
                >
                  <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex items-center mb-4">
                      <div className="bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-4">4</div>
                      <h3 className="text-xl font-bold text-gray-900">Earn Money</h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Get paid weekly based on your article's performance. Withdraw via M-Pesa or bank transfer.
                    </p>
                    <Image
                      src="/wallet.png"
                      alt="Earnings Dashboard"
                      width={400}
                      height={250}
                      className="rounded-lg border border-gray-200"
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from writers who've transformed their lives with POSTPAY Hub
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="relative h-64">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-6">
                  <div>
                    <h3 className="text-white text-xl font-bold">Sarah K.</h3>
                    <p className="text-red-200">Lifestyle Writer</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  "I went from writing as a hobby to earning Ksh 45,000/month. POSTPAY Hub gave me the platform I needed."
                </p>
                <div className="flex items-center">
                  <BarChart2 className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-sm font-medium">+320% earnings in 6 months</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="relative h-64">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-6">
                  <div>
                    <h3 className="text-white text-xl font-bold">James M.</h3>
                    <p className="text-red-200">Tech Analyst</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  "My tech analysis articles now reach over 500k readers monthly. The exposure is incredible."
                </p>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-sm font-medium">1.2M+ article views</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="relative h-64">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-6">
                  <div>
                    <h3 className="text-white text-xl font-bold">Amina W.</h3>
                    <p className="text-red-200">Health Writer</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  "Quit my 9-5 job after my health articles went viral. Now I earn 3x my previous salary."
                </p>
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-sm font-medium">Ksh 210,000 last month</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Writers
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to focus on what matters - your writing
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="bg-gray-50 p-8 rounded-xl border border-gray-200"
            >
              <div className="bg-red-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <PenTool className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Intuitive Editor</h3>
              <p className="text-gray-600">
                Our distraction-free editor supports rich formatting, images, videos, and more with easy keyboard shortcuts.
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="bg-gray-50 p-8 rounded-xl border border-gray-200"
            >
              <div className="bg-red-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <BarChart2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Real-time Analytics</h3>
              <p className="text-gray-600">
                Track views, reading time, and earnings with detailed analytics updated every hour.
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="bg-gray-50 p-8 rounded-xl border border-gray-200"
            >
              <div className="bg-red-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Clock className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Scheduled Publishing</h3>
              <p className="text-gray-600">
                Write when inspiration strikes and schedule articles to publish at optimal times.
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="bg-gray-50 p-8 rounded-xl border border-gray-200"
            >
              <div className="bg-red-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <ShieldCheck className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Content Protection</h3>
              <p className="text-gray-600">
                Automatic copyright registration and plagiarism detection to protect your work.
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="bg-gray-50 p-8 rounded-xl border border-gray-200"
            >
              <div className="bg-red-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Award className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Writer Badges</h3>
              <p className="text-gray-600">
                Earn recognition and badges as you grow, increasing your visibility.
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="bg-gray-50 p-8 rounded-xl border border-gray-200"
            >
              <div className="bg-red-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Community Support</h3>
              <p className="text-gray-600">
                Join our exclusive writer community for feedback, tips, and networking.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Earnings Calculator Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              See Your Potential Earnings
            </h2>
            <p className="text-xl max-w-3xl mx-auto">
              Calculate how much you could earn based on your writing frequency
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Earnings Calculator</h3>
                
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">Articles per week</label>
                  <div className="flex items-center">
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      defaultValue="3"
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="ml-4 bg-red-600 text-white px-3 py-1 rounded-lg font-bold min-w-10 text-center">3</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">Average views per article</label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-gray-700">
                    <option>1,000 - 5,000</option>
                    <option>5,000 - 20,000</option>
                    <option>20,000 - 100,000</option>
                    <option>100,000+</option>
                  </select>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">Article category</label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-gray-700">
                    <option>Technology</option>
                    <option>Business</option>
                    <option>Health</option>
                    <option>Lifestyle</option>
                    <option>Politics</option>
                  </select>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 flex flex-col justify-center">
                <div className="text-center mb-6">
                  <p className="text-gray-600">Your estimated monthly earnings</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">Ksh 24,500 - 38,000</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base earnings</span>
                    <span className="font-medium">Ksh 18,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Performance bonus</span>
                    <span className="font-medium">Ksh 6,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reader tips</span>
                    <span className="font-medium">Ksh 3,500</span>
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-red-600">Ksh 28,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Types Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Can You Write About?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We welcome diverse voices across all topics and formats
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
            >
              <div className="h-48 relative">
                {/* <Image
                  src="/content-tech.jpg"
                  alt="Technology"
                  fill
                  className="object-cover"
                /> */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex items-end p-6">
                  <h3 className="text-white text-xl font-bold">Technology</h3>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                    Gadget reviews
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                    How-to guides
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                    Industry analysis
                  </li>
                </ul>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
            >
              <div className="h-48 relative">
                {/* <Image
                  src="/content-business.jpg"
                  alt="Business"
                  fill
                  className="object-cover"
                /> */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex items-end p-6">
                  <h3 className="text-white text-xl font-bold">Business</h3>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                    Startup stories
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                    Financial advice
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                    Market trends
                  </li>
                </ul>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
            >
              <div className="h-48 relative">
                {/* <Image
                  src="/content-lifestyle.jpg"
                  alt="Lifestyle"
                  fill
                  className="object-cover"
                /> */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex items-end p-6">
                  <h3 className="text-white text-xl font-bold">Lifestyle</h3>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                    Travel diaries
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                    Food & recipes
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                    Parenting tips
                  </li>
                </ul>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
            >
              <div className="h-48 relative">
                {/* <Image
                  src="/content-opinion.jpg"
                  alt="Opinion"
                  fill
                  className="object-cover"
                /> */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex items-end p-6">
                  <h3 className="text-white text-xl font-bold">Opinion</h3>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                    Political commentary
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                    Cultural analysis
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                    Personal essays
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            Ready to Start Your Writing Journey?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto"
          >
            Join thousands of writers who are already building their audience and earning money doing what they love.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link href="/auth/register">
              <button className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-lg font-semibold text-lg transition-all hover:shadow-lg transform hover:scale-[1.02]">
                Join Now - It's Free
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-6 w-6 text-red-400" />
                <span className="text-xl font-bold text-white">POSTPAY Hub</span>
              </div>
              <p className="text-gray-400">
                Empowering writers to share their voice and earn from their craft.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">For Writers</h4>
              <ul className="space-y-2">
                <li><Link href="/signup" className="hover:text-white transition">Sign Up</Link></li>
                <li><Link href="" className="hover:text-white transition">Earnings</Link></li>
                <li><Link href="" className="hover:text-white transition">Writing Resources</Link></li>
                <li><Link href="" className="hover:text-white transition">Success Stories</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="" className="hover:text-white transition">Careers</Link></li>
                <li><Link href="" className="hover:text-white transition">Blog</Link></li>
                <li><Link href="/" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="" className="hover:text-white transition">Terms</Link></li>
                <li><Link href="" className="hover:text-white transition">Privacy</Link></li>
                <li><Link href="" className="hover:text-white transition">Copyright</Link></li>
                <li><Link href="" className="hover:text-white transition">Content Guidelines</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} POSTPAY Hub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}