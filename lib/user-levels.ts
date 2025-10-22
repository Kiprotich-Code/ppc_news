import { PrismaClient } from '@prisma/client';
import { getLevelVideosPerDay } from './levels';

const prisma = new PrismaClient();

export async function getOrCreateUserLevel(userId: string) {
  let userLevel = await prisma.userLevel.findUnique({
    where: { userId }
  });

  if (!userLevel) {
    userLevel = await prisma.userLevel.create({
      data: { userId }
    });
  }

  return userLevel;
}

export async function getUserCurrentLevel(userId: string) {
  const userLevel = await getOrCreateUserLevel(userId);
  return userLevel.level;
}

export async function canUserWatchVideoToday(userId: string): Promise<boolean> {
  const userLevel = await getOrCreateUserLevel(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Reset counter if it's a new day
  if (!userLevel.lastWatchDate || userLevel.lastWatchDate < today) {
    await prisma.userLevel.update({
      where: { userId },
      data: {
        videosWatchedToday: 0,
        lastWatchDate: today
      }
    });
    return true;
  }

  const maxVideos = getLevelVideosPerDay(userLevel.level);
  return userLevel.videosWatchedToday < maxVideos;
}

export async function incrementUserWatchCount(userId: string) {
  const userLevel = await getOrCreateUserLevel(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Reset counter if it's a new day
  if (!userLevel.lastWatchDate || userLevel.lastWatchDate < today) {
    await prisma.userLevel.update({
      where: { userId },
      data: {
        videosWatchedToday: 1,
        lastWatchDate: today
      }
    });
  } else {
    await prisma.userLevel.update({
      where: { userId },
      data: {
        videosWatchedToday: userLevel.videosWatchedToday + 1
      }
    });
  }
}

export async function upgradeUserLevel(userId: string, newLevel: number) {
  await prisma.userLevel.update({
    where: { userId },
    data: { level: newLevel }
  });
}

export async function getUserLevelStats(userId: string) {
  const userLevel = await getOrCreateUserLevel(userId);
  const maxVideos = getLevelVideosPerDay(userLevel.level);

  return {
    currentLevel: userLevel.level,
    videosWatchedToday: userLevel.videosWatchedToday,
    maxVideosPerDay: maxVideos,
    canWatchMore: userLevel.videosWatchedToday < maxVideos
  };
}