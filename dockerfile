# ベースイメージとして軽量の Node.js イメージを使用
FROM node:18-slim

# 作業ディレクトリを設定
WORKDIR /usr/src/app

# 必要なビルドツールをインストール
RUN npm install -g vsce

# アプリケーションの依存関係をインストール
COPY package*.json ./
RUN npm install

# ソースコードをコンテナにコピー
COPY . .

# 拡張機能をビルド
RUN vsce package
