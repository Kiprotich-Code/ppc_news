"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { AdminSidebar, SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED } from "@/components/AdminSidebar"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown,
  ChevronUp,
  BookOpen,
  Users,
  Eye,
  EyeOff,
  Menu,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Image as ImageIcon,
  Video as VideoIcon
} from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate, tiptapToHtml, extractTextFromTipTap, isTipTapContent } from "@/lib/utils"
import { AdminMobileNav } from "@/components/AdminMobileNav"
import toast from "react-hot-toast"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Heading from "@tiptap/extension-heading"
import TextAlign from "@tiptap/extension-text-align"
import LinkExtension from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"

// Custom Video extension using iframe embeds
const VideoEmbed = Image.extend({
  name: 'video',
  group: 'block',
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      src: {},
      alt: { default: null },
      title: { default: null },
      caption: { default: null },
    }
  },
  parseHTML() {
    return [
      {
        tag: 'iframe[src]'
      }
    ]
  },
  renderHTML({ HTMLAttributes }: { HTMLAttributes: any }) {
    return [
      'div', { class: 'video-embed' },
      ['iframe', {
        src: HTMLAttributes.src,
        title: HTMLAttributes.title || '',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        allowfullscreen: 'true',
        frameborder: '0',
        style: 'width:100%;min-height:320px;border-radius:8px;'
      }],
      HTMLAttributes.caption ? ['div', { class: 'video-caption' }, HTMLAttributes.caption] : null
    ]
  }
})

interface Lesson {
  id: string
  title: string
  description: string
  type: string
  duration: number
  orderIndex: number
  isFreePreview: boolean
  isPublished: boolean
}

interface Section {
  id: string
  title: string
  description: string
  orderIndex: number
  isPublished: boolean
  lessons: Lesson[]
}

interface Course {
  id: string
  title: string
  description: string
  shortDescription: string
  price: number
  isFree: boolean
  isPremium: boolean
  isPublished: boolean
  difficulty: string
  duration: string
  instructor: string
  featuredImage: string
  createdAt: string
  category: {
    id: string
    name: string
  }
  sections: Section[]
  tags: string[]
  requirements: string[]
  whatYouWillLearn: string[]
  _count: {
    enrollments: number
  }
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [isMdUp, setIsMdUp] = useState(false)
  const { id: courseId } = use(params)
  
