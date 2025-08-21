/**
 * Content Migration Utility for TipTap Implementation
 * 
 * This script helps convert existing plain text content to TipTap JSON format
 * for courses, sections, and lessons.
 */

export interface TipTapDocument {
  type: "doc"
  content: TipTapNode[]
}

export interface TipTapNode {
  type: string
  attrs?: Record<string, any>
  content?: TipTapNode[]
  text?: string
  marks?: TipTapMark[]
}

export interface TipTapMark {
  type: string
  attrs?: Record<string, any>
}

/**
 * Convert plain text to TipTap JSON format
 */
export function convertPlainTextToTipTap(text: string): string {
  if (!text || text.trim() === '') {
    return JSON.stringify({
      type: "doc",
      content: []
    })
  }

  // Split text into paragraphs
  const paragraphs = text.split('\n\n').filter(p => p.trim() !== '')
  
  const content: TipTapNode[] = paragraphs.map(paragraph => {
    const lines = paragraph.split('\n').filter(line => line.trim() !== '')
    
    if (lines.length === 1) {
      // Single line paragraph
      return {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: lines[0].trim()
          }
        ]
      }
    } else {
      // Multi-line paragraph with breaks
      const lineNodes: TipTapNode[] = []
      lines.forEach((line, index) => {
        lineNodes.push({
          type: "text",
          text: line.trim()
        })
        if (index < lines.length - 1) {
          lineNodes.push({
            type: "hardBreak"
          })
        }
      })
      
      return {
        type: "paragraph",
        content: lineNodes
      }
    }
  })

  const document: TipTapDocument = {
    type: "doc",
    content
  }

  return JSON.stringify(document)
}

/**
 * Convert Markdown-like text to TipTap JSON format
 */
export function convertMarkdownToTipTap(text: string): string {
  if (!text || text.trim() === '') {
    return JSON.stringify({
      type: "doc",
      content: []
    })
  }

  const lines = text.split('\n')
  const content: TipTapNode[] = []
  let currentParagraph: TipTapNode[] = []

  for (const line of lines) {
    const trimmedLine = line.trim()
    
    if (trimmedLine === '') {
      // Empty line - end current paragraph if it exists
      if (currentParagraph.length > 0) {
        content.push({
          type: "paragraph",
          content: currentParagraph
        })
        currentParagraph = []
      }
      continue
    }

    // Check for headers
    if (trimmedLine.startsWith('# ')) {
      if (currentParagraph.length > 0) {
        content.push({
          type: "paragraph", 
          content: currentParagraph
        })
        currentParagraph = []
      }
      content.push({
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: trimmedLine.substring(2) }]
      })
    } else if (trimmedLine.startsWith('## ')) {
      if (currentParagraph.length > 0) {
        content.push({
          type: "paragraph",
          content: currentParagraph
        })
        currentParagraph = []
      }
      content.push({
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: trimmedLine.substring(3) }]
      })
    } else if (trimmedLine.startsWith('### ')) {
      if (currentParagraph.length > 0) {
        content.push({
          type: "paragraph",
          content: currentParagraph
        })
        currentParagraph = []
      }
      content.push({
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: trimmedLine.substring(4) }]
      })
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      // Bullet list item
      if (currentParagraph.length > 0) {
        content.push({
          type: "paragraph",
          content: currentParagraph
        })
        currentParagraph = []
      }
      
      // Check if last item is a bullet list
      const lastItem = content[content.length - 1]
      if (lastItem && lastItem.type === "bulletList") {
        lastItem.content!.push({
          type: "listItem",
          content: [{
            type: "paragraph",
            content: [{ type: "text", text: trimmedLine.substring(2) }]
          }]
        })
      } else {
        content.push({
          type: "bulletList",
          content: [{
            type: "listItem",
            content: [{
              type: "paragraph", 
              content: [{ type: "text", text: trimmedLine.substring(2) }]
            }]
          }]
        })
      }
    } else if (/^\d+\.\s/.test(trimmedLine)) {
      // Numbered list item
      if (currentParagraph.length > 0) {
        content.push({
          type: "paragraph",
          content: currentParagraph
        })
        currentParagraph = []
      }
      
      const lastItem = content[content.length - 1]
      const text = trimmedLine.replace(/^\d+\.\s/, '')
      
      if (lastItem && lastItem.type === "orderedList") {
        lastItem.content!.push({
          type: "listItem",
          content: [{
            type: "paragraph",
            content: [{ type: "text", text }]
          }]
        })
      } else {
        content.push({
          type: "orderedList",
          content: [{
            type: "listItem",
            content: [{
              type: "paragraph",
              content: [{ type: "text", text }]
            }]
          }]
        })
      }
    } else {
      // Regular text line
      if (currentParagraph.length > 0) {
        currentParagraph.push({ type: "hardBreak" })
      }
      
      // Handle bold and italic formatting
      let textContent = trimmedLine
      const textNode: TipTapNode = { type: "text", text: textContent }
      
      // Simple bold detection
      if (textContent.includes('**')) {
        const parts = textContent.split('**')
        const formattedContent: TipTapNode[] = []
        
        parts.forEach((part, index) => {
          if (index % 2 === 0) {
            if (part) formattedContent.push({ type: "text", text: part })
          } else {
            if (part) formattedContent.push({ 
              type: "text", 
              text: part,
              marks: [{ type: "bold" }]
            })
          }
        })
        
        currentParagraph.push(...formattedContent)
      } else {
        currentParagraph.push(textNode)
      }
    }
  }

  // Add remaining paragraph
  if (currentParagraph.length > 0) {
    content.push({
      type: "paragraph",
      content: currentParagraph
    })
  }

  const document: TipTapDocument = {
    type: "doc",
    content
  }

  return JSON.stringify(document)
}

