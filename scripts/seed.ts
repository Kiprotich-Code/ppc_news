import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ppcnews.com' },
    update: {},
    create: {
      email: 'admin@ppcnews.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN'
    }
  })

  // Create sample writer
  const writerPassword = await bcrypt.hash('writer123', 12)
  
  const writer = await prisma.user.upsert({
    where: { email: 'writer@ppcnews.com' },
    update: {},
    create: {
      email: 'writer@ppcnews.com',
      password: writerPassword,
      name: 'Sample Writer',
      role: 'WRITER'
    }
  })

  // Create sample articles
  const articles = await Promise.all([
    prisma.article.upsert({
      where: { id: 'sample-1' },
      update: {},
      create: {
        id: 'sample-1',
        title: 'Getting Started with Next.js',
        content: 'Next.js is a powerful React framework that makes building full-stack web applications simple and efficient...',
        authorId: writer.id,
        status: 'APPROVED',
        publishedAt: new Date()
      }
    }),
    prisma.article.upsert({
      where: { id: 'sample-2' },
      update: {},
      create: {
        id: 'sample-2',
        title: 'The Future of Web Development',
        content: 'Web development is constantly evolving with new technologies and frameworks emerging every day...',
        authorId: writer.id,
        status: 'PENDING'
      }
    })
  ])

  // Create sample views and earnings
  await Promise.all([
    prisma.view.createMany({
      data: Array.from({ length: 25 }, () => ({
        articleId: 'sample-1',
        ipAddress: '127.0.0.1'
      }))
    }),
    prisma.earning.createMany({
      data: Array.from({ length: 25 }, () => ({
        articleId: 'sample-1',
        userId: writer.id,
        amount: 0.01,
        rate: 0.01
      }))
    })
  ])

  console.log('Seed data created successfully!')
  console.log('Admin credentials: admin@ppcnews.com / admin123')
  console.log('Writer credentials: writer@ppcnews.com / writer123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 