  // Inline editing states
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    shortDescription: '',
    price: 0,
    isFree: false,
    isPremium: true,
    difficulty: 'BEGINNER',
    duration: '',
    instructor: '',
    categoryId: ''
  })
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  const [updateLoading, setUpdateLoading] = useState(false)

  // TipTap Editor for description
  const descriptionEditor = useEditor({
    extensions: [
      StarterKit,
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            caption: { default: null },
          }
        },
        renderHTML({ HTMLAttributes }: { HTMLAttributes: any }) {
          return [
            'figure', { class: 'image-container' },
            ['img', { ...HTMLAttributes, class: 'image-content' }],
            HTMLAttributes.caption ? ['figcaption', { class: 'image-caption' }, HTMLAttributes.caption] : null
          ]
        },
      }),
      VideoEmbed,
      Heading.configure({ levels: [1, 2, 3] }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      LinkExtension.configure({
        openOnClick: false,
      }),
      Placeholder.configure({ 
        placeholder: 'Write a detailed course description...',
        emptyEditorClass: 'is-editor-empty'
      }),
    ],
    content: '',
    autofocus: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      setEditForm(prev => ({ ...prev, description: JSON.stringify(editor.getJSON()) }))
    }
  })

  // TipTap Editor for short description
  const shortDescriptionEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ 
        placeholder: 'Brief description for course listing...',
        emptyEditorClass: 'is-editor-empty'
      }),
    ],
    content: '',
    autofocus: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      setEditForm(prev => ({ ...prev, shortDescription: JSON.stringify(editor.getJSON()) }))
    }
  })

  useEffect(() => {
    const checkScreen = () => {
      setIsMdUp(window.matchMedia('(min-width: 768px)').matches)
    }
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

  useEffect(() => {
    if (status === "loading" || !courseId) return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    if (session.user?.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }
    fetchCourse()
  }, [session, status, router, courseId])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`)
      if (response.ok) {
        const data = await response.json()
        setCourse(data)
        // Expand all sections by default
        setExpandedSections(new Set(data.sections.map((s: Section) => s.id)))
        
        // Initialize edit form with course data
        setEditForm({
          title: data.title || '',
          description: data.description || '',
          shortDescription: data.shortDescription || '',
          price: data.price || 0,
          isFree: data.isFree || false,
          isPremium: data.isPremium || true,
          difficulty: data.difficulty || 'BEGINNER',
          duration: data.duration || '',
          instructor: data.instructor || '',
          categoryId: data.category?.id || ''
        })

        // Initialize TipTap editors with existing content
        if (descriptionEditor && data.description) {
          try {
            const content = isTipTapContent(data.description) 
              ? JSON.parse(data.description)
              : { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: data.description }] }] }
            descriptionEditor.commands.setContent(content)
          } catch (e) {
            console.error('Error setting description content:', e)
            descriptionEditor.commands.setContent(data.description || '')
          }
        }

        if (shortDescriptionEditor && data.shortDescription) {
          try {
            const content = isTipTapContent(data.shortDescription) 
              ? JSON.parse(data.shortDescription)
              : { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: data.shortDescription }] }] }
            shortDescriptionEditor.commands.setContent(content)
          } catch (e) {
            console.error('Error setting short description content:', e)
            shortDescriptionEditor.commands.setContent(data.shortDescription || '')
          }
        }
      } else {
        toast.error("Failed to fetch course")
        router.push("/admin/courses")
      }
    } catch (error) {
      console.error("Error fetching course:", error)
      toast.error("Failed to fetch course")
      router.push("/admin/courses")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/courses/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateLoading(true)

    const loadingToast = toast.loading('Updating course...', {
      icon: '✏️',
    })

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      })

      toast.dismiss(loadingToast)

      if (response.ok) {
        toast.success(`"${editForm.title}" updated successfully`, {
          icon: '✅',
          duration: 4000,
          style: {
            background: '#10B981',
            color: '#fff',
          },
        })
        setIsEditing(false)
        fetchCourse() // Refresh course data
      } else {
        let errorMessage = "Failed to update course"
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch (jsonError) {
          console.error("Error parsing JSON response:", jsonError)
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        
        toast.error(`Failed to update "${editForm.title}": ${errorMessage}`, {
          icon: '❌',
          duration: 6000,
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        })
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error("Error updating course:", error)
      toast.error(`Failed to update "${editForm.title}": Network error`, {
        icon: '❌',
        duration: 6000,
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      })
    } finally {
      setUpdateLoading(false)
    }
  }

  const startEditing = () => {
    setIsEditing(true)
    fetchCategories() // Fetch categories when starting to edit

    // Initialize TipTap editors with current content
    if (course) {
      if (descriptionEditor && course.description) {
        try {
          const content = isTipTapContent(course.description) 
            ? JSON.parse(course.description)
            : { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: course.description }] }] }
          descriptionEditor.commands.setContent(content)
        } catch (e) {
          console.error('Error setting description content in startEditing:', e)
          descriptionEditor.commands.setContent(course.description || '')
        }
      }

      if (shortDescriptionEditor && course.shortDescription) {
        try {
          const content = isTipTapContent(course.shortDescription) 
            ? JSON.parse(course.shortDescription)
            : { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: course.shortDescription }] }] }
          shortDescriptionEditor.commands.setContent(content)
        } catch (e) {
          console.error('Error setting short description content in startEditing:', e)
          shortDescriptionEditor.commands.setContent(course.shortDescription || '')
        }
      }
    }
  }

  const cancelEditing = () => {
    setIsEditing(false)
    if (course) {
      // Reset form to original values
      setEditForm({
        title: course.title || '',
        description: course.description || '',
        shortDescription: course.shortDescription || '',
        price: course.price || 0,
        isFree: course.isFree || false,
        isPremium: course.isPremium || true,
        difficulty: course.difficulty || 'BEGINNER',
        duration: course.duration || '',
        instructor: course.instructor || '',
        categoryId: course.category?.id || ''
      })

      // Reset TipTap editors to original content
      if (descriptionEditor && course.description) {
        try {
          const content = isTipTapContent(course.description) 
            ? JSON.parse(course.description)
            : { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: course.description }] }] }
          descriptionEditor.commands.setContent(content)
        } catch (e) {
          console.error('Error resetting description content:', e)
          descriptionEditor.commands.setContent(course.description || '')
        }
      }

      if (shortDescriptionEditor && course.shortDescription) {
        try {
          const content = isTipTapContent(course.shortDescription) 
            ? JSON.parse(course.shortDescription)
            : { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: course.shortDescription }] }] }
          shortDescriptionEditor.commands.setContent(content)
        } catch (e) {
          console.error('Error resetting short description content:', e)
          shortDescriptionEditor.commands.setContent(course.shortDescription || '')
        }
      }
    }
  }

  // Helper functions for TipTap editors
  const insertImage = async (file: File, editor: any) => {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        editor?.chain().focus().setImage({ src: data.url, alt: file.name }).run()
        toast.success('Image uploaded successfully!')
      } else {
        toast.error('Failed to upload image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    }
  }

  const insertVideo = (editor: any) => {
    const url = prompt('Enter video URL (YouTube, Vimeo, or direct video link):')
    if (!url) return

    let embedUrl = url
    
    // Convert YouTube URLs to embed format
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0]
      embedUrl = `https://www.youtube.com/embed/${videoId}`
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0]
      embedUrl = `https://www.youtube.com/embed/${videoId}`
    } else if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('/')[0]
      embedUrl = `https://player.vimeo.com/video/${videoId}`
    }

    editor?.chain().focus().setImage({ src: embedUrl, alt: 'Video' }).run()
  }

  const toggleSectionExpanded = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const toggleCoursePublished = async () => {
    if (!course) return

    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !course.isPublished })
      })

      if (response.ok) {
        fetchCourse()
        toast.success(`Course ${!course.isPublished ? 'published' : 'unpublished'} successfully`)
      } else {
        toast.error("Failed to update course")
      }
    } catch (error) {
      console.error("Error updating course:", error)
      toast.error("Failed to update course")
    }
  }

  const deleteSection = async (sectionId: string, sectionTitle: string) => {
    if (!confirm(`Are you sure you want to delete the section "${sectionTitle}"? This will also delete all lessons in this section. This action cannot be undone.`)) {
      return
    }

    const loadingToast = toast.loading(`Deleting section "${sectionTitle}"...`, {
      icon: '�️',
      style: {
        borderRadius: '12px',
        background: '#374151',
        color: '#fff',
        fontWeight: '500',
        border: '1px solid #6B7280',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    })

    try {
      const response = await fetch(`/api/admin/courses/${courseId}/sections/${sectionId}`, {
        method: "DELETE"
      })

      toast.dismiss(loadingToast)

      if (response.ok) {
        const result = await response.json()
        fetchCourse() // Refresh course data
        
        toast.success(
          (t) => (
            <div className="flex flex-col">
              <div className="font-semibold text-green-800 mb-1">
                🎯 Section Deleted Successfully!
              </div>
              <div className="text-sm text-green-700">
                "{sectionTitle}" and {result.deletedLessons || 0} lesson{result.deletedLessons !== 1 ? 's' : ''} removed
              </div>
            </div>
          ),
          {
            duration: 5000,
            style: {
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
              border: '1px solid #10B981',
              boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.1), 0 4px 6px -2px rgba(16, 185, 129, 0.05)',
              padding: '16px',
              maxWidth: '400px',
            },
          }
        )
      } else {
        let errorMessage = "Failed to delete section"
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch (jsonError) {
          console.error("Error parsing JSON response:", jsonError)
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        
        toast.error(
          (t) => (
            <div className="flex flex-col">
              <div className="font-semibold text-red-800 mb-1">
                ⚠️ Deletion Failed
              </div>
              <div className="text-sm text-red-700">
                Couldn't delete "{sectionTitle}": {errorMessage}
              </div>
            </div>
          ),
          {
            duration: 7000,
            style: {
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
              border: '1px solid #EF4444',
              boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.1), 0 4px 6px -2px rgba(239, 68, 68, 0.05)',
              padding: '16px',
              maxWidth: '400px',
            },
          }
        )
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error("Error deleting section:", error)
      toast.error(
        (t) => (
          <div className="flex flex-col">
            <div className="font-semibold text-red-800 mb-1">
              🔌 Connection Error
            </div>
            <div className="text-sm text-red-700">
              Failed to delete "{sectionTitle}": Network issue
            </div>
          </div>
        ),
        {
          duration: 7000,
          style: {
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
            border: '1px solid #EF4444',
            boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.1), 0 4px 6px -2px rgba(239, 68, 68, 0.05)',
            padding: '16px',
            maxWidth: '400px',
          },
        }
      )
    }
  }

  const deleteLesson = async (sectionId: string, lessonId: string, lessonTitle: string) => {
    if (!confirm(`Are you sure you want to delete the lesson "${lessonTitle}"? This action cannot be undone.`)) {
      return
    }

    const loadingToast = toast.loading(`Deleting lesson "${lessonTitle}"...`, {
      icon: '�',
      style: {
        borderRadius: '12px',
        background: '#374151',
        color: '#fff',
        fontWeight: '500',
        border: '1px solid #6B7280',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    })

    try {
      const response = await fetch(`/api/admin/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`, {
        method: "DELETE"
      })

      toast.dismiss(loadingToast)

      if (response.ok) {
        fetchCourse() // Refresh course data
        toast.success(
          (t) => (
            <div className="flex flex-col">
              <div className="font-semibold text-blue-800 mb-1">
                🎓 Lesson Deleted Successfully!
              </div>
              <div className="text-sm text-blue-700">
                "{lessonTitle}" has been removed from the course
              </div>
            </div>
          ),
          {
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
              border: '1px solid #3B82F6',
              boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.1), 0 4px 6px -2px rgba(59, 130, 246, 0.05)',
              padding: '16px',
              maxWidth: '400px',
            },
          }
        )
      } else {
        let errorMessage = "Failed to delete lesson"
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch (jsonError) {
          console.error("Error parsing JSON response:", jsonError)
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        
        toast.error(
          (t) => (
            <div className="flex flex-col">
              <div className="font-semibold text-red-800 mb-1">
                ⚠️ Deletion Failed
              </div>
              <div className="text-sm text-red-700">
                Couldn't delete "{lessonTitle}": {errorMessage}
              </div>
            </div>
          ),
          {
            duration: 6000,
            style: {
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
              border: '1px solid #EF4444',
              boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.1), 0 4px 6px -2px rgba(239, 68, 68, 0.05)',
              padding: '16px',
              maxWidth: '400px',
            },
          }
        )
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error("Error deleting lesson:", error)
      toast.error(
        (t) => (
          <div className="flex flex-col">
            <div className="font-semibold text-red-800 mb-1">
              🔌 Connection Error
            </div>
            <div className="text-sm text-red-700">
              Failed to delete "{lessonTitle}": Network issue
            </div>
          </div>
        ),
        {
          duration: 6000,
          style: {
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
            border: '1px solid #EF4444',
            boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.1), 0 4px 6px -2px rgba(239, 68, 68, 0.05)',
            padding: '16px',
            maxWidth: '400px',
          },
        }
      )
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
          <Link href="/admin/courses" className="text-red-600 hover:text-red-800">
            Return to Courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }
        
        .ProseMirror.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        
        .image-container {
          margin: 1rem 0;
          text-align: center;
        }
        
        .image-content {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .image-caption, .video-caption {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.5rem;
          font-style: italic;
        }
        
        .video-embed {
          margin: 1rem 0;
          text-align: center;
        }
        
        .video-embed iframe {
          width: 100%;
          min-height: 320px;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
      `}</style>
      
      <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 truncate">{course.title}</h1>
          <Link 
            href="/admin/courses"
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar for md+ */}
        <div className="hidden md:block">
          <AdminSidebar 
            open={sidebarOpen} 
            setOpen={setSidebarOpen}
            navItems={[
              { label: "Dashboard", href: "/admin", icon: "home" },
              { label: "Articles", href: "/admin/articles", icon: "file-text" },
              { label: "Courses", href: "/admin/courses", icon: "book-open" },
              { label: "Members", href: "/admin/members", icon: "users" },
              { label: "Withdrawals", href: "/admin/withdrawals", icon: "wallet" },
              { label: "Transactions", href: "/admin/transactions", icon: "dollar-sign" },
              { label: "Settings", href: "/admin/settings", icon: "settings" },
            ]}
          />
        </div>
        
        <main
          className="flex-1 p-4 md:p-6 pb-20 transition-all duration-300"
          style={isMdUp ? { marginLeft: sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED } : {}}
        >
          {/* Header */}
          <div className="hidden md:flex items-center gap-4 mb-6">
            <Link 
              href="/admin/courses"
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">{course.title}</h1>
              <p className="text-gray-600 mt-1 text-sm">Manage course content and structure</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={toggleCoursePublished}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                  course.isPublished
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {course.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {course.isPublished ? 'Unpublish' : 'Publish'}
              </button>
              <button
                onClick={startEditing}
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Edit className="w-4 h-4" />
                Edit Course
              </button>
            </div>
          </div>

          {/* Mobile Quick Actions */}
          <div className="md:hidden mb-4 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={toggleCoursePublished}
                className={`flex-1 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm ${
                  course.isPublished
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {course.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {course.isPublished ? 'Unpublish' : 'Publish'}
              </button>
              <button
                onClick={startEditing}
                className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Edit className="w-4 h-4" />
                Edit Course
              </button>
            </div>
          </div>

          {/* Inline Edit Form */}
          {isEditing && (
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-red-200 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Course</h3>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course Title
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructor
                    </label>
                    <input
                      type="text"
                      value={editForm.instructor}
                      onChange={(e) => setEditForm({...editForm, instructor: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={editForm.categoryId}
                      onChange={(e) => setEditForm({...editForm, categoryId: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={editForm.difficulty}
                      onChange={(e) => setEditForm({...editForm, difficulty: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={editForm.duration}
                      onChange={(e) => setEditForm({...editForm, duration: e.target.value})}
                      placeholder="e.g., 5 hours"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value) || 0})}
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      disabled={editForm.isFree}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short Description
                  </label>
                  
                  {/* Editor Toolbar */}
                  <div className="border border-gray-300 border-b-0 rounded-t-lg p-2 bg-gray-50 flex flex-wrap gap-1">
                    <button 
                      type="button" 
                      onClick={() => shortDescriptionEditor?.chain().focus().toggleBold().run()} 
                      className={`p-1 md:p-2 rounded hover:bg-gray-200 transition ${shortDescriptionEditor?.isActive('bold') ? 'bg-gray-200' : ''}`}
                      title="Bold"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => shortDescriptionEditor?.chain().focus().toggleItalic().run()} 
                      className={`p-1 md:p-2 rounded hover:bg-gray-200 transition ${shortDescriptionEditor?.isActive('italic') ? 'bg-gray-200' : ''}`}
                      title="Italic"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Editor */}
                  <div className="border border-gray-300 border-t-0 min-h-[80px] p-3 focus-within:ring-2 focus-within:ring-red-500 focus-within:border-transparent transition rounded-b-lg">
                    <EditorContent editor={shortDescriptionEditor} className="min-h-[50px]" />
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Brief description for course listing
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Description
                  </label>
                  
                  {/* Editor Toolbar */}
                  <div className="border border-gray-300 border-b-0 rounded-t-lg p-2 bg-gray-50 flex flex-wrap gap-1">
                    <button 
                      type="button" 
                      onClick={() => descriptionEditor?.chain().focus().toggleBold().run()} 
                      className={`p-1 md:p-2 rounded hover:bg-gray-200 transition ${descriptionEditor?.isActive('bold') ? 'bg-gray-200' : ''}`}
                      title="Bold"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => descriptionEditor?.chain().focus().toggleItalic().run()} 
                      className={`p-1 md:p-2 rounded hover:bg-gray-200 transition ${descriptionEditor?.isActive('italic') ? 'bg-gray-200' : ''}`}
                      title="Italic"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => descriptionEditor?.chain().focus().toggleHeading({ level: 1 }).run()} 
                      className={`p-1 md:p-2 rounded hover:bg-gray-200 transition ${descriptionEditor?.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
                      title="Heading 1"
                    >
                      <Heading1 className="w-4 h-4" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => descriptionEditor?.chain().focus().toggleHeading({ level: 2 }).run()} 
                      className={`p-1 md:p-2 rounded hover:bg-gray-200 transition ${descriptionEditor?.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
                      title="Heading 2"
                    >
                      <Heading2 className="w-4 h-4" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => descriptionEditor?.chain().focus().toggleBulletList().run()} 
                      className={`p-1 md:p-2 rounded hover:bg-gray-200 transition ${descriptionEditor?.isActive('bulletList') ? 'bg-gray-200' : ''}`}
                      title="Bullet List"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => descriptionEditor?.chain().focus().toggleOrderedList().run()} 
                      className={`p-1 md:p-2 rounded hover:bg-gray-200 transition ${descriptionEditor?.isActive('orderedList') ? 'bg-gray-200' : ''}`}
                      title="Numbered List"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*'
                        input.onchange = e => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file) insertImage(file, descriptionEditor)
                        }
                        input.click()
                      }}
                      className="p-1 md:p-2 rounded hover:bg-gray-200 transition"
                      title="Insert Image"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVideo(descriptionEditor)}
                      className="p-1 md:p-2 rounded hover:bg-gray-200 transition"
                      title="Insert Video"
                    >
                      <VideoIcon className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Editor */}
                  <div className="border border-gray-300 border-t-0 min-h-[200px] p-4 focus-within:ring-2 focus-within:ring-red-500 focus-within:border-transparent transition rounded-b-lg">
                    <EditorContent editor={descriptionEditor} className="min-h-[150px]" />
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Rich description with formatting, images, and videos to showcase your course
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editForm.isFree}
                      onChange={(e) => setEditForm({...editForm, isFree: e.target.checked, price: e.target.checked ? 0 : editForm.price})}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Free Course</span>
                  </label>

                  {!editForm.isFree && (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editForm.isPremium}
                        onChange={(e) => setEditForm({...editForm, isPremium: e.target.checked})}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Premium Course</span>
                    </label>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 min-w-[120px]"
                  >
                    {updateLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm min-w-[80px]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Course Info */}
          {!isEditing && (
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-red-200 mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      course.isPublished 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      course.isFree 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {course.isFree ? 'Free' : 'Premium'}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                      {course.difficulty}
                    </span>
                  </div>
                  
                  <div 
                    className="text-gray-600 mb-4"
                    dangerouslySetInnerHTML={{ 
                      __html: course.shortDescription && isTipTapContent(course.shortDescription) 
                        ? tiptapToHtml(course.shortDescription, "custom")
                        : `<p>${course.shortDescription || 'No short description available'}</p>`
                    }}
                  />
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <div className="font-medium">{course.category.name}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Price:</span>
                      <div className="font-medium">
                        {course.isFree ? 'Free' : formatCurrency(course.price)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <div className="font-medium">{course.duration || 'Not specified'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Enrollments:</span>
                      <div className="font-medium flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {course._count.enrollments}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-gray-500 text-sm">Sections:</span>
                    <div className="font-medium">{course.sections.length}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Total Lessons:</span>
                    <div className="font-medium">
                      {course.sections.reduce((total, section) => total + section.lessons.length, 0)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Created:</span>
                    <div className="font-medium">{formatDate(new Date(course.createdAt))}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Course Description */}
          {!isEditing && course.description && (
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-red-200 mb-6">
              <h2 className="text-lg font-semibold mb-4">Course Description</h2>
              <div 
                className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: isTipTapContent(course.description) 
                    ? tiptapToHtml(course.description)
                    : `<p>${course.description}</p>`
                }}
              />
            </div>
          )}

          {/* Course Content */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Course Content</h2>
                <Link
                  href={`/admin/courses/${course.id}/sections/new`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Section
                </Link>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {course.sections.length === 0 ? (
                <div className="p-12 text-center">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No sections yet</h3>
                  <p className="text-gray-600 mb-4">Start building your course by adding sections and lessons.</p>
                  <Link
                    href={`/admin/courses/${course.id}/sections/new`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Section
                  </Link>
                </div>
              ) : (
                course.sections.map((section, sectionIndex) => (
                  <div key={section.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleSectionExpanded(section.id)}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          {expandedSections.has(section.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {sectionIndex + 1}. {section.title}
                          </h3>
                          {section.description && (
                            <p className="text-gray-600 text-sm mt-1">{section.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{section.lessons.length} lesson{section.lessons.length !== 1 ? 's' : ''}</span>
                            <span className={`px-2 py-1 rounded-full ${
                              section.isPublished 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {section.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/courses/${course.id}/sections/${section.id}/lessons/new`}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Lesson
                        </Link>
                        <Link
                          href={`/admin/courses/${course.id}/sections/${section.id}/edit`}
                          className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => deleteSection(section.id, section.title)}
                          className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {expandedSections.has(section.id) && (
                      <div className="ml-8 space-y-2">
                        {section.lessons.length === 0 ? (
                          <div className="p-4 bg-gray-50 rounded-lg text-center">
                            <p className="text-gray-600 text-sm mb-2">No lessons in this section</p>
                            <Link
                              href={`/admin/courses/${course.id}/sections/${section.id}/lessons/new`}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Add the first lesson
                            </Link>
                          </div>
                        ) : (
                          section.lessons.map((lesson, lessonIndex) => (
                            <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {sectionIndex + 1}.{lessonIndex + 1} {lesson.title}
                                  </span>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    lesson.type === 'VIDEO' ? 'bg-red-100 text-red-800' :
                                    lesson.type === 'PDF' ? 'bg-orange-100 text-orange-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {lesson.type}
                                  </span>
                                  {lesson.isFreePreview && (
                                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                      Free Preview
                                    </span>
                                  )}
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    lesson.isPublished 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {lesson.isPublished ? 'Published' : 'Draft'}
                                  </span>
                                </div>
                                {lesson.description && (
                                  <p className="text-gray-600 text-xs mt-1">{lesson.description}</p>
                                )}
                                {lesson.duration && (
                                  <p className="text-gray-500 text-xs mt-1">
                                    Duration: {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/admin/courses/${course.id}/sections/${section.id}/lessons/${lesson.id}/edit`}
                                  className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                  <Edit className="w-3 h-3" />
                                </Link>
                                <button 
                                  onClick={() => deleteLesson(section.id, lesson.id, lesson.title)}
                                  className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          
        </main>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AdminMobileNav />
      </div>
    </div>
    </>
  )
}
