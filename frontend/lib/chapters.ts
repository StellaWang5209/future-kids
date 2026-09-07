"use client";

export type QuizQuestion = {
  q: string;
  options: string[];
  correct: number;
  explain: string;
};

export type Chapter = {
  id: number; // 1..5 — matches on-chain chapterId
  badgeType: number; // 0..4 — matches on-chain BadgeType
  title: string;
  titleEn: string;
  emoji: string;
  color: string;
  world: string;
  answer: string; // canonical final answer recorded on LearningProof
  answerHint: string;
  story: string[]; // shown on the planet map when opening the chapter
  quiz: QuizQuestion[];
};

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    badgeType: 0,
    title: "区块链世界 · 魔法记录本",
    titleEn: "Blockchain World · Magic Notebook",
    emoji: "📖",
    color: "#5b6cff",
    world: "Blockchain World",
    answer: "trust",
    answerHint: "提示：区块链真正的地基，是一种可以传递给陌生人的东西（英文单词）",
    story: [
      "欢迎来到未来星球的第一站：区块链世界。",
      "在这里，所有人都共用一本神奇的「魔法记录本」：每一页都记得上一页的密码指纹，谁也没法偷偷改掉旧的一页。",
      "这本本子的名字，就叫区块链（Blockchain）。",
    ],
    quiz: [
      {
        q: "为什么区块链上的旧记录很难被偷偷改掉？",
        options: [
          "因为每个区块都带着前一页的指纹，改一处，后面全部对不上",
          "因为没人知道密码",
          "因为有警察一直在看",
        ],
        correct: 0,
        explain: "每个区块都记录了上一块的哈希指纹，牵一发而动全身——这就是链的力量。",
      },
      {
        q: "一个「区块」里面装着什么？",
        options: [
          "只有小朋友的照片",
          "交易记录 + 上一块的指纹 + 时间戳",
          "天气预报",
        ],
        correct: 1,
        explain: "区块 = 一批记录 + 前一块的哈希 + 时间，像日记本的一页。",
      },
      {
        q: "是谁在帮大家记账、检查每一笔记录？",
        options: [
          "一位无所不能的机器人",
          "只有发明者本人",
          "全网成千上万个节点一起验证",
        ],
        correct: 2,
        explain: "没有老板！全网节点人手一份完整副本，一起验证——这叫「去中心化」。",
      },
    ],
  },
  {
    id: 2,
    badgeType: 1,
    title: "比特币世界 · 星星矿场",
    titleEn: "Bitcoin World · Star Mining Camp",
    emoji: "🪙",
    color: "#f7a928",
    world: "Bitcoin World",
    answer: "2100万",
    answerHint: "提示：一个写在代码里的、永远不变的数字上限（中文数字+万）",
    story: [
      "第二站：比特币世界。",
      "2008 年，一位化名「中本聪」的神秘人发明了比特币——世界上第一套不需要银行、由大家共同验证的数字货币。",
      "它的总量永远只有 2100 万枚，规则写死在代码里，连发明者也不能改。",
    ],
    quiz: [
      {
        q: "比特币的总量上限是多少？",
        options: ["2100 万枚", "2100 亿枚", "无限量"],
        correct: 0,
        explain: "2100 万枚写死在代码里——稀缺性来自规则，不来自承诺。",
      },
      {
        q: "「减半」是什么意思？",
        options: [
          "比特币的价格每次都会跌一半",
          "大约每 4 年，矿工的挖矿奖励减少一半",
          "每人只能拥有一半枚",
        ],
        correct: 1,
        explain: "奖励每约 21 万个区块（约 4 年）减半，让新币越来越少、越来越珍贵。",
      },
      {
        q: "为什么说比特币「不属于任何公司或国家」？",
        options: [
          "因为它藏在海底",
          "因为它的规则由全世界的节点共同运行和验证",
          "因为它只属于中本聪",
        ],
        correct: 1,
        explain: "成千上万个节点各自运行同一套规则，没有总部，没有开关。",
      },
    ],
  },
  {
    id: 3,
    badgeType: 2,
    title: "PoW 世界 · 算力竞技场",
    titleEn: "PoW World · Hashpower Arena",
    emoji: "⛏️",
    color: "#e5484d",
    world: "PoW World",
    answer: "proof-of-work",
    answerHint: "提示：先做最难的计算，再证明给所有人看（英文小写，带连字符）",
    story: [
      "第三站：PoW 世界——工作量证明的王国。",
      "矿工们疯狂计算一道超级难题，谁先算出答案，谁就能打包区块、赢得奖励。",
      "这让作弊贵到不可能，但也消耗很多能源——聪明的工程师一直在寻找更环保的办法。",
    ],
    quiz: [
      {
        q: "PoW 里的矿工们在做什么？",
        options: [
          "用铲子挖金币",
          "比赛计算，寻找符合规则的「幸运钥匙」(Nonce)",
          "猜猜明天天气",
        ],
        correct: 1,
        explain: "矿工不断尝试 Nonce，直到算出的哈希满足难度要求——第一个算出的打包区块。",
      },
      {
        q: "为什么说 PoW 很安全？",
        options: [
          "因为它很神秘",
          "因为想篡改历史，就要重新做比全网更多的计算，成本高到不可能",
          "因为它有超级密码",
        ],
        correct: 1,
        explain: "攻击者要付出比所有诚实矿工加起来还多的算力和电费——不划算！",
      },
      {
        q: "PoW 有什么明显的缺点？",
        options: [
          "消耗大量电力能源",
          "太容易学会",
          "不能记录交易",
        ],
        correct: 0,
        explain: "海量计算=海量电力。这也是后来出现 PoS 的重要原因。",
      },
    ],
  },
  {
    id: 4,
    badgeType: 3,
    title: "PoS 世界 · 守护者城堡",
    titleEn: "PoS World · Guardian Castle",
    emoji: "🛡️",
    color: "#30a46c",
    world: "PoS World",
    answer: "proof-of-stake",
    answerHint: "提示：用押金和工作诚信来证明自己（英文小写，带连字符）",
    story: [
      "第四站：PoS 世界——权益证明的守护者城堡。",
      "想成为守护者，要先「质押」自己的筹码作为诚信押金：诚实工作有奖励，捣乱就会被罚没。",
      "以太坊用 PoS 把能耗降低了 99.9% 以上——守护网络，也守护地球。",
    ],
    quiz: [
      {
        q: "成为 PoS 验证者需要先做什么？",
        options: [
          "购买昂贵的显卡",
          "质押一定数量的代币作为诚信押金",
          "写一份申请书",
        ],
        correct: 1,
        explain: "质押 = 把自己的筹码押上：好好干活有奖励，作弊会被罚没。",
      },
      {
        q: "如果 PoS 验证者作弊，会发生什么？",
        options: [
          "什么都不会发生",
          "被罚没押金（Slash），损失惨重",
          "得到一个警告贴纸",
        ],
        correct: 1,
        explain: "作恶的成本是真实的损失——机制让诚实成为最划算的选择。",
      },
      {
        q: "相比 PoW，PoS 最大的进步是什么？",
        options: [
          "能耗大幅降低（以太坊降低 99.9%+）",
          "记录变少了",
          "不再需要任何验证",
        ],
        correct: 0,
        explain: "不需要拼算力，靠押金+诚信守护网络，又安全又环保。",
      },
    ],
  },
  {
    id: 5,
    badgeType: 4,
    title: "以太坊世界 · 智能合约工坊",
    titleEn: "Ethereum World · Smart Contract Workshop",
    emoji: "🤖",
    color: "#6e56cf",
    world: "Ethereum World",
    answer: "smart-contract",
    answerHint: "提示：以太坊上一种「规则写死、自动执行、谁也违约不了」的程序（英文小写，带连字符）",
    story: [
      "第五站：以太坊世界——全世界小朋友共同使用的「公共计算机」。",
      "在这里，人们可以用代码写出一台神奇的「自动售货机」：投币就出货，规则公开透明，连老板都不能偷偷改价。",
      "这种装在区块链上的自动售货机，就叫做智能合约（Smart Contract）。",
    ],
    quiz: [
      {
        q: "智能合约最像生活中的什么？",
        options: [
          "一台规则写死、自动出货、没人能中途改价的自动售货机",
          "一个需要店员时刻看着的柜台",
          "一张写在纸上的口头承诺",
        ],
        correct: 0,
        explain: "智能合约 = 代码版自动售货机：条件满足就自动执行，任何人都无法单方面违约或改规则。",
      },
      {
        q: "为什么合约部署后「规则就不能被偷偷改掉」？",
        options: [
          "合约的代码和状态公开存在区块链上，任何人无法单方面篡改",
          "因为没人知道合约的地址",
          "因为写代码的人签了保密协议",
        ],
        correct: 0,
        explain: "合约存放在区块链上、全网共同验证——像魔法记录本一样，改一处，后面全部对不上。",
      },
      {
        q: "谁可以使用运行在以太坊上的 DApp（去中心化应用）？",
        options: [
          "只有以太坊的开发人员",
          "任何有一台能联网设备的人，直接就能用，没有中间商",
          "必须经过某家公司注册审核",
        ],
        correct: 1,
        explain: "以太坊是「公共的」：没有公司总部，没有开关，任何人都能直接调用上面的程序。",
      },
    ],
  },
];

