# 鉄板焼き居酒屋なかまる - Vercelデプロイ手順

## ✅ GitHubプッシュ完了

コードがGitHubにアップロードされました！
**リポジトリURL**: https://github.com/kazunarihonda83-jpg/order-management-system-nakamaru

---

## 🚀 Vercelへのデプロイ（2つの方法）

### 方法1: ワンクリックデプロイ（最も簡単）

以下のリンクをクリックするだけでデプロイできます：

**👉 [ワンクリックデプロイ](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fkazunarihonda83-jpg%2Forder-management-system-nakamaru&env=NODE_ENV,JWT_SECRET,VERCEL&envDescription=Required%20environment%20variables%20for%20deployment)**

または直接URLにアクセス：
```
https://vercel.com/new/clone?repository-url=https://github.com/kazunarihonda83-jpg/order-management-system-nakamaru
```

#### 環境変数の設定

デプロイ画面で以下の環境変数を入力してください：

| 変数名 | 値 |
|--------|-----|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | `nakamaru-secret-key-2025-production-secure` |
| `VERCEL` | `1` |

入力後、**「Deploy」**ボタンをクリック！

---

### 方法2: 手動デプロイ

1. **https://vercel.com/new** にアクセス
2. GitHubアカウントでログイン
3. **「Import Git Repository」**をクリック
4. **order-management-system-nakamaru** を選択
5. **「Import」**をクリック
6. 環境変数を設定（上記の表と同じ）
7. **「Deploy」**をクリック

---

## 📋 デプロイ完了後の確認

### 1. デプロイURL

デプロイが完了すると、以下のようなURLが発行されます：
```
https://order-management-system-nakamaru.vercel.app
```

### 2. ログイン

- **ユーザー名**: `鉄板焼き居酒屋なかまる`
- **パスワード**: `admin123`

### 3. 動作確認

✅ ログインできる  
✅ ダッシュボードが表示される  
✅ 在庫管理ページにアクセスできる  
✅ 仕入先が4社表示される  
✅ 在庫が16品目表示される  

---

## 🏢 システム情報

### 会社情報
- **会社名**: 鉄板焼き居酒屋なかまる
- **住所**: 神奈川県相模原市中央区横山台2-9-8コーポ栗山103
- **電話**: 042-704-9657
- **従業員数**: 4人

### 仕入先（4社）
1. 相模原精肉センター（牛肉・豚肉・鶏肉）
2. 神奈川鮮魚市場（エビ・イカ・ホタテ・タコ）
3. 横山台青果（キャベツ・もやし・ニンニク・玉ねぎ）
4. 相模原酒類販売（ビール・日本酒・焼酎）

### 在庫品目（16品目）

**牛肉**
- サーロインステーキ
- リブロース
- カルビ
- 牛タン

**シーフード**
- エビ（大）
- イカ
- ホタテ
- タコ

**野菜**
- キャベツ
- もやし
- ニンニク
- 玉ねぎ

**ソース・調味料**
- お好み焼きソース
- 焼肉のタレ
- 塩コショウ
- サラダ油

---

## 📊 機能一覧

- ✅ ダッシュボード（売上・費用・利益の可視化）
- ✅ 顧客管理
- ✅ 伝票管理（見積書・納品書・請求書）
- ✅ 仕入先管理（銀行情報含む）
- ✅ 発注管理
- ✅ **在庫管理**
  - 在庫の登録・編集・削除
  - 入庫・出庫・在庫調整
  - 在庫不足アラート
  - 賞味期限アラート
  - カテゴリ・仕入先別フィルター
  - 在庫統計
- ✅ 会計管理（仕訳・試算表・損益計算書・貸借対照表）
- ✅ CSVエクスポート

---

## ⚠️ 注意事項

### データベースについて

現在、SQLiteを使用していますが、Vercelの`/tmp`ディレクトリは一時的です。
再デプロイやサーバー再起動でデータが消失します。

### 本番運用には永続化データベースを推奨

- **Vercel Postgres**（推奨）
- **Supabase**
- **PlanetScale**
- **Neon**

### セキュリティ

- 本番環境では管理者パスワードを変更してください
- `JWT_SECRET`は強力なランダム文字列に変更してください

---

## 🔄 更新方法

コードを更新した場合：

```bash
cd /home/user/webapp/order-management-system-nakamaru
git add -A
git commit -m "更新内容"
git push origin master
```

GitHubにプッシュすると、Vercelが**自動的に再デプロイ**します！

---

## 📞 サポート

システムに関するお問い合わせは、開発元までご連絡ください。

---

**作成日**: 2026-01-20  
**バージョン**: 1.0.0  
**対応会社**: 鉄板焼き居酒屋なかまる

---

## 🎉 完了！

デプロイが完了したら、発行されたURLをブックマークして、
日々の業務でご活用ください！
