# 谁动了生产环境

浏览器单人版，定位为：

- 1 名真人玩家
- 7 名 AI 同事
- 程序员事故推理 / 狼人杀混合玩法

## 当前完成度

这一版已经封装成可单人完整游玩的一局：

- 随机职业与隐藏阵营分配
- 8 人固定局，1 人类 + 7 AI
- 5 类故障、回合制行动、会议与投票
- 3 种轻量小游戏影响做任务和修复收益
- AI 自动行动、发言、投票与甩锅
- 胜负结算、事故回放、身份揭示

## 运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

交付打包：

```bash
npm run release
```

会生成：

- `release/who-touched-production-singleplayer/`
- `release/who-touched-production-singleplayer.zip`

桌面版封装：

```bash
npm run desktop:pack
```

会生成：

- `desktop-dist/`
- `release/desktop/`

## 目录

- `src/App.tsx`：主界面与单局交互
- `src/game.ts`：状态机、AI 行为、会议投票、胜负逻辑
- `src/types.ts`：核心类型定义
- `src/styles.css`：界面样式

## 本版收口点

- 技能现在有明确冷却约束
- 修复动作会绑定到目标故障所在房间
- 小游戏模式会正确进入结算回放
- 已适合作为比赛展示用的单人可玩版本
- 已支持一键生成可直接分发的静态交付包
- 已补桌面版封装入口，可进一步输出 Windows 可执行包
