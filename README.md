# Vibecape

A **Notion-like**, **local-first** documentation editor for MDX projects. Works with [Fumadocs](https://fumadocs.vercel.app/), [Docusaurus](https://docusaurus.io/), and other MDX documentation frameworks.

## Features

- **Notion-like Editor** - Block-based WYSIWYG editing with slash commands
- **Local-first** - SQLite database for instant, offline-capable editing
- **Feishu-like Experience** - Clean, modern UI with drag-and-drop organization
- **Auto Sync** - Seamless import/export between database and MDX files
- **Image Hosting** - Built-in support for image bed services
- **Framework Compatible** - Works with Fumadocs, Docusaurus, and more
- **AI Assistant** - Built-in AI chat for writing assistance

## Getting Started

### Prerequisites

- Node.js 18+
- A documentation project with MDX files (Fumadocs, Docusaurus, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/wangenius/vibecape.git
cd vibecape

# Install dependencies
npm install

# Run in development mode
cd package
npm run dev
```

### Usage

1. Open Vibecape and select your Fumadocs `docs` directory
2. The app creates a `.vibecape` folder to store the local database
3. Edit documents with the visual editor
4. Export changes back to MDX files when ready

## Project Structure

```
docs/                    # Your Fumadocs docs directory
├── .vibecape/          # Vibecape repository (auto-created)
│   └── docs.db         # Local SQLite database
├── index.mdx
├── getting-started.mdx
└── guides/
    ├── index.mdx
    └── ...
```

## Tech Stack

- **Electron** - Cross-platform desktop app
- **React** - UI framework
- **Tiptap** - Rich text editor
- **Drizzle ORM** - Type-safe database ORM
- **SQLite** - Local database
- **TailwindCSS** - Styling

## License

MIT
