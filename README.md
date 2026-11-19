# 培楠教育小遊戲

託管於 **peinanfoundation** GitHub Pages（不經 Vercel）。

## 遊玩

- 選單：https://peinanfoundation.github.io/peinan-games/hub.html
- 釣魚：https://peinanfoundation.github.io/peinan-games/
- 記憶烹飪：https://peinanfoundation.github.io/peinan-games/?game=cooking

## 本機開發

```bash
npm install
npm run server   # 記憶烹飪連線對戰（ws://127.0.0.1:5175）
npm run dev
```

## 連線對戰

記憶烹飪已改為 **PeerJS 房間碼對戰**（純前端，不必另開伺服器）：

1. 玩家 A：連線對戰 → 建立房間 → 把 6 位房間碼給對手
2. 玩家 B：連線對戰 → 輸入房間碼 → 加入房間
3. 配對成功後自動開始

（本機仍可用 `npm run server` 跑舊的 WebSocket 伺服器作開發，正式站不需要。）
