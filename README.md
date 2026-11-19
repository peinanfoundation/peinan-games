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

記憶烹飪對戰需要 WebSocket 伺服器（GitHub Pages 無法承載）。

1. 部署本 repo 的 `server/matchServer.ts`（可用 Render 的 `render.yaml`）
2. 在 GitHub repo Secrets 設定 `MATCH_WS_URL`，例如 `wss://your-match-host`
3. 重新跑 Pages workflow 建置前端
