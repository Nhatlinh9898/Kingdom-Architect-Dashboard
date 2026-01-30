
export interface Building {
  id: string;
  name: string;
  level: number;
  type: 'military' | 'economy' | 'tech';
  description: string;
  image: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface StoryChapter {
  title: string;
  summary: string;
  milestone: string;
}

export interface Decree {
  id: string;
  title: string;
  description: string;
  options: {
    text: string;
    alignment: 'Benevolent' | 'Conqueror';
    effect: string;
  }[];
}

export interface ResearchItem {
  id: string;
  name: string;
  cost: number;
  unlocked: boolean;
  effect: string;
  requiredAge: number;
}

export interface GameItem {
  id: string;
  name: string;
  description: string;
  rarity: 'Common' | 'Rare' | 'Legendary';
  bonusType: 'Income' | 'Power' | 'Defense';
  bonusValue: number;
  level: number;
}

export interface Unit {
  type: 'Infantry' | 'Archer' | 'Knight' | 'Villager' | 'Siege';
  count: number;
  powerPerUnit: number;
  costGold: number;
  costWood: number;
}

export interface Expedition {
  id: string;
  name: string;
  duration: number; // in seconds
  startTime: number;
  rewardType: 'Gold' | 'Artifact' | 'Stone';
  isFinished: boolean;
}

export type AgeType = 1 | 2 | 3 | 4; // 1: Dark, 2: Feudal, 3: Castle, 4: Imperial
