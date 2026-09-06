/** Contribution Hall data — categories mirror ContributionRegistry.Category enum. */

export type ContribCategory = {
  id: number; // matches on-chain enum: 0 Code, 1 Translation, 2 Education, 3 Design, 4 Community
  emoji: string;
  name: string;
  nameEn: string;
  desc: string;
};

export const CATEGORIES: ContribCategory[] = [
  { id: 0, emoji: "💻", name: "写代码", nameEn: "Code", desc: "修 bug、做功能、写测试，让星球更坚固" },
  { id: 1, emoji: "🌐", name: "翻译", nameEn: "Translation", desc: "把课程带到更多语言的世界" },
  { id: 2, emoji: "🏫", name: "教育", nameEn: "Education", desc: "课堂设计、教学反馈、教师指南改进" },
  { id: 3, emoji: "🎨", name: "设计", nameEn: "Design", desc: "插画、动效、儿童友好的界面" },
  { id: 4, emoji: "🤝", name: "社区", nameEn: "Community", desc: "组织活动、帮助他人、传播善意" },
];

export type Leader = { rank: number; emoji: string; name: string; points: number; categoryId: number; note: string };

/** Seed data for Demo Mode. In production this comes from the backend indexer. */
export const SEED_LEADERS: Leader[] = [
  { rank: 1, emoji: "🦊", name: "狐研究员", points: 320, categoryId: 0, note: "修复了 12 个合约测试" },
  { rank: 2, emoji: "🐻", name: "熊博士", points: 280, categoryId: 2, note: "设计了 3 堂课堂课" },
  { rank: 3, emoji: "🐼", name: "熊猫老师", points: 240, categoryId: 1, note: "完成了全书英文校对" },
  { rank: 4, emoji: "🐨", name: "考拉画师", points: 190, categoryId: 3, note: "绘制了 4 张星球地图" },
  { rank: 5, emoji: "🐰", name: "兔子船长", points: 150, categoryId: 4, note: "组织了 2 场线上科普" },
  { rank: 6, emoji: "🦉", name: "猫头鹰教授", points: 120, categoryId: 2, note: "审校了教师指南" },
];

export type MyContribution = {
  id: string;
  categoryId: number;
  title: string;
  detail: string;
  submittedAt: number;
};

const STORE_KEY = "fk-contribs-v1";

export function loadMyContributions(): MyContribution[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORE_KEY) ?? "[]") as MyContribution[];
  } catch {
    return [];
  }
}

export function saveMyContribution(c: MyContribution) {
  const all = loadMyContributions();
  all.unshift(c);
  window.localStorage.setItem(STORE_KEY, JSON.stringify(all.slice(0, 50)));
}
