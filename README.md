# Engineering File Manager

Aplikasi desktop untuk mempermudah pencarian dan pengelolaan file di folder engineering.

![Electron](https://img.shields.io/badge/Electron-28.x-blue)
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)

## ✨ Fitur

- 📁 **File Browser** - Navigasi folder dengan grid/list view
- 🔍 **Fast Search** - Pencarian file terindeks dengan SQLite
- 📄 **PDF Preview** - Preview PDF dengan zoom & navigasi halaman
- 🖼️ **Image Preview** - Preview gambar dengan zoom & rotate
- 📐 **AutoCAD Preview** - Preview thumbnail DWG files
- ⭐ **Favorites** - Tandai file favorit
- 🏷️ **Categories** - Filter file berdasarkan kategori
- 🔃 **Sorting** - Urutkan berdasarkan nama, tanggal, ukuran, tipe
- 🖱️ **Drag & Drop** - Pindahkan file antar folder
- 📋 **Context Menu** - Rename, delete, copy path
- 🔄 **Auto-Update** - Update otomatis dari server
- 🌙 **Dark/Light Theme** - Tema gelap dan terang

## 💻 System Requirements

### Minimum Requirements
| Component | Specification |
|-----------|---------------|
| **OS** | Windows 10 (64-bit) |
| **Processor** | Intel Core i3 / AMD Ryzen 3 |
| **RAM** | 4 GB |
| **Storage** | 200 MB |
| **Display** | 1280 x 720 |

### Supported Windows Versions
- ✅ Windows 10 (64-bit) - Version 1903+
- ✅ Windows 11 (64-bit) - All versions
- ❌ Windows 7/8/8.1 - Not supported
- ❌ Windows 32-bit - Not supported

### Recommended
| Component | Specification |
|-----------|---------------|
| **OS** | Windows 11 |
| **Processor** | Intel Core i5 / AMD Ryzen 5 |
| **RAM** | 8 GB |
| **Storage** | 500 MB (untuk index database besar) |
| **Display** | 1920 x 1080 |

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

### Update Server URL
Edit `package.json`:
```json
"publish": {
  "provider": "generic",
  "url": "https://your-server.com/updates/"
}
```

### Default Path
Edit `src/renderer/src/stores/fileStore.ts`:
```typescript
const DEFAULT_PATH = 'D:\\your-folder'
```

## 📁 Struktur Project

```
electron-file-manager/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # Entry point
│   │   └── services/   # File, DB, Search services
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

- **Electron** - Desktop framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **SQLite** (better-sqlite3) - File indexing
- **PDF.js** - PDF rendering
- **Sonner** - Toast notifications
- **Lucide React** - Icons

## 📄 License

MIT
