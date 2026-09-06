# Contributing to Future Kids · 参与贡献

Thanks for helping build digital-civilization education for children! 🌍

感谢你为全球儿童的数字文明教育出力！

## The non-negotiables / 不可逾越的红线

1. **No financialization.** No tokens, no tradable NFTs, no speculation.
   Soulbound stays soulbound. 禁止任何金融化设计。
2. **No personal data.** Never add a field that could hold a real name, photo,
   birthday, or school of a child — in contracts, metadata, or backend.
   任何组件都不得收集儿童真实个人信息。
3. **Learning over testing.** Quizzes must stay forgiving (retry until correct).
   No leaderboards based on speed. 学习优先，不做排名。

## How to contribute / 如何贡献

```bash
git fork + clone
cd frontend && npm install && npm run dev     # see the journey first
cd ../contracts && npm install && npm run verify:local
```

- **Translations** — docs and UI. (Record them in `ContributionRegistry`, category 1.)
- **New chapter worlds** — follow the `Chapter` type in `frontend/lib/chapters.ts`.
- **Contracts** — every change needs a Foundry test + green `verify:local`.
- **Accessibility** — keyboard navigation, screen-reader labels, contrast.

Every PR must: pass CI, keep the privacy red-lines, and include one sentence a
10-year-old could understand about what it changes.

MIT © Future Kids Contributors
