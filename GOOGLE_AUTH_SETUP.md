# Google認証の設定手順

## Firebase Console設定

1. **Firebase Console**にアクセス: https://console.firebase.google.com/
2. **プロジェクト選択**: `dental-flow-9535e`
3. **Authentication設定**:
   - 左サイドバーから「Authentication」を選択
   - 「Sign-in method」タブをクリック
   - 「Google」を選択
   - 「有効にする」をオンにする
   - プロジェクトのサポートメールを設定
   - 「保存」をクリック

## 必要な設定項目

### 1. Google認証の有効化
- Authentication > Sign-in method > Google > 有効化

### 2. 承認済みドメインの設定
- Authentication > Settings > 承認済みドメイン
- `localhost` が含まれていることを確認

### 3. Firestore Database設定
- Firestore Database > データベース作成
- テストモードで開始（セキュリティルールは後で設定）

## セキュリティルール（推奨）

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /patients/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 使用方法

1. ブラウザで http://localhost:3002 にアクセス
2. 「Googleでログイン」ボタンをクリック
3. Googleアカウントでログイン
4. 患者管理システムが利用可能になります

## トラブルシューティング

- **Google認証エラー**: Firebase ConsoleでGoogle認証が有効になっているか確認
- **承認エラー**: 承認済みドメインにlocalhostが含まれているか確認
- **Firestoreエラー**: Firestoreデータベースが作成されているか確認