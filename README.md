# Engineering File Manager

Aplikasi desktop untuk mempermudah pencarian dan pengelolaan file di folder engineering.

![Electron](https://img.shields.io/badge/Electron-28.x-blue)
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)

## ✨ Fitur

### 📁 File Management
- **File Browser** - Navigasi folder dengan grid/list view
- **Browser Tabs** - Buka multiple folder dalam tabs seperti browser
- **Drag & Drop** - Pindahkan file antar folder
- **Context Menu** - Rename, delete, copy path
- **Multi-Select** - Pilih banyak file sekaligus dengan Ctrl/Shift

### 🔍 Search & Index
- **Fast Search** - Pencarian file terindeks dengan SQLite/SQL Server
- **Category Filter** - Filter file berdasarkan tipe (PDF, CAD, Image, dll)
- **Sorting** - Urutkan berdasarkan nama, tanggal, ukuran, tipe

### 👁️ Preview
- **PDF Preview** - Preview PDF dengan zoom & navigasi halaman
- **Image Preview** - Preview gambar dengan zoom & rotate
- **AutoCAD Preview** - Preview thumbnail DWG files
- **DOCX Thumbnails** - Preview konten dokumen Word

### 💾 Data Sync
- **File Comments** - Tambah notes/deskripsi per file
- **SQL Server Sync** - Sinkronisasi comments antar PC via SQL Server
- **Local SQLite** - Mode offline dengan database lokal

### 🎨 UI/UX
- ⭐ Favorites - Tandai file favorit
- 🔄 Auto-Update - Update otomatis dari server
- 🌙 Dark/Light Theme - Tema gelap dan terang
- ⌨️ Keyboard Shortcuts - Navigasi cepat dengan keyboard

## 💻 System Requirements

### Minimum Requirements
| Component | Specification |
|-----------|---------------|
| **OS** | Windows 10 (64-bit) |
| **Processor** | Intel Core i3 / AMD Ryzen 3 |
| **RAM** | 4 GB |
| **Storage** | 200 MB |
| **Display** | 1280 x 720 |

### Optional (untuk sync multi-PC)
| Component | Specification |
|-----------|---------------|
| **SQL Server** | SQL Server 2017+ / SQL Express |
| **Network** | LAN untuk akses database |

### Supported Windows Versions
- ✅ Windows 10 (64-bit) - Version 1903+
- ✅ Windows 11 (64-bit) - All versions
- ❌ Windows 7/8/8.1 - Not supported
- ❌ Windows 32-bit - Not supported

## 📦 Instalasi

### Untuk User (Production)

1. Download installer terbaru dari server
2. Jalankan `Engineering File Manager Setup x.x.x.exe`
3. Ikuti wizard instalasi
4. Aplikasi siap digunakan

### Untuk Developer

#### Prerequisites
- Node.js 18+
- npm atau yarn
- Windows 10/11

#### Clone & Install
```bash
git clone <repository-url>
cd electron-file-manager
npm install
```

#### Development
```bash
npm run dev
```

#### Build
```bash
npm run package
```
Output: `dist/Engineering File Manager Setup x.x.x.exe`

## 🔧 Konfigurasi

### SQL Server Setup (Optional)

1. Buat database `FileManagerDB`
2. Jalankan query untuk membuat login:
```sql
USE master;
CREATE LOGIN FileManagerApp WITH PASSWORD = 'YourPassword!';

USE FileManagerDB;
CREATE USER FileManagerApp FOR LOGIN FileManagerApp;
ALTER ROLE db_owner ADD MEMBER FileManagerApp;
```
3. Di Settings app, pilih "SQL Server" dan test connection

### Update Server URL
Edit `package.json`:
```json
"publish": {
  "provider": "generic",
  "url": "https://your-server.com/updates/"
}
```

## 📁 Struktur Project

```
electron-file-manager/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # Entry point
│   │   └── services/   # File, DB, Search, SQL Server services
│   ├── preload/        # Preload scripts
│   └── renderer/       # React frontend
│       └── src/
│           ├── components/  # UI components
│           └── stores/      # Zustand stores
├── dist/               # Build output
└── package.json
```

## 🔄 Auto-Update (Server Setup)

Untuk mengaktifkan auto-update, upload file berikut ke server:

```
https://your-server.com/updates/
├── latest.yml
├── Engineering File Manager Setup 1.0.0.exe
└── Engineering File Manager Setup 1.0.0.exe.blockmap
```

File-file ini otomatis di-generate saat `npm run package`.

### Release Baru:
1. Update version di `package.json`
2. `npm run package`
3. Upload file dari `dist/` ke server
4. User akan menerima update otomatis

## 🛠️ Tech Stack

- **Electron 28** - Desktop framework
- **React 18** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **SQLite** (better-sqlite3) - Local file indexing
- **SQL Server** (mssql) - Multi-PC sync
- **PDF.js** - PDF rendering
- **Mammoth.js** - DOCX parsing
- **Sonner** - Toast notifications
- **Lucide React** - Icons

## 📄 License

MIT
