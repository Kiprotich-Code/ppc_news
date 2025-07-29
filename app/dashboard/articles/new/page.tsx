"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/Navigation"
import { Sidebar } from "@/components/Sidebar"
import toast from "react-hot-toast"
import dynamic from "next/dynamic"
import { FileText, Loader2, Upload, Image as ImageIcon, Video as VideoIcon, Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Minus } from "lucide-react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Heading from "@tiptap/extension-heading"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { Dialog } from "@/components/Dialog"

// Custom Video extension using iframe embeds
const Video = Image.extend({
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

export default function NewArticle() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showConfirm, setShowConfirm] = useState<null | 'draft' | 'publish'>(null)
  const [title, setTitle] = useState("")
  const [subTitle, setSubTitle] = useState("")
  const [featuredImage, setFeaturedImage] = useState("")
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null)
  const [featuredImageUploading, setFeaturedImageUploading] = useState(false)
  const featuredImageInputRef = useRef<HTMLInputElement>(null)

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
      Video,
      Heading.configure({ levels: [1, 2, 3] }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({ 
        placeholder: 'Write your article content here...',
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
  })

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (title || subTitle || featuredImage || editor?.getText().trim()) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [title, subTitle, featuredImage, editor])

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
      
      // Set caption if provided
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

  // SAVE HANDLER
  const handleSave = async (publishedStatus: 'DRAFT' | 'PUBLISHED') => {
    if (publishedStatus === 'PUBLISHED') {
      if (!title.trim()) {
        toast.error("Title is required to publish.")
        return
      }
      if (!editor?.getJSON().content?.length) {
        toast.error("Content is required to publish.")
        return
      }
      if (!featuredImage) {
        toast.error("Featured image is required to publish.")
        return
      }
    } else {
      // For draft, allow incomplete fields
      if (!title.trim() && !editor?.getJSON().content?.length && !featuredImage) {
        toast.error("Please enter at least one field to save a draft.")
        return
      }
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subTitle,
          content: JSON.stringify(editor?.getJSON()),
          publishedStatus, // Updated to use publishedStatus
          authorId: session?.user?.id,
          featuredImage,
        }),
      })

      if (!res.ok) throw new Error("Failed to save article")

      toast.success(publishedStatus === 'DRAFT' ? "Draft saved!" : "Article published!")
      router.push("/dashboard/content")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save article")
    } finally {
      setIsLoading(false)
      setShowConfirm(null)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Please sign in to create articles.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar 
          open={sidebarOpen} 
          setOpen={setSidebarOpen} 
          userName={session.user.name} 
        />
        
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-32' : 'ml-16'} mt-4`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Write New Article</h1>
              <p className="text-gray-600 mt-2">
                Share your knowledge and earn money for every view.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Enter your article title"
                    required
                  />
                </div>
                
                {/* Subtitle */}
                <div>
                  <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-2">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    id="subtitle"
                    value={subTitle}
                    onChange={e => setSubTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Enter a subtitle (optional)"
                  />
                </div>
                
                {/* Featured Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Featured Image *
                  </label>
                  {featuredImage ? (
                    <div className="mb-2">
                      <img 
                        src={featuredImage} 
                        alt="Featured" 
                        className="max-h-48 rounded-lg border mb-2 object-cover w-full"
                      />
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-800 text-xs mb-2 transition"
                        onClick={() => {
                          setFeaturedImage("")
                          setFeaturedImageFile(null)
                          if (featuredImageInputRef.current) featuredImageInputRef.current.value = ""
                        }}
                      >
                        Remove & Replace
                      </button>
                    </div>
                  ) : null}
                  
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    ref={featuredImageInputRef}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return

                      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
                        toast.error("Only PNG, JPG, and WebP images are allowed.")
                        return
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("Image size must be less than 5MB.")
                        return
                      }

                      setFeaturedImageUploading(true)
                      const formData = new FormData()
                      formData.append("file", file)

                      try {
                        const res = await fetch("/api/upload", {
                          method: "POST",
                          body: formData,
                        })
                        const data = await res.json()
                        if (!res.ok) throw new Error(data.error || "Upload failed")

                        setFeaturedImage(data.url)
                        setFeaturedImageFile(file)
                        toast.success("Featured image uploaded!")
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Image upload failed")
                      } finally {
                        setFeaturedImageUploading(false)
                      }
                    }}
                    disabled={!!featuredImage || featuredImageUploading}
                  />
                  
                  {featuredImageUploading && (
                    <div className="flex items-center gap-2 mt-2 text-blue-600 text-sm">
                      <Loader2 className="animate-spin w-4 h-4" /> Uploading...
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF, WebP. Max 10MB. Required for publishing.
                  </p>
                </div>
                
                {/* Editor Toolbar */}
                <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-lg">
                  <button 
                    type="button" 
                    onClick={() => editor?.chain().focus().toggleBold().run()} 
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor?.isActive('bold') ? 'bg-gray-200' : ''}`}
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => editor?.chain().focus().toggleItalic().run()} 
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor?.isActive('italic') ? 'bg-gray-200' : ''}`}
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} 
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor?.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
                    title="Heading 1"
                  >
                    <Heading1 className="w-4 h-4" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} 
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor?.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
                    title="Heading 2"
                  >
                    <Heading2 className="w-4 h-4" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} 
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor?.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}
                    title="Heading 3"
                  >
                    <Heading3 className="w-4 h-4" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => editor?.chain().focus().toggleBulletList().run()} 
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor?.isActive('bulletList') ? 'bg-gray-200' : ''}`}
                    title="Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()} 
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor?.isActive('orderedList') ? 'bg-gray-200' : ''}`}
                    title="Numbered List"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => editor?.chain().focus().setHorizontalRule().run()} 
                    className="p-2 rounded hover:bg-gray-200 transition"
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
                    className="p-2 rounded hover:bg-gray-200 transition"
                    title="Insert Image"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={insertVideo}
                    className="p-2 rounded hover:bg-gray-200 transition"
                    title="Insert Video"
                  >
                    <VideoIcon className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Editor */}
                <div className="border border-gray-300 rounded-lg min-h-[400px] p-4 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition">
                  <EditorContent editor={editor} className="min-h-[300px]" />
                </div>
                
                {/* Save/Publish Buttons */}
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => setShowConfirm('draft')}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Save Draft"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirm('publish')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Publish
                      </>
                    )}
                  </button>
                </div>
                
                {/* Confirmation Dialog */}
                {showConfirm && (
                  <Dialog
                    open={!!showConfirm}
                    onClose={() => setShowConfirm(null)}
                    title={showConfirm === 'draft' ? 'Save as Draft?' : 'Publish Article?'}
                    description={showConfirm === 'draft' 
                      ? 'Your article will be saved as a draft and can be edited later.' 
                      : 'Your article will be visible to the public. Are you ready to publish?'}
                    confirmText={showConfirm === 'draft' ? 'Save Draft' : 'Publish'}
                    onConfirm={() => handleSave(showConfirm === 'draft' ? 'DRAFT' : 'PUBLISHED')}
                    loading={isLoading}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}