export function chapterById(id: number): Chapter {
  const ch = CHAPTERS.find((c) => c.id === id);
  if (!ch) throw new Error(`unknown chapter ${id}`);
  return ch;
}

export const LEVELS = [
  { name: "种子 Seed", emoji: "🌰", min: 0 },
  { name: "新芽 Sprout", emoji: "🌱", min: 1 },
  { name: "探索者 Explorer", emoji: "🧭", min: 2 },
  { name: "建造者 Builder", emoji: "🛠️", min: 3 },
  { name: "守护者 Guardian", emoji: "🛡️", min: 4 },
];

export function levelForChapters(count: number) {
  let lv = LEVELS[0];
  for (const l of LEVELS) if (count >= l.min) lv = l;
  return lv;
}

export const BADGES = [
  { type: 0, name: "区块链探险家 Blockchain Explorer", emoji: "🧭", chapterId: 1 },
  { type: 1, name: "比特币先锋 Bitcoin Pioneer", emoji: "🪙", chapterId: 2 },
  { type: 2, name: "PoW 建造者 PoW Builder", emoji: "⛏️", chapterId: 3 },
  { type: 3, name: "PoS 守护者 PoS Guardian", emoji: "🛡️", chapterId: 4 },
  { type: 4, name: "以太坊建造者 Ethereum Builder", emoji: "🤖", chapterId: 5 },
];