/**
 * Extract plain text from TipTap content for previews
 */
export function extractTextFromTipTap(content: string): string {
  if (!content) return ""
  
  try {
    const parsed = JSON.parse(content)
    
    function extractText(node: any): string {
      if (node.type === 'text') {
        return node.text || ''
      }
      
      if (node.content) {
        return node.content.map(extractText).join('')
      }
      
      return ''
    }
    
    if (parsed.content) {
      return parsed.content.map(extractText).join(' ')
    }
    
    return ''
  } catch (e) {
    // Return as-is if not JSON
    return content
  }
}

/**
 * Check if content is in TipTap JSON format
 */
export function isTipTapContent(content: string): boolean {
  if (!content) return false
  
  try {
    const parsed = JSON.parse(content)
    return parsed.type === 'doc' && Array.isArray(parsed.content)
  } catch (e) {
    return false
  }
}

/**
 * Database migration helpers
 */
export const migrationQueries = {
  // Course descriptions
  migrateCoursesDescriptions: `
    UPDATE "Course" 
    SET description = $1 
    WHERE id = $2 AND description IS NOT NULL AND description != ''
  `,
  
  // Section descriptions  
  migrateSectionsDescriptions: `
    UPDATE "Section" 
    SET description = $1 
    WHERE id = $2 AND description IS NOT NULL AND description != ''
  `,
  
  // Lesson content and descriptions
  migrateLessonsContent: `
    UPDATE "Lesson" 
    SET content = $1, description = $2 
    WHERE id = $3 AND (content IS NOT NULL OR description IS NOT NULL)
  `,
  
  // Get all courses with plain text descriptions
  getCoursesWithPlainText: `
    SELECT id, description, "shortDescription" 
    FROM "Course" 
    WHERE description IS NOT NULL AND description != ''
  `,
  
  // Get all sections with plain text descriptions
  getSectionsWithPlainText: `
    SELECT id, description 
    FROM "Section" 
    WHERE description IS NOT NULL AND description != ''
  `,
  
  // Get all lessons with plain text content
  getLessonsWithPlainText: `
    SELECT id, content, description 
    FROM "Lesson" 
    WHERE content IS NOT NULL OR description IS NOT NULL
  `
}

/**
 * Example usage for migration:
 * 
 * import { convertPlainTextToTipTap, convertMarkdownToTipTap } from './contentMigration'
 * 
 * // For plain text
 * const tiptapContent = convertPlainTextToTipTap("This is a paragraph.\n\nThis is another paragraph.")
 * 
 * // For markdown-like content
 * const markdownContent = `
 * # Course Overview
 * 
 * This course will teach you:
 * - JavaScript fundamentals
 * - React basics
 * - Advanced patterns
 * 
 * ## Prerequisites
 * Basic HTML knowledge
 * `
 * const tiptapFromMarkdown = convertMarkdownToTipTap(markdownContent)
 */
