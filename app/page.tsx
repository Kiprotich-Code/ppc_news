import { Navigation } from "@/components/Navigation"
import { FileText, TrendingUp, Users, DollarSign } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
              Publish Your Stories,
              <span className="text-blue-600"> Earn Your Income</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              Join our community of writers and start earning money for every view your articles receive. 
              Share your knowledge, stories, and insights with the world.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Start Writing Today
              </Link>
              <Link
                href="/auth/signin"
                className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              Why Choose PPC News?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to succeed as a content creator
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Easy Publishing
              </h3>
              <p className="text-gray-600">
                Publish your articles with our simple and intuitive editor. 
                Support for text and images to make your content stand out.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Track Performance
              </h3>
              <p className="text-gray-600">
                Monitor your article views, earnings, and audience engagement 
                with detailed analytics and insights.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mb-4">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Earn Money
              </h3>
              <p className="text-gray-600">
                Get paid for every view your articles receive. 
                Set up your withdrawal account and cash out your earnings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Start Your Writing Journey?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of writers who are already earning from their content.
            </p>
            <Link
              href="/auth/register"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <FileText className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">PPC News</span>
            </div>
            <p className="text-gray-400">
              © 2024 PPC News. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
