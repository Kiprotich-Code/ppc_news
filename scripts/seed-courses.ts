import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function seedCourseData() {
  try {
    console.log("Creating course categories...")

    // Create categories
    const categories = await Promise.all([
      prisma.courseCategory.create({
        data: {
          name: "Digital Marketing",
          description: "Learn digital marketing strategies and tactics",
          slug: "digital-marketing"
        }
      }),
      prisma.courseCategory.create({
        data: {
          name: "Web Development",
          description: "Build modern web applications",
          slug: "web-development"
        }
      }),
      prisma.courseCategory.create({
        data: {
          name: "Business & Finance",
          description: "Master business and financial concepts",
          slug: "business-finance"
        }
      }),
      prisma.courseCategory.create({
        data: {
          name: "Personal Development",
          description: "Improve your personal and professional skills",
          slug: "personal-development"
        }
      })
    ])

    console.log("Created categories:", categories.map(c => c.name))

    // Create sample courses
    const sampleCourse = await prisma.course.create({
      data: {
        title: "Complete Digital Marketing Mastery",
        description: "Master digital marketing from fundamentals to advanced strategies. Learn SEO, social media marketing, content marketing, PPC advertising, email marketing, and analytics.",
        shortDescription: "Learn digital marketing from beginner to expert level with practical hands-on projects.",
        categoryId: categories[0].id,
        price: 4999,
        isFree: false,
        isPremium: true,
        difficulty: "BEGINNER",
        duration: "8 weeks",
        instructor: "John Doe",
        slug: "complete-digital-marketing-mastery",
        tags: JSON.stringify(["SEO", "Social Media", "PPC", "Email Marketing", "Analytics"]),
        requirements: JSON.stringify([
          "Basic computer skills",
          "Access to internet",
          "Willingness to learn"
        ]),
        whatYouWillLearn: JSON.stringify([
          "Master SEO fundamentals and advanced techniques",
          "Create effective social media marketing campaigns",
          "Set up and manage PPC advertising campaigns",
          "Build email marketing funnels",
          "Analyze marketing data and make data-driven decisions"
        ])
      }
    })

    console.log("Created sample course:", sampleCourse.title)

    // Create sections for the course
    const sections = await Promise.all([
      prisma.courseSection.create({
        data: {
          title: "Introduction to Digital Marketing",
          description: "Get started with digital marketing fundamentals",
          courseId: sampleCourse.id,
          orderIndex: 0,
          isPublished: true
        }
      }),
      prisma.courseSection.create({
        data: {
          title: "Search Engine Optimization (SEO)",
          description: "Learn how to optimize websites for search engines",
          courseId: sampleCourse.id,
          orderIndex: 1,
          isPublished: true
        }
      }),
      prisma.courseSection.create({
        data: {
          title: "Social Media Marketing",
          description: "Master social media platforms for business growth",
          courseId: sampleCourse.id,
          orderIndex: 2,
          isPublished: false
        }
      })
    ])

    console.log("Created sections:", sections.map(s => s.title))

    // Create some lessons
    const lessons = await Promise.all([
      prisma.lesson.create({
        data: {
          title: "What is Digital Marketing?",
          description: "Introduction to digital marketing concepts and channels",
          content: "Digital marketing encompasses all marketing efforts that use an electronic device or the internet...",
          type: "ARTICLE",
          sectionId: sections[0].id,
          orderIndex: 0,
          isFreePreview: true,
          isPublished: true
        }
      }),
      prisma.lesson.create({
        data: {
          title: "Digital Marketing Strategy",
          description: "Learn how to create a comprehensive digital marketing strategy",
          videoUrl: "https://www.youtube.com/watch?v=example",
          type: "VIDEO",
          duration: 1800, // 30 minutes
          sectionId: sections[0].id,
          orderIndex: 1,
          isFreePreview: false,
          isPublished: true
        }
      }),
      prisma.lesson.create({
        data: {
          title: "SEO Fundamentals",
          description: "Understanding search engine optimization basics",
          content: "SEO is the practice of increasing the quantity and quality of traffic to your website...",
          type: "ARTICLE",
          sectionId: sections[1].id,
          orderIndex: 0,
          isFreePreview: true,
          isPublished: true
        }
      })
    ])

    console.log("Created lessons:", lessons.map(l => l.title))

    console.log("✅ Course data seeded successfully!")

  } catch (error) {
    console.error("Error seeding course data:", error)
  } finally {
    await prisma.$disconnect()
  }
}

seedCourseData()
