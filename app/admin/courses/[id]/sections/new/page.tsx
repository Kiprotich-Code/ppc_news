"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { AdminSidebar, SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED } from "@/components/AdminSidebar"
import { AdminMobileNav } from "@/components/AdminMobileNav"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ArrowLeft, Plus, Menu, Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Minus, Image as ImageIcon, Video as VideoIcon } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Heading from "@tiptap/extension-heading"
import TextAlign from "@tiptap/extension-text-align"
import LinkExtension from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"

interface Course {
  id: string
  title: string
  category: {
    name: string
  }
}

interface FormData {
  title: string
  description: string
}

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
        style: 'width:100%;min-height:320px;',
      }],
      HTMLAttributes.caption ? ['div', { class: 'caption' }, HTMLAttributes.caption] : null
    ]
  },
})

export default function NewSectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [courseId, setCourseId] = useState<string>("")
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: ""
  })

  // TipTap Editor for description
  const editor = useEditor({
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
        placeholder: 'Describe what students will learn in this section...',
        emptyEditorClass: 'is-editor-empty'
      }),
    ],
    content: '',
    autofocus: 'end',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      setFormData(prev => ({ ...prev, description: JSON.stringify(editor.getJSON()) }))
    }
  })

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    // Get the course ID from params Promise
    params.then(({ id }) => {
      setCourseId(id)
    })
  }, [params])

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

  // Insert image handler
  const insertImage = useCallback(async (file: File) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error("Only PNG, JPG, and WebP images are allowed.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB.")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      
      const caption = prompt("Image caption (optional):") || ''
      editor?.chain().focus().setImage({ src: data.url }).run()
      
      if (caption) {
        const { state } = editor!
        const { doc } = state
        let pos = -1
        
        doc.descendants((node, position) => {
          if (node.type.name === 'image' && node.attrs.src === data.url) {
            pos = position
          }
        })

        if (pos !== -1) {
          editor?.commands.command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, { src: data.url, caption })
            return true
          })
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image upload failed")
    }
  }, [editor])

  // Insert video handler
  const insertVideo = useCallback(() => {
    const handleEmbedUrl = () => {
      const url = prompt("Paste video embed URL (YouTube, Vimeo, etc):")
      if (!url) return
      
      const caption = prompt("Video caption (optional):") || ''
      editor?.chain().focus().insertContent({
        type: 'video',
        attrs: { src: url, caption },
      }).run()
    }
    handleEmbedUrl()
  }, [editor])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error("Section title is required")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/courses/${courseId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const section = await response.json()
        toast.success("Section created successfully")
        router.push(`/admin/courses/${courseId}`)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create section")
      }
    } catch (error) {
      console.error("Error creating section:", error)
      toast.error("Failed to create section")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
          <Link href="/admin/courses" className="text-red-600 hover:text-red-800 transition-colors">
            Return to Courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
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

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">New Section</h1>
          </div>
          <Link 
            href={`/admin/courses/${course.id}`}
            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main 
        className="transition-all duration-300 ease-in-out"
        style={{
          marginLeft: isMobile ? 0 : (sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED)
        }}
      >
        <div className="p-6">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center gap-4 mb-6">
            <Link 
              href={`/admin/courses/${course.id}`}
              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Section</h1>
              <p className="text-gray-600 mt-1">
                Add a section to <span className="font-medium text-red-600">{course.title}</span>
              </p>
            </div>
          </div>

          {/* Breadcrumb */}
          <nav className="mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/admin/courses" className="hover:text-red-600 transition-colors">
                Courses
              </Link>
              <span>/</span>
              <Link href={`/admin/courses/${course.id}`} className="hover:text-red-600 transition-colors">
                {course.title}
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">New Section</span>
            </div>
          </nav>

          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow border border-red-100">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Section Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Enter section title (e.g., Introduction, Advanced Techniques)"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will be displayed as a chapter or module heading
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    
                    {/* Editor Toolbar */}
                    <div className="flex flex-wrap gap-1 md:gap-2 mb-2 p-2 bg-gray-50 rounded-lg">
                      <button 
                        type="button" 
                        onClick={() => editor?.chain().focus().toggleBold().run()} 
                        className={`p-1 md:p-2 rounded hover:bg-gray-200 transition ${editor?.isActive('bold') ? 'bg-gray-200' : ''}`}
                        title="Bold"
                      >
                        <Bold className="w-4 h-4" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => editor?.chain().focus().toggleItalic().run()} 
                        className={`p-1 md:p-2 rounded hover:bg-gray-200 transition ${editor?.isActive('italic') ? 'bg-gray-200' : ''}`}
                        title="Italic"
                      >
                        <Italic className="w-4 h-4" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} 
                        className={`p-1 md:p-2 rounded hover:bg-gray-200 transition ${editor?.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
                        title="Heading"
                      >
                        <Heading2 className="w-4 h-4" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => editor?.chain().focus().toggleBulletList().run()} 
                        className={`p-1 md:p-2 rounded hover:bg-gray-200 transition ${editor?.isActive('bulletList') ? 'bg-gray-200' : ''}`}
                        title="Bullet List"
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'image/*'
                          input.onchange = e => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (file) insertImage(file)
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
                        onClick={insertVideo}
                        className="p-1 md:p-2 rounded hover:bg-gray-200 transition"
                        title="Insert Video"
                      >
                        <VideoIcon className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Editor */}
                    <div className="border border-gray-300 min-h-[150px] p-4 focus-within:ring-2 focus-within:ring-red-500 focus-within:border-transparent transition rounded-lg">
                      <EditorContent editor={editor} className="min-h-[100px]" />
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1">
                      Rich description to help students understand the section content
                    </p>
                  </div>
                </div>
              </div>

              {/* Course Context Info */}
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-red-900 mb-2">Course Information</h3>
                <div className="text-sm text-red-800">
                  <p><span className="font-medium">Course:</span> {course.title}</p>
                  <p><span className="font-medium">Category:</span> {course.category.name}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[160px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Section
                    </>
                  )}
                </button>
                
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </Link>
              </div>

              {/* Help Text */}
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-2">💡 Tips for Creating Sections</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Use clear, descriptive titles that outline the learning progression</li>
                  <li>• Consider logical grouping of related lessons</li>
                  <li>• Each section should have a clear learning objective</li>
                  <li>• After creating the section, you can add lessons to it</li>
                </ul>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AdminMobileNav />
      </div>
    </div>
  )
}
