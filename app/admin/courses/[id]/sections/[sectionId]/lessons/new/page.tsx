"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback, useRef } from "react"
import { AdminSidebar, SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED } from "@/components/AdminSidebar"
import { AdminMobileNav } from "@/components/AdminMobileNav"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ArrowLeft, Plus, Menu, FileText, Video, File, HelpCircle, Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Minus, Image as ImageIcon, Video as VideoIcon } from "lucide-react"
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

interface Section {
  id: string
  title: string
  course: Course
}

interface FormData {
  title: string
  description: string
  type: 'ARTICLE' | 'VIDEO' | 'PDF' | 'QUIZ'
  content: string
  videoUrl: string
  duration: number
  isFreePreview: boolean
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

export default function NewLessonPage({ 
  params 
}: { 
  params: Promise<{ id: string; sectionId: string }> 
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [section, setSection] = useState<Section | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [courseId, setCourseId] = useState<string>("")
  const [sectionId, setSectionId] = useState<string>("")
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    type: 'ARTICLE',
    content: "",
    videoUrl: "",
    duration: 0,
    isFreePreview: false
  })

  // TipTap Editor
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
        placeholder: 'Write your lesson content here...',
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
      setFormData(prev => ({ ...prev, content: JSON.stringify(editor.getJSON()) }))
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
    // Get the course ID and section ID from params Promise
    params.then(({ id, sectionId }) => {
      setCourseId(id)
      setSectionId(sectionId)
    })
  }, [params])

  useEffect(() => {
    if (status === "loading" || !courseId || !sectionId) return
    if (!session || session.user?.role !== "ADMIN") {
      router.push("/auth/signin")
      return
    }
    fetchSection()
  }, [session, status, router, courseId, sectionId])

  const fetchSection = async () => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/sections/${sectionId}`)
      if (response.ok) {
        const data = await response.json()
        setSection(data)
      } else {
        toast.error("Failed to fetch section")
        router.push(`/admin/courses/${courseId}`)
      }
    } catch (error) {
      console.error('Error fetching section:', error)
      toast.error("Error loading section")
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
    const handleFileUpload = async (file: File) => {
      if (file.type !== 'video/mp4') {
        toast.error("Only MP4 videos are allowed.")
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Video size must be less than 50MB.")
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

        const caption = prompt("Video caption (optional):") || ''
        editor?.chain().focus().insertContent({
          type: 'video',
          attrs: { src: data.url, caption },
        }).run()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Video upload failed")
      }
    }

    const handleEmbedUrl = () => {
      const url = prompt("Paste video embed URL (YouTube, Vimeo, etc):")
      if (!url) return
      
      const caption = prompt("Video caption (optional):") || ''
      editor?.chain().focus().insertContent({
        type: 'video',
        attrs: { src: url, caption },
      }).run()
    }

    if (window.confirm("Do you want to upload a video file? (Cancel for embed URL)")) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'video/mp4'
      input.onchange = e => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) handleFileUpload(file)
      }
      input.click()
    } else {
      handleEmbedUrl()
    }
  }, [editor])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error("Please enter a lesson title")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/sections/${sectionId}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success("Lesson created successfully!")
        router.push(`/admin/courses/${courseId}`)
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to create lesson")
      }
    } catch (error) {
      console.error('Error creating lesson:', error)
      toast.error("Error creating lesson")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'ARTICLE':
        return <FileText className="w-4 h-4" />
      case 'VIDEO':
        return <Video className="w-4 h-4" />
      case 'PDF':
        return <File className="w-4 h-4" />
      case 'QUIZ':
        return <HelpCircle className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading lesson creation...</span>
      </div>
    )
  }

  if (!section) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Section not found</h2>
          <Link
            href={`/admin/courses/${courseId}`}
            className="text-red-600 hover:text-red-700"
          >
            Return to course
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            <h1 className="text-lg font-semibold text-gray-900">New Lesson</h1>
          </div>
          <Link 
            href={`/admin/courses/${courseId}`}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="flex">
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
        
        <main
          className="flex-1 transition-all duration-300"
          style={!isMobile ? { marginLeft: sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED } : {}}
        >
          <div className="p-4 md:p-6 pb-20 md:pb-6">
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/courses/${courseId}`}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Create New Lesson</h1>
                  <p className="text-gray-600">Add a lesson to this section</p>
                </div>
              </div>
            </div>

            {/* Breadcrumb */}
            <div className="mb-6">
              <nav className="flex text-sm text-gray-500">
                <Link href="/admin/courses" className="hover:text-red-600">Courses</Link>
                <span className="mx-2">/</span>
                <Link href={`/admin/courses/${courseId}`} className="hover:text-red-600">
                  {section.course.title}
                </Link>
                <span className="mx-2">/</span>
                <span className="text-red-600 font-medium">{section.title}</span>
                <span className="mx-2">/</span>
                <span className="text-gray-900">New Lesson</span>
              </nav>
            </div>

            {/* Course & Section Info */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Plus className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">Adding lesson to:</span>
              </div>
              <h3 className="font-semibold text-red-900">{section.title}</h3>
              <p className="text-sm text-red-700">in "{section.course.title}"</p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg shadow-sm border border-red-100">
              <div className="px-6 py-4 border-b border-red-100">
                <h2 className="text-lg font-semibold text-gray-900">Lesson Details</h2>
                <p className="text-sm text-gray-600 mt-1">Configure your lesson content and settings</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lesson Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter lesson title..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Describe what students will learn in this lesson..."
                    />
                  </div>
                </div>

                {/* Lesson Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Lesson Type *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(['ARTICLE', 'VIDEO', 'PDF', 'QUIZ'] as const).map((type) => (
                      <label
                        key={type}
                        className={`relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          formData.type === type
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="type"
                          value={type}
                          checked={formData.type === type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <div className={`mx-auto mb-2 ${formData.type === type ? 'text-red-600' : 'text-gray-400'}`}>
                            {getLessonTypeIcon(type)}
                          </div>
                          <span className={`text-sm font-medium ${formData.type === type ? 'text-red-900' : 'text-gray-700'}`}>
                            {type.charAt(0) + type.slice(1).toLowerCase()}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Type-specific Content */}
                {formData.type === 'ARTICLE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Article Content
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
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} 
                        className={`p-1 md:p-2 rounded hover:bg-gray-200 transition ${editor?.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
                        title="Heading 1"
                      >
                        <Heading1 className="w-4 h-4" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} 
                        className={`p-1 md:p-2 rounded hover:bg-gray-200 transition ${editor?.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
                        title="Heading 2"
                      >
                        <Heading2 className="w-4 h-4" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} 
                        className={`p-1 md:p-2 rounded hover:bg-gray-200 transition ${editor?.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}
                        title="Heading 3"
                      >
                        <Heading3 className="w-4 h-4" />
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
                        onClick={() => editor?.chain().focus().toggleOrderedList().run()} 
                        className={`p-1 md:p-2 rounded hover:bg-gray-200 transition ${editor?.isActive('orderedList') ? 'bg-gray-200' : ''}`}
                        title="Numbered List"
                      >
                        <ListOrdered className="w-4 h-4" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => editor?.chain().focus().setHorizontalRule().run()} 
                        className="p-1 md:p-2 rounded hover:bg-gray-200 transition"
                        title="Horizontal Rule"
                      >
                        <Minus className="w-4 h-4" />
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
                    <div className="border border-gray-300 min-h-[300px] p-4 focus-within:ring-2 focus-within:ring-red-500 focus-within:border-transparent transition rounded-lg">
                      <EditorContent editor={editor} className="min-h-[200px] md:min-h-[300px]" />
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1">
                      Create rich content with formatting, images, and embedded videos.
                    </p>
                  </div>
                )}

                {formData.type === 'VIDEO' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Video URL
                      </label>
                      <input
                        type="url"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="https://youtube.com/watch?v=..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        YouTube, Vimeo, or direct video file URLs are supported.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="15"
                      />
                    </div>
                  </div>
                )}

                {formData.type === 'PDF' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PDF File URL
                    </label>
                    <input
                      type="url"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="https://example.com/document.pdf"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload your PDF file and provide the direct URL here.
                    </p>
                  </div>
                )}

                {formData.type === 'QUIZ' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quiz Instructions
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Provide instructions for the quiz..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Quiz questions can be configured after creating the lesson.
                    </p>
                  </div>
                )}

                {/* Free Preview Toggle */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="freePreview"
                    checked={formData.isFreePreview}
                    onChange={(e) => setFormData({ ...formData, isFreePreview: e.target.checked })}
                    className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                  />
                  <label htmlFor="freePreview" className="text-sm font-medium text-gray-700">
                    Make this lesson available as free preview
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-red-100">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {isSubmitting ? "Creating..." : "Create Lesson"}
                  </button>
                  <Link
                    href={`/admin/courses/${courseId}`}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-center"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <AdminMobileNav />
      </div>
    </div>
  )
}
