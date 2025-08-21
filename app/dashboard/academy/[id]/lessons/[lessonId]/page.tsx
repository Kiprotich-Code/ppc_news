"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navigation } from "@/components/Navigation"
import { Sidebar } from "@/components/Sidebar"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { DashboardMobileNav } from "@/components/DashboardMobileNav"
import { tiptapToHtml, isTipTapContent } from "@/lib/utils"
import { 
  BookOpen, 
  Clock, 
  PlayCircle, 
  FileText, 
  Download, 
  CheckCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import Link from "next/link"

interface Lesson {
  id: string
  title: string
  description: string
  type: string
  content: string
  videoUrl: string
  duration: number
  orderIndex: number
  isFreePreview: boolean
  isCompleted: boolean
  section: {
    id: string
    title: string
    course: {
      id: string
      title: string
    }
  }
}

interface NavigationLesson {
  id: string
  title: string
  orderIndex: number
  sectionTitle: string
}

export default function LessonViewPage({ 
  params 
}: { 
  params: Promise<{ id: string; lessonId: string }> 
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [nextLesson, setNextLesson] = useState<NavigationLesson | null>(null)
  const [prevLesson, setPrevLesson] = useState<NavigationLesson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [courseId, setCourseId] = useState<string>("")
  const [lessonId, setLessonId] = useState<string>("")

  useEffect(() => {
    params.then(({ id, lessonId }) => {
      setCourseId(id)
      setLessonId(lessonId)
    })
  }, [params])

  useEffect(() => {
    if (status === "loading" || !courseId || !lessonId) return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchLesson()
  }, [session, status, router, courseId, lessonId])

  const fetchLesson = async () => {
    try {
      const response = await fetch(`/api/dashboard/courses/${courseId}/lessons/${lessonId}`)
      if (response.ok) {
        const data = await response.json()
        setLesson(data.lesson)
        setNextLesson(data.nextLesson)
        setPrevLesson(data.prevLesson)
      } else {
        router.push(`/dashboard/academy/${courseId}`)
      }
    } catch (error) {
      console.error("Error fetching lesson:", error)
      router.push(`/dashboard/academy/${courseId}`)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsCompleted = async () => {
    if (!lesson || lesson.isCompleted) return

    try {
      const response = await fetch(`/api/dashboard/courses/${courseId}/lessons/${lessonId}/complete`, {
        method: 'POST'
      })

      if (response.ok) {
        setLesson(prev => prev ? { ...prev, isCompleted: true } : null)
      }
    } catch (error) {
      console.error("Error marking lesson as completed:", error)
    }
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'ARTICLE':
        return <FileText className="h-5 w-5" />
      case 'VIDEO':
        return <PlayCircle className="h-5 w-5" />
      case 'PDF':
        return <Download className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} mt-16`}>
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!session || !lesson) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="hidden md:block">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      </div>
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Link
                href={`/dashboard/academy/${courseId}`}
                className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div className="flex-1">
                <div className="text-sm text-gray-600">
                  <Link href={`/dashboard/academy/${courseId}`} className="hover:text-blue-600">
                    {lesson.section.course.title}
                  </Link>
                  <span className="mx-2">•</span>
                  <span>{lesson.section.title}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{lesson.title}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    {getLessonIcon(lesson.type)}
                    <span className="capitalize">{lesson.type.toLowerCase()}</span>
                  </div>
                  {lesson.duration > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{lesson.duration} min</span>
                    </div>
                  )}
                  {lesson.isCompleted && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Completed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {lesson.type === 'VIDEO' && lesson.videoUrl && (
              <div className="aspect-video bg-black">
                <iframe
                  src={lesson.videoUrl}
                  title={lesson.title}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            )}
            
            <div className="p-6">
              {lesson.description && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">About this lesson</h2>
                  {isTipTapContent(lesson.description) ? (
                    <div 
                      className="text-gray-700" 
                      dangerouslySetInnerHTML={{ __html: tiptapToHtml(lesson.description, "text-gray-700") }}
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed">{lesson.description}</p>
                  )}
                </div>
              )}

              {lesson.type === 'ARTICLE' && lesson.content && (
                <div className="prose max-w-none">
                  {isTipTapContent(lesson.content) ? (
                    <div dangerouslySetInnerHTML={{ __html: tiptapToHtml(lesson.content) }} />
                  ) : (
                    <div className="whitespace-pre-wrap">{lesson.content}</div>
                  )}
                </div>
              )}

              {lesson.type === 'PDF' && lesson.content && (
                <div className="text-center py-8">
                  <div className="bg-gray-50 rounded-lg p-8">
                    <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Download PDF</h3>
                    <p className="text-gray-600 mb-4">Click the button below to download the lesson material.</p>
                    <a
                      href={lesson.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-2">
              {prevLesson && (
                <Link
                  href={`/dashboard/academy/${courseId}/lessons/${prevLesson.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous: </span>
                  <span className="truncate max-w-32">{prevLesson.title}</span>
                </Link>
              )}
              {nextLesson && (
                <Link
                  href={`/dashboard/academy/${courseId}/lessons/${nextLesson.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span className="truncate max-w-32">{nextLesson.title}</span>
                  <span className="hidden sm:inline"> :Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            {!lesson.isCompleted && (
              <button
                onClick={markAsCompleted}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Mark as Complete
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <DashboardMobileNav />
      </div>
    </div>
  )
}
