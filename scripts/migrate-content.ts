/**
 * Content Migration Script for TipTap Implementation
 * 
 * This script migrates existing plain text content in courses, sections, and lessons
 * to TipTap JSON format.
 * 
 * Usage:
 * 1. Run this script in a Node.js environment with database access
 * 2. Or use the provided functions individually in your admin panel
 * 
 * IMPORTANT: Always backup your database before running migration!
 */

import { PrismaClient } from '@prisma/client'
import { 
  convertPlainTextToTipTap, 
  convertMarkdownToTipTap,
  isTipTapContent 
} from '../lib/contentMigration'

const prisma = new PrismaClient()

interface MigrationStats {
  coursesUpdated: number
  sectionsUpdated: number
  lessonsUpdated: number
  errors: string[]
}

/**
 * Migrate all course descriptions to TipTap format
 */
export async function migrateCourseDescriptions(): Promise<number> {
  console.log('🔄 Starting course description migration...')
  
  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { description: { not: null } },
        { shortDescription: { not: null } }
      ]
    },
    select: {
      id: true,
      description: true,
      shortDescription: true
    }
  })

  let updated = 0

  for (const course of courses) {
    try {
      const updates: any = {}

      // Migrate description
      if (course.description && !isTipTapContent(course.description)) {
        const tiptapContent = isLikelyMarkdown(course.description) 
          ? convertMarkdownToTipTap(course.description)
          : convertPlainTextToTipTap(course.description)
        updates.description = tiptapContent
      }

      // Migrate short description
      if (course.shortDescription && !isTipTapContent(course.shortDescription)) {
        const tiptapContent = convertPlainTextToTipTap(course.shortDescription)
        updates.shortDescription = tiptapContent
      }

      if (Object.keys(updates).length > 0) {
        await prisma.course.update({
          where: { id: course.id },
          data: updates
        })
        updated++
        console.log(`✅ Updated course: ${course.id}`)
      }
    } catch (error) {
      console.error(`❌ Error updating course ${course.id}:`, error)
    }
  }

  console.log(`📊 Course migration complete: ${updated}/${courses.length} updated`)
  return updated
}

/**
 * Migrate all section descriptions to TipTap format
 */
export async function migrateSectionDescriptions(): Promise<number> {
  console.log('🔄 Starting section description migration...')
  
  const sections = await prisma.courseSection.findMany({
    where: {
      description: { not: null }
    },
    select: {
      id: true,
      description: true
    }
  })

  let updated = 0

  for (const section of sections) {
    try {
      if (section.description && !isTipTapContent(section.description)) {
        const tiptapContent = isLikelyMarkdown(section.description)
          ? convertMarkdownToTipTap(section.description)
          : convertPlainTextToTipTap(section.description)

        await prisma.courseSection.update({
          where: { id: section.id },
          data: { description: tiptapContent }
        })
        updated++
        console.log(`✅ Updated section: ${section.id}`)
      }
    } catch (error) {
      console.error(`❌ Error updating section ${section.id}:`, error)
    }
  }

  console.log(`📊 Section migration complete: ${updated}/${sections.length} updated`)
  return updated
}

/**
 * Migrate all lesson content and descriptions to TipTap format
 */
export async function migrateLessonContent(): Promise<number> {
  console.log('🔄 Starting lesson content migration...')
  
  const lessons = await prisma.lesson.findMany({
    where: {
      OR: [
        { content: { not: null } },
        { description: { not: null } }
      ]
    },
    select: {
      id: true,
      content: true,
      description: true,
      type: true
    }
  })

  let updated = 0

  for (const lesson of lessons) {
    try {
      const updates: any = {}

      // Migrate lesson content (only for ARTICLE type)
      if (lesson.type === 'ARTICLE' && lesson.content && !isTipTapContent(lesson.content)) {
        const tiptapContent = isLikelyMarkdown(lesson.content)
          ? convertMarkdownToTipTap(lesson.content)
          : convertPlainTextToTipTap(lesson.content)
        updates.content = tiptapContent
      }

      // Migrate lesson description
      if (lesson.description && !isTipTapContent(lesson.description)) {
        const tiptapContent = isLikelyMarkdown(lesson.description)
          ? convertMarkdownToTipTap(lesson.description)
          : convertPlainTextToTipTap(lesson.description)
        updates.description = tiptapContent
      }

      if (Object.keys(updates).length > 0) {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: updates
        })
        updated++
        console.log(`✅ Updated lesson: ${lesson.id}`)
      }
    } catch (error) {
      console.error(`❌ Error updating lesson ${lesson.id}:`, error)
    }
  }

  console.log(`📊 Lesson migration complete: ${updated}/${lessons.length} updated`)
  return updated
}

