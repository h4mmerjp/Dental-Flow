# Requirements Document

## Introduction

歯科ワークフローアプリケーションの患者管理機能を実装します。この機能により、認証済みユーザーがFirebase/Firestoreと連携して患者情報の一覧表示と新規追加を行うことができます。Reactのベストプラクティスに従い、カスタムフック、コンポーネント分割を活用した保守性の高いWebアプリケーションを構築します。

## Requirements

### Requirement 1

**User Story:** As a 歯科医院のスタッフ, I want 患者一覧を表示する機能, so that 登録されている患者の情報を素早く確認できる

#### Acceptance Criteria

1. WHEN ユーザーがログイン後に患者一覧ページにアクセス THEN システム SHALL Firestoreから患者データを取得して表示する
2. WHEN 患者データの取得中 THEN システム SHALL ローディング状態を表示する
3. WHEN 患者データの取得に失敗 THEN システム SHALL エラーメッセージを表示する
4. WHEN 患者一覧が表示される THEN システム SHALL 患者ID、氏名、生年月日（年齢）、最終来院日を含むテーブル形式で表示する
5. WHEN 患者一覧が表示される THEN システム SHALL 患者IDの昇順でソートして表示する

### Requirement 2

**User Story:** As a 歯科医院のスタッフ, I want 患者を検索する機能, so that 多数の患者の中から特定の患者を素早く見つけることができる

#### Acceptance Criteria

1. WHEN ユーザーが検索ボックスに文字を入力 THEN システム SHALL 氏名または患者IDに部分一致する患者のみを表示する
2. WHEN 検索条件に一致する患者がいない THEN システム SHALL 空のテーブルを表示する
3. WHEN 検索ボックスが空 THEN システム SHALL 全ての患者を表示する

### Requirement 3

**User Story:** As a 歯科医院のスタッフ, I want 新規患者を追加する機能, so that 新しく来院した患者の情報を登録できる

#### Acceptance Criteria

1. WHEN ユーザーが「新規患者を追加」ボタンをクリック THEN システム SHALL 患者追加用のモーダルダイアログを表示する
2. WHEN ユーザーがモーダル内で患者情報を入力して送信 THEN システム SHALL 入力データをFirestoreに保存する
3. WHEN 患者情報の保存が成功 THEN システム SHALL モーダルを閉じて患者一覧を更新する
4. WHEN 必須項目が未入力で送信 THEN システム SHALL エラーメッセージを表示して送信を阻止する
5. WHEN 患者情報の保存に失敗 THEN システム SHALL エラーメッセージを表示する

### Requirement 4

**User Story:** As a 歯科医院のスタッフ, I want 認証機能とヘッダー表示, so that セキュアにアプリケーションを利用できる

#### Acceptance Criteria

1. WHEN ユーザーがアプリケーションにアクセス THEN システム SHALL Firebase Authenticationによる認証を要求する
2. WHEN 認証済みユーザーがページを表示 THEN システム SHALL ヘッダーにユーザー名またはメールアドレスを表示する
3. WHEN ユーザーがログアウトボタンをクリック THEN システム SHALL 確認ダイアログを表示する
4. WHEN ユーザーがログアウトを確認 THEN システム SHALL Firebase Authからサインアウトする

### Requirement 5

**User Story:** As a 開発者, I want 型安全性とコード品質, so that 保守性の高いアプリケーションを構築できる

#### Acceptance Criteria

1. WHEN 患者データを扱う THEN システム SHALL TypeScriptの型定義を使用する
2. WHEN コンポーネントを作成する THEN システム SHALL 責任を分離した再利用可能なコンポーネント構造にする
3. WHEN Firestoreとの通信を行う THEN システム SHALL カスタムフックでロジックをカプセル化する
4. WHEN UIを実装する THEN システム SHALL Tailwind CSSとLucide Reactアイコンを使用する
5. WHEN エラーが発生する THEN システム SHALL 適切なエラーハンドリングとユーザーフィードバックを提供する