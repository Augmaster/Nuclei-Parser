# Nuclei Viewer

A modern web-based dashboard for parsing, organizing, and analyzing [Nuclei](https://github.com/projectdiscovery/nuclei) vulnerability scan outputs. Built with React and designed for security professionals who need to manage and report on their findings efficiently.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)

## Features

- **Import Scans** - Upload Nuclei JSON/JSONL scan outputs with drag-and-drop
- **Organize Findings** - Structure findings by Company and Project hierarchy
- **Powerful Filtering** - Filter by severity, host, template, tags, and search terms
- **Detailed Views** - View complete finding information including request/response data and curl commands
- **Multiple Export Formats** - Export to JSON, CSV, Nessus XML, and Platform CSV formats
- **Dashboard Analytics** - Visualize severity distribution, top vulnerable hosts, and most triggered templates
- **Dark Mode** - Full dark/light theme support
- **Privacy-First** - All data stored locally in your browser using IndexedDB (no server required)

## Screenshots

*Screenshots coming soon*

## Quick Start

### Using Docker (Recommended)

The easiest way to run Nuclei Viewer:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/nuclei-viewer.git
cd nuclei-viewer

# Start with Docker Compose
docker compose up -d
```

The application will be available at **http://localhost:3000**

To stop:
```bash
docker compose down
```

### Manual Installation

#### Prerequisites

- Node.js 20+
- npm

#### Steps

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/nuclei-viewer.git
cd nuclei-viewer

# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will start at **http://localhost:5173**

#### Building for Production

```bash
npm run build
npm run preview
```

## Usage

### 1. Create Organization Structure

1. Navigate to **Companies** and create a company (e.g., "Client ABC")
2. Navigate to **Projects** and create a project under that company (e.g., "Q1 2024 Assessment")

### 2. Import Nuclei Scans

1. Go to the **Upload** page
2. Select your target company and project
3. Drag and drop your Nuclei JSON or JSONL files
4. Findings will be parsed and stored automatically

### 3. Analyze Findings

- **Dashboard** - View statistics and charts
- **Findings** - Browse all findings with filtering
- **Hosts** - Group findings by target host
- **Templates** - Group findings by Nuclei template

### 4. Export Reports

Navigate to **Export** and choose your format:
- **JSON** - Raw data for programmatic access
- **CSV** - For spreadsheet analysis
- **Nessus XML** - Import into Tenable/Nessus
- **Platform CSV** - Compatible with vulnerability management platforms

## Tech Stack

- **Frontend**: React 19, TypeScript 5.9
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4, Shadcn UI
- **State Management**: Zustand
- **Storage**: IndexedDB (browser-native)
- **Charts**: Recharts
- **Icons**: Lucide React

## Project Structure

```
src/
├── components/
│   ├── dashboard/      # Statistics and charts
│   ├── findings/       # Findings display components
│   ├── layout/         # Header, Sidebar, Layout
│   ├── organization/   # Company/Project management
│   ├── ui/             # Reusable UI components
│   └── upload/         # File upload components
├── pages/              # Route pages
├── services/
│   ├── db/             # IndexedDB operations
│   ├── exporters/      # Export format handlers
│   └── parser/         # Nuclei output parser
├── store/              # Zustand state stores
└── types/              # TypeScript definitions
```

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a Pull Request.

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Roadmap

- [ ] Add test coverage
- [ ] Implement finding status tracking (open/resolved/false positive)
- [ ] Add comparison between scans
- [ ] Support additional scanner formats (Nmap, Burp, etc.)
- [ ] Add report generation with customizable templates
- [ ] Implement data import/export for backup
- [ ] Add keyboard shortcuts

## Security

This application runs entirely in your browser. No data is sent to any server. All findings are stored locally in IndexedDB.

If you discover a security vulnerability, please see our [Security Policy](SECURITY.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [ProjectDiscovery](https://projectdiscovery.io/) for creating Nuclei
- [Shadcn UI](https://ui.shadcn.com/) for the beautiful component library
- All contributors who help improve this project

## Support

- Create an [Issue](https://github.com/YOUR_USERNAME/nuclei-viewer/issues) for bug reports or feature requests
- Start a [Discussion](https://github.com/YOUR_USERNAME/nuclei-viewer/discussions) for questions

---

Made with security in mind
