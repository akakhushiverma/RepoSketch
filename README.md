<div align="center">

# 🌌 RepoSketch — The Astral Cartographer

### *Navigate massive codebases like ancient star maps*

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![D3.js](https://img.shields.io/badge/D3.js-v7-F9A03C?style=for-the-badge&logo=d3.js&logoColor=white)](https://d3js.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<br/>

> Built for **Webster 2026** · **She.jsx 2026** Hackathon &nbsp;·&nbsp; PS M3 #06

<br/>

</div>

---

## 🔭 The Problem

> **PS M3 #06 — Codebase Comprehension at Scale**

Modern software projects have grown into vast, interconnected galaxies of code. A developer joining a new team faces a daunting reality:

- **Thousands of files** with no clear entry point or mental model
- **Hidden dependencies** between modules that aren't visible in any single file
- **Invisible coupling** — a change in one file silently breaks five others
- **No architectural guardrails** — technical debt accumulates in the dark
- **Onboarding takes weeks** instead of hours

Existing tools (docs, wikis, IDE explorers) offer only a *local view* — like staring at the ground when you need a star map.

**RepoSketch transforms any GitHub repository into a living, interactive celestial map** — revealing the true shape of a codebase at a glance.

---

## ✨ Features

### 🪐 Repository Ingestion
- Paste any **public GitHub URL** for instant analysis
- Automatic repository cloning, traversal, and cleanup
- Supports JavaScript, TypeScript, JSX, TSX, and mixed projects
- File tree extraction with metadata (size, type, last modified)

### 🕸️ Interactive Dependency Atlas
- **D3.js v7 force-directed graph** renders the entire module dependency network
- Nodes represent files; edges represent `import` / `require` relationships
- **Zoom, pan, drag** individual nodes to explore clusters
- Node sizing reflects **import frequency** (hub files are visually larger)
- Color coding by file type, health score, and complexity tier
- Click any node to open the file in the Code Exploration Panel

### 📖 Code Exploration Panel
- In-browser **syntax-highlighted file viewer** for any node in the graph
- Displays parsed metadata: imports, exports, functions, classes
- One-click navigation between files via dependency links
- Collapsible panel with resizable split-view layout

### 🔬 Deep AST Parsing
- Powered by **Babel** (`@babel/parser`) for full ES2022+ and TypeScript support
- Extracts every `import`, `export`, function declaration, and class definition
- Resolves **relative paths** to canonical file identities
- Handles dynamic imports, re-exports, and barrel files

### 🏥 Architectural Health Scoring
- Each file receives a **0–100 Health Score** based on:
  - Cyclomatic complexity
  - Fan-in / fan-out ratio
  - Circular dependency membership
  - File size and function density
- Repository-level **Overall Health Grade** (A–F)
- Trend indicators for improvement or degradation

### 🌀 Cyclomatic Complexity Analysis
- Counts decision points (if, else, switch, loops, ternaries, logical operators)
- Per-function and per-file complexity scores
- Threshold-based alerts: Low / Medium / High / Critical
- Sortable complexity leaderboard across the entire repo

### 🔁 Circular Dependency Detection
- Implements **Tarjan's Strongly Connected Components (SCC)** algorithm
- Finds all circular import chains with O(V + E) time complexity
- Visual highlighting of circular dependency cycles in the graph
- Actionable list of files involved in each cycle

### 🧭 Smart Onboarding Pathfinder
- Analyzes the graph to recommend the **optimal reading order** for new contributors
- Starts from entry points (index files, main modules) and traverses outward
- Generates a step-by-step "first week" exploration plan
- Highlights the most critical files to understand the architecture

### 💥 Blast Radius Analysis
- Select any file and instantly see **which files would be affected** if it changed
- Forward propagation: direct and transitive dependents highlighted in red
- Backward propagation: shows all files the selected file depends on
- Risk score calculated from the number of affected files

### 🌡️ Heatmap Overlays
- Toggle between multiple visual overlays on the dependency graph:
  - **Complexity Heatmap** — red = high complexity
  - **Coupling Heatmap** — shows tightly vs. loosely coupled modules
  - **Activity Heatmap** — most-imported files glow brightest
  - **Health Heatmap** — green to red gradient by health score

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend Runtime** | Node.js 18+ | Server-side processing |
| **Backend Framework** | Express.js | REST API server |
| **Repository Cloning** | simple-git | Git operations |
| **AST Parsing** | @babel/parser | JavaScript/TypeScript AST |
| **AST Traversal** | @babel/traverse | Import/export extraction |
| **Frontend Framework** | React 18 | UI components |
| **Build Tool** | Vite 5 | Dev server & bundling |
| **Graph Visualization** | D3.js v7 | Force-directed graph |
| **State Management** | Zustand | Global app state |
| **Styling** | Tailwind CSS 3 | Utility-first CSS |
| **Code Highlighting** | react-syntax-highlighter | File viewer |
| **HTTP Client** | Axios | Frontend → Backend API |
| **Graph Algorithms** | Custom (Tarjan's SCC) | Cycle detection |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **Git** installed and accessible in PATH
- A GitHub Personal Access Token (for higher API rate limits)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/RepoSketch.git
cd RepoSketch
```

### 2. Start the Backend

```bash
cd backend
npm install
cp .env.example .env        # Copy and configure environment variables
# Edit .env with your GitHub token and preferences
npm run dev
```

The backend API will start at `http://localhost:3001`

### 3. Start the Frontend

```bash
# In a new terminal, from the project root:
cd frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:5173`

### 4. Open the App

Navigate to **http://localhost:5173** in your browser, paste a GitHub repository URL, and watch your codebase transform into a star map.

---

## ⚙️ Environment Variables

Create `backend/.env` from the provided `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Port the Express server listens on |
| `NODE_ENV` | `development` | Runtime environment |
| `GITHUB_TOKEN` | — | GitHub PAT for cloning & API calls |
| `TEMP_REPO_DIR` | `./temp_repos` | Directory for temporary repo clones |
| `MAX_REPO_SIZE_MB` | `500` | Maximum allowed repo size in MB |
| `AUTO_CLEANUP` | `true` | Delete cloned repo after analysis |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin(s) |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per IP per window |
| `MAX_DEPENDENCY_DEPTH` | `10` | Max graph traversal depth |
| `MAX_FILES_TO_PARSE` | `2000` | Max files analyzed per repository |
| `MAX_FILE_SIZE_KB` | `512` | Max file size for AST parsing |
| `LOG_LEVEL` | `info` | Logging verbosity |

> ⚠️ **Never commit your `.env` file.** It is excluded by `.gitignore`.

---

## 📡 API Documentation

All endpoints are prefixed with `/api`. The server runs on `http://localhost:3001`.

---

### `POST /api/analyze`

Trigger a full analysis of a GitHub repository.

**Request Body:**
```json
{
  "repoUrl": "https://github.com/owner/repository",
  "options": {
    "maxDepth": 10,
    "includeDevDeps": false
  }
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "repoId": "a1b2c3d4",
  "metadata": {
    "name": "repository",
    "owner": "owner",
    "totalFiles": 142,
    "parsedFiles": 98,
    "analysisTime": 4312
  },
  "graph": {
    "nodes": [ { "id": "src/index.js", "label": "index.js", "type": "js", "size": 2048, "healthScore": 87 } ],
    "edges": [ { "source": "src/index.js", "target": "src/app.js", "type": "import" } ]
  },
  "health": {
    "overallScore": 74,
    "grade": "B",
    "issues": []
  }
}
```

---

### `GET /api/file`

Retrieve the source content and metadata for a specific file.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repoId` | string | ✅ | Repository ID from `/api/analyze` |
| `filePath` | string | ✅ | Relative file path within the repo |

**Response `200 OK`:**
```json
{
  "path": "src/components/Graph.jsx",
  "content": "import React from 'react';\n...",
  "language": "jsx",
  "size": 4096,
  "ast": {
    "imports": ["react", "d3", "../store/graphStore"],
    "exports": ["Graph"],
    "functions": ["Graph", "useGraphLayout", "handleNodeClick"],
    "classes": []
  },
  "complexity": {
    "cyclomatic": 12,
    "cognitive": 18,
    "rating": "medium"
  }
}
```

---

### `GET /api/blast-radius`

Calculate the blast radius (impact analysis) for a given file.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repoId` | string | ✅ | Repository ID |
| `filePath` | string | ✅ | The file to analyse |
| `direction` | string | — | `forward` (dependents) or `backward` (dependencies). Default: `forward` |

**Response `200 OK`:**
```json
{
  "file": "src/utils/parser.js",
  "direction": "forward",
  "affectedFiles": ["src/api/analyze.js", "src/api/health.js"],
  "affectedCount": 2,
  "riskScore": 34,
  "riskLevel": "low"
}
```

---

### `GET /api/circular-deps`

Retrieve all detected circular dependency cycles.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repoId` | string | ✅ | Repository ID |

**Response `200 OK`:**
```json
{
  "cycles": [
    {
      "id": 0,
      "files": ["src/a.js", "src/b.js", "src/c.js"],
      "length": 3
    }
  ],
  "totalCycles": 1,
  "affectedFiles": 3
}
```

---

### `GET /api/onboarding-path`

Get the recommended file reading order for new contributors.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repoId` | string | ✅ | Repository ID |

**Response `200 OK`:**
```json
{
  "path": [
    { "step": 1, "file": "src/index.js",     "reason": "Application entry point" },
    { "step": 2, "file": "src/App.jsx",       "reason": "Root component, high fan-in" },
    { "step": 3, "file": "src/store/index.js","reason": "Central state management" }
  ],
  "estimatedReadingTime": "2–3 hours"
}
```

---

### `GET /api/health`

Server health check.

**Response `200 OK`:**
```json
{ "status": "ok", "uptime": 3600, "version": "1.0.0" }
```

---

### `DELETE /api/cleanup/:repoId`

Manually remove a cloned repository from the server.

**Response `200 OK`:**
```json
{ "success": true, "message": "Repository a1b2c3d4 removed." }
```

---

## 🏗️ Architecture Overview

```
RepoSketch/
├── backend/                    # Express API Server
│   ├── src/
│   │   ├── routes/             # API route handlers
│   │   │   ├── analyze.js      # POST /api/analyze
│   │   │   ├── file.js         # GET  /api/file
│   │   │   ├── blastRadius.js  # GET  /api/blast-radius
│   │   │   ├── circularDeps.js # GET  /api/circular-deps
│   │   │   └── onboarding.js   # GET  /api/onboarding-path
│   │   ├── services/           # Core business logic
│   │   │   ├── gitService.js   # Repository cloning (simple-git)
│   │   │   ├── fileWalker.js   # Recursive file tree traversal
│   │   │   ├── astParser.js    # Babel AST parsing & import extraction
│   │   │   ├── graphBuilder.js # Dependency graph construction
│   │   │   ├── healthScorer.js # Health score calculation
│   │   │   ├── complexity.js   # Cyclomatic complexity analysis
│   │   │   ├── tarjan.js       # Tarjan's SCC algorithm
│   │   │   └── pathfinder.js   # Onboarding path generation
│   │   ├── middleware/         # Express middleware
│   │   │   ├── errorHandler.js
│   │   │   ├── rateLimiter.js
│   │   │   └── cors.js
│   │   └── app.js              # Express app setup
│   ├── .env.example
│   └── package.json
│
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── graph/
│   │   │   │   ├── DependencyGraph.jsx   # Main D3 canvas
│   │   │   │   ├── GraphNode.jsx         # Node rendering
│   │   │   │   ├── GraphEdge.jsx         # Edge rendering
│   │   │   │   └── GraphControls.jsx     # Zoom / filter toolbar
│   │   │   ├── panels/
│   │   │   │   ├── CodeExplorer.jsx      # Syntax-highlighted file viewer
│   │   │   │   ├── HealthPanel.jsx       # Health score dashboard
│   │   │   │   ├── BlastRadiusPanel.jsx  # Blast radius results
│   │   │   │   └── OnboardingPanel.jsx   # Onboarding path UI
│   │   │   ├── overlays/
│   │   │   │   └── HeatmapOverlay.jsx    # Heatmap toggle controls
│   │   │   └── ui/                       # Reusable UI primitives
│   │   ├── store/
│   │   │   ├── graphStore.js   # Zustand: graph data & selected node
│   │   │   ├── uiStore.js      # Zustand: panel visibility, overlays
│   │   │   └── repoStore.js    # Zustand: repo metadata & analysis state
│   │   ├── hooks/
│   │   │   ├── useD3Graph.js   # D3 simulation lifecycle hook
│   │   │   └── useAnalysis.js  # API fetch & polling hook
│   │   ├── api/
│   │   │   └── client.js       # Axios API client
│   │   ├── utils/
│   │   │   └── colorScale.js   # Health/complexity color mappings
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```

### Data Flow

```
User pastes GitHub URL
        │
        ▼
Frontend → POST /api/analyze
        │
        ▼
Backend: Clone repo (simple-git)
        │
        ▼
Backend: Walk file tree, filter JS/TS files
        │
        ▼
Backend: Parse each file with Babel AST
  → Extract imports, exports, functions
        │
        ▼
Backend: Build directed dependency graph (nodes + edges)
  → Run Tarjan's SCC → find circular deps
  → Calculate complexity scores
  → Calculate health scores
  → Generate onboarding path
        │
        ▼
Backend: Return complete graph JSON
        │
        ▼
Frontend: D3 force simulation renders graph
  → Zustand stores graph state
  → User interacts: click, zoom, overlay, panel
```

---

## 📸 Screenshots

> *Screenshots coming soon — the stars are still being charted.*

| View | Description |
|------|-------------|
| 🌌 **Dependency Atlas** | Full-repo force-directed graph |
| 🔴 **Circular Deps** | Cycles highlighted in red |
| 💥 **Blast Radius** | Propagation heatmap from selected file |
| 🏥 **Health Dashboard** | Scores, grades, and issue list |
| 📖 **Code Explorer** | Syntax-highlighted file viewer |
| 🧭 **Onboarding Path** | Step-by-step reading order |

---

## 👩‍💻 Team

Built with 🌙 and ☕ for the **Webster 2026** and **She.jsx 2026** hackathons.

| Role | Contributor |
|------|-------------|
| Fullstack | Team RepoSketch |

*Competing under PS M3 #06 — Codebase Comprehension at Scale*

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 Team RepoSketch

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

*"The cosmos is within us. We are made of star-stuff."* — Carl Sagan

**RepoSketch** · Navigate the stars of your codebase · Webster 2026 / She.jsx 2026

</div>
