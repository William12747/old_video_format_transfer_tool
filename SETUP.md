# 環境設定指南

## 安裝方式選擇

### 方式 A：使用 Homebrew（推薦，較簡單）

#### 1. 安裝 Homebrew（macOS 套件管理器）

如果尚未安裝 Homebrew，請在終端機執行：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

安裝完成後，將 Homebrew 加入 PATH（終端機會顯示具體指令，通常是）：
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

#### 2. 使用 Homebrew 安裝所有工具

```bash
brew install node postgresql@16 ffmpeg
```

啟動 PostgreSQL 服務：
```bash
brew services start postgresql@16
createdb video_converter
```

驗證安裝：
```bash
node --version
npm --version
ffmpeg -version
```

---

### 方式 B：手動安裝（不使用 Homebrew）

#### 1. 安裝 Node.js

- 前往 https://nodejs.org/
- 下載並安裝 LTS 版本（macOS 安裝程式）
- 安裝完成後驗證：
```bash
node --version
npm --version
```

#### 2. 安裝 PostgreSQL

- 前往 https://www.postgresql.org/download/macosx/
- 下載 PostgreSQL 安裝程式（建議使用 Postgres.app 或官方安裝程式）
- 安裝後啟動 PostgreSQL 服務
- 建立資料庫：
```bash
createdb video_converter
```

#### 3. 安裝 FFmpeg

**選項 1：使用 MacPorts**
```bash
sudo port install ffmpeg
```

**選項 2：從源碼編譯**
- 前往 https://ffmpeg.org/download.html
- 按照說明編譯安裝

**選項 3：使用預編譯版本**
- 下載預編譯的 FFmpeg 二進位檔
- 將其加入 PATH

驗證安裝：
```bash
ffmpeg -version
```

## 5. 設定環境變數

在專案根目錄建立 `.env` 檔案：

```bash
DATABASE_URL=postgresql://localhost/video_converter
PORT=5000
```

## 6. 安裝專案依賴

```bash
npm install
```

## 7. 初始化資料庫

```bash
npm run db:push
```

## 8. 啟動開發伺服器

```bash
npm run dev
```

## 9. 開啟瀏覽器

訪問：http://localhost:5000

---

## 疑難排解

### PostgreSQL 連線問題
如果遇到連線問題，檢查 PostgreSQL 是否正在運行：
```bash
brew services list
```

### FFmpeg 找不到
確保 FFmpeg 在 PATH 中：
```bash
which ffmpeg
```

### 端口被佔用
如果 5000 端口被佔用，可以在 `.env` 中修改 `PORT` 變數。
