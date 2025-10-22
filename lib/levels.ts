export interface EarningLevel {
  level: number;
  name: string;
  videosPerDay: number;
  earningsPerVideo: number;
  totalDailyEarnings: number;
  activationFee: number;
}

export const EARNING_LEVELS: EarningLevel[] = [
  {
    level: 1,
    name: "Free Starter",
    videosPerDay: 5,
    earningsPerVideo: 2,
    totalDailyEarnings: 10,
    activationFee: 0,
  },
  {
    level: 2,
    name: "Premium Level 2",
    videosPerDay: 5,
    earningsPerVideo: 4,
    totalDailyEarnings: 20,
    activationFee: 500,
  },
  {
    level: 3,
    name: "Premium Level 3",
    videosPerDay: 5,
    earningsPerVideo: 8,
    totalDailyEarnings: 40,
    activationFee: 1000,
  },
  {
    level: 4,
    name: "Premium Level 4",
    videosPerDay: 5,
    earningsPerVideo: 20,
    totalDailyEarnings: 100,
    activationFee: 2800,
  },
  {
    level: 5,
    name: "Premium Level 5",
    videosPerDay: 5,
    earningsPerVideo: 30,
    totalDailyEarnings: 150,
    activationFee: 6800,
  },
];

export function getLevelByNumber(level: number): EarningLevel | undefined {
  return EARNING_LEVELS.find(l => l.level === level);
}

export function getNextLevel(currentLevel: number): EarningLevel | undefined {
  return EARNING_LEVELS.find(l => l.level === currentLevel + 1);
}

export function canUpgradeToLevel(currentLevel: number, targetLevel: number): boolean {
  return targetLevel > currentLevel && targetLevel <= 5;
}

export function getLevelEarnings(level: number): number {
  const levelData = getLevelByNumber(level);
  return levelData ? levelData.earningsPerVideo : 0;
}

export function getLevelVideosPerDay(level: number): number {
  const levelData = getLevelByNumber(level);
  return levelData ? levelData.videosPerDay : 5;
}