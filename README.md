## my-rss-dashboard

AIニュースを可視化する Next.js ダッシュボードです。Supabase に保存された記事を取得し、翻訳済みタイトル/要約、Gemini の考察・用語解説、ブックマークを表示します。

### セットアップ
```bash
npm install
npm run dev
# http://localhost:3000
```

必要な環境変数 (.env.local):
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 主な画面
- Home: 直近 3 日の記事を日付タブ＋ソース優先度でソートし表示。モーダルで考察/用語解説を参照。
- Bookmarks: ブックマーク済み記事の一覧と解除操作。

### 参考ドキュメント
- 全体概要: [../docs/overview.md](../docs/overview.md)
- フロント手順: [../docs/setup-frontend.md](../docs/setup-frontend.md)
- データモデル: [../docs/data-model.md](../docs/data-model.md)
