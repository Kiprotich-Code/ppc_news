import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create regular user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      username: 'testuser123',
      name: 'Test User',
      role: 'WRITER',
      referralCode: 'TEST123',
    },
  });

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      username: 'admin123',
      name: 'Admin User',
      role: 'ADMIN',
      referralCode: 'ADMIN123',
    },
  });

  // Create user level for test user
  await prisma.userLevel.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      level: 1,
      videosWatchedToday: 0,
    },
  });

  // Create wallet for test user
  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      balance: 1000, // Give some initial balance for testing upgrades
      earnings: 0,
      investment: 0,
      currency: 'KES',
    },
  });

  // Create sample videos
  const videos = [
    {
      title: 'Welcome to PPC News Watch & Earn',
      description: 'Learn how to earn money by watching videos on our platform.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnailUrl: 'https://i.ytimg.com/vi/YE7VzlLtp-4/maxresdefault.jpg',
      duration: 30,
      uploadedBy: admin.id,
    },
    {
      title: 'How to Maximize Your Earnings',
      description: 'Tips and tricks to earn more through our platform.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumbnailUrl: 'https://i.ytimg.com/vi/YE7VzlLtp-4/maxresdefault.jpg',
      duration: 25,
      uploadedBy: admin.id,
    },
    {
      title: 'Understanding Earning Levels',
      description: 'Learn about different earning levels and how to upgrade.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: 'https://i.ytimg.com/vi/YE7VzlLtp-4/maxresdefault.jpg',
      duration: 35,
      uploadedBy: admin.id,
    },
  ];

  for (const videoData of videos) {
    await prisma.video.upsert({
      where: { id: `video-${videos.indexOf(videoData) + 1}` },
      update: {},
      create: {
        id: `video-${videos.indexOf(videoData) + 1}`,
        ...videoData,
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('\n📧 Test Accounts:');
  console.log('User: test@example.com / password123');
  console.log('Admin: admin@example.com / password123');
  console.log('\n🎬 Sample videos created for testing');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });