# Dockerfile for Development Environment

# 1. ベースとなる公式のNode.jsイメージを選択
FROM node:20-alpine

# 2. コンテナ内の作業ディレクトリを作成・指定
WORKDIR /usr/src/app

# 3. 最初にpackage.json関連のファイルだけをコピー
COPY package*.json ./

# ★★★★★ ここが重要 ★★★★★
# npm install の前に prisma ディレクトリをコピーする
COPY prisma ./prisma

# 4. 開発用のものも含め、すべての依存パッケージをインストール
# (この時点で prisma generate が成功する)
RUN npm install
RUN npx prisma generate
# 5. アプリケーションのコードをコピー
COPY . .

# 6. アプリケーションが使うポートを公開
EXPOSE 3000

# 7. デフォルトのコマンド
CMD [ "npm", "run", "dev" ]