/**
 * Run complete migration for all content types
 */
export async function runFullMigration(): Promise<MigrationStats> {
  console.log('🚀 Starting full content migration to TipTap format...')
  console.log('⚠️  Make sure you have backed up your database!')
  
  const stats: MigrationStats = {
    coursesUpdated: 0,
    sectionsUpdated: 0,
    lessonsUpdated: 0,
    errors: []
  }

  try {
    // Migrate courses
    stats.coursesUpdated = await migrateCourseDescriptions()
    
    // Migrate sections
    stats.sectionsUpdated = await migrateSectionDescriptions()
    
    // Migrate lessons
    stats.lessonsUpdated = await migrateLessonContent()
    
    console.log('\n🎉 Migration completed successfully!')
    console.log('📊 Final Stats:')
    console.log(`   - Courses updated: ${stats.coursesUpdated}`)
    console.log(`   - Sections updated: ${stats.sectionsUpdated}`)
    console.log(`   - Lessons updated: ${stats.lessonsUpdated}`)
    
  } catch (error) {
    console.error('💥 Migration failed:', error)
    stats.errors.push(error instanceof Error ? error.message : String(error))
  } finally {
    await prisma.$disconnect()
  }

  return stats
}

/**
 * Dry run - analyze content without making changes
 */
export async function analyzeMigrationNeeds(): Promise<{
  courses: number
  sections: number
  lessons: number
  totalItems: number
}> {
  console.log('🔍 Analyzing content migration needs...')

  const coursesNeedingMigration = await prisma.course.count({
    where: {
      OR: [
        { 
          description: { 
            not: null,
            notIn: ['', '{"type":"doc","content":[]}'] 
          }
        },
        { 
          shortDescription: { 
            not: null,
            notIn: ['', '{"type":"doc","content":[]}'] 
          }
        }
      ]
    }
  })

  const sectionsNeedingMigration = await prisma.courseSection.count({
    where: {
      description: {
        not: null,
        notIn: ['', '{"type":"doc","content":[]}']
      }
    }
  })

  const lessonsNeedingMigration = await prisma.lesson.count({
    where: {
      OR: [
        {
          content: {
            not: null,
            notIn: ['', '{"type":"doc","content":[]}']
          }
        },
        {
          description: {
            not: null,
            notIn: ['', '{"type":"doc","content":[]}']
          }
        }
      ]
    }
  })

  const total = coursesNeedingMigration + sectionsNeedingMigration + lessonsNeedingMigration

  console.log('📊 Analysis Results:')
  console.log(`   - Courses needing migration: ${coursesNeedingMigration}`)
  console.log(`   - Sections needing migration: ${sectionsNeedingMigration}`)
  console.log(`   - Lessons needing migration: ${lessonsNeedingMigration}`)
  console.log(`   - Total items: ${total}`)

  await prisma.$disconnect()

  return {
    courses: coursesNeedingMigration,
    sections: sectionsNeedingMigration,
    lessons: lessonsNeedingMigration,
    totalItems: total
  }
}

/**
 * Helper function to detect if content is likely markdown
 */
function isLikelyMarkdown(content: string): boolean {
  if (!content) return false
  
  const markdownIndicators = [
    /^#{1,6}\s/m,     // Headers
    /^\*\s/m,         // Bullet points with *
    /^-\s/m,          // Bullet points with -
    /^\d+\.\s/m,      // Numbered lists
    /\*\*.*\*\*/,     // Bold text
    /\*.*\*/,         // Italic text
    /\[.*\]\(.*\)/,   // Links
  ]
  
  return markdownIndicators.some(pattern => pattern.test(content))
}

// CLI Usage Example
if (require.main === module) {
  const command = process.argv[2]
  
  switch (command) {
    case 'analyze':
      analyzeMigrationNeeds()
      break
    case 'migrate':
      runFullMigration()
      break
    case 'courses':
      migrateCourseDescriptions()
      break
    case 'sections':
      migrateSectionDescriptions()
      break
    case 'lessons':
      migrateLessonContent()
      break
    default:
      console.log('Usage:')
      console.log('  npm run migrate analyze   - Analyze migration needs')
      console.log('  npm run migrate migrate   - Run full migration')
      console.log('  npm run migrate courses   - Migrate only courses')
      console.log('  npm run migrate sections  - Migrate only sections')
      console.log('  npm run migrate lessons   - Migrate only lessons')
  }
}
