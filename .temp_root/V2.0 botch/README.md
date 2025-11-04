# Route Plotter - Interactive Map Animation Tool

A professional web-based tool for creating animated routes on maps and images with waypoint management, smooth animations, and local storage.

## ✨ Features

### 🗺️ Core Functionality
- **Drag & Drop Image Upload**: Easily load custom maps or images
- **Click-to-Add Waypoints**: Name and place waypoints on your map
- **Smooth Route Visualization**: Professional animated paths between waypoints
- **True Constant Speed**: Animation speed constant in pixels per second
- **Waypoint Easing**: Smooth acceleration/deceleration at each waypoint

### 💾 Save & Load System
- **Local Browser Storage**: Save routes locally using IndexedDB
- **Save Manager**: Organized interface to manage all your saved routes
- **Export JSON**: Download routes as files for sharing
- **Import JSON**: Load shared routes with images embedded
- **Auto-Save Settings**: All preferences preserved across sessions

### 🎨 Customization
- **Line Color Picker**: Full color customization
- **Line Thickness**: Adjustable 1-20 pixels with live preview
- **Smoothing Toggle**: Optional Catmull-Rom curve smoothing (50% strength)
- **Waypoint Labels**: Show names always or on arrival
- **Beacon Animations**: Optional animated effects at waypoints

### 🎬 Playback Controls
- **Play/Pause/Reset**: Full animation control
- **Speed Control**: 5 speed settings (0.25x - 4x)
- **Pause at Waypoints**: Optional automatic pausing
- **Adjustable Pause Duration**: Customize waypoint pause time

### 📤 Export Options
- **Video Export**: Create WebM animations of your routes
- **JSON Export**: Share routes with embedded images
- **Full Settings Preservation**: All visual and behavior settings saved

### 🎯 Design
- **Dark Modern UI**: Professional gradient interface
- **Fully Responsive**: Works on desktop, tablet, and mobile
- **Clean Layout**: Only waypoints visible (no clutter)
- **Intuitive Controls**: Organized control rows

## 🚀 Quick Start

### Method 1: Direct Use
1. Open `index.html` in a modern web browser
2. Drag & drop an image or click to upload
3. Click on the image to add waypoints
4. Click Play to see your animated route!

### Method 2: Local Development
```bash
# Clone the repository
git clone https://github.com/djDAOjones/router-plotter-01.git

# Open in browser
cd router-plotter-01
open index.html
```

## 📖 Usage Guide

### Creating a Route
1. **Upload Image**: Drag & drop or click upload button
2. **Add First Waypoint**: Click on image, name it (e.g., "Start")
3. **Add More Waypoints**: Click to add intermediate and end points
4. **Customize**: Adjust colors, thickness, speed settings
5. **Animate**: Click Play to preview

### Saving Routes
1. **Save Locally**: Click "💾 Save Locally" - saves to browser
2. **Manage Saves**: Click "📂 Manage Saves" to view all routes
3. **Export**: Click "📤 Export JSON" to download and share
4. **Import**: Click "📥 Import JSON" to load shared routes

### Animation Settings
- **Speed Slider**: Adjust animation speed (0.25x to 4x)
- **Pause Toggle**: Enable/disable pausing at waypoints
- **Pause Duration**: Set pause time (1-10 seconds)
- **Names**: Show always or only on arrival
- **Beacons**: Toggle animated effects at waypoints
- **Smoothing**: Enable curved paths or keep straight lines

## 🔧 Technical Details

### Tech Stack
- **HTML5 Canvas** - High-performance 2D rendering
- **Vanilla JavaScript** - No framework dependencies
- **IndexedDB** - Browser-native local storage
- **CSS3** - Modern responsive design
- **Web APIs** - MediaRecorder, FileReader, Blob

### Key Features
1. **Distance-Based Animation**: True constant speed (200px/s at 1x)
2. **Catmull-Rom Splines**: Smooth curve interpolation when enabled
3. **Quadratic Easing**: Professional acceleration/deceleration
4. **Embedded Images**: Self-contained save files with base64 images
5. **Responsive Canvas**: Auto-scales to fit image perfectly

### Browser Support
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Modern mobile browsers

### Storage
- **Location**: Browser IndexedDB (persistent across sessions)
- **Database**: `RoutePlotterDB`
- **Data Stored**: Routes, images, waypoints, all settings
- **Privacy**: Local to your browser only

## 🎨 Animation System

### Speed Control
- Base speed: **200 pixels/second** at 1x
- Speed multipliers: 0.25x, 0.5x, 1x, 2x, 4x
- True constant visual speed across all path segments

### Waypoint Easing
- **First 30%**: Quadratic ease in (smooth acceleration)
- **Middle 40%**: Constant speed
- **Last 30%**: Quadratic ease out (smooth deceleration)

### Path Smoothing
- Optional Catmull-Rom spline interpolation
- 50% tension for balanced smoothing
- Toggle on/off without affecting authored route

## 📁 Project Structure

```
Windsurf Map Router/
├── index.html              # Main application
├── app.js                  # Core JavaScript (~1,300 lines)
├── styles.css              # Complete styling
├── README.md               # This file
├── PROJECT-SUMMARY.md      # Detailed project info
├── QUICK-START.md          # User guide
├── GIT-SETUP.md           # Git setup instructions
└── cascade-transcript.txt  # Development log
```

## 🌟 Use Cases

- **Navigation Demos**: Show routes on campus maps
- **Historical Routes**: Animate historical journeys
- **Tour Planning**: Visualize tour routes with stops
- **Educational**: Teach geography, history, navigation
- **Presentations**: Create engaging route visualizations

## 🔐 Data Privacy

- **All saves stored locally** in your browser
- **No server uploads** - everything runs client-side
- **No tracking** - completely private
- **Export to share** - only you control your data

## 📝 License

MIT License - Free to use, modify, and distribute

## 🔗 Links

- **Repository**: https://github.com/djDAOjones/router-plotter-01
- **Issues**: Report bugs or request features via GitHub Issues
- **Author**: djDAOjones

## 🙏 Acknowledgments

Built with modern web technologies and best practices for a professional, user-friendly experience.

---

**Ready to create beautiful animated routes!** 🗺️✨

# V2 Development - Project Scaffolded ✅

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck
```

The app will run at http://localhost:3000

## Project Structure

```
src/
├── core/           # Core functionality and default project
├── engine/         # Animation and timing engine
├── renderer/       # Canvas 2D rendering
├── ui/            # User interface components  
├── persistence/   # Save/load with IndexedDB
├── export/        # Export pipelines
└── types/         # TypeScript type definitions
```

## Core Types Implemented

- **Project Schema** with Zod validation
- **Track Types**: path, camera, labels
- **Timing Modes**: constantTime, constantSpeed
- **Pause Modes**: none, seconds, click
- **Waypoints**: major/minor distinction
- **Assets**: image, audio, custom with base64 support
- **Styles**: stroke variants, waypoint shapes, path head options

## Console Commands

Open the browser console to interact with the app:

```javascript
// Get current project
app.getProject()

// Load sample project
app.createSample()
```

## Next Steps

The project is scaffolded and ready for implementation. Each module has placeholder functions that will be implemented in subsequent prompts.

# V2 Rewrite Plan and Roadmap

## Goals
- Quick authoring without timeline/keyframe jargon
- Image background only in v2.0; video background deferred
- Accessibility-first, mobile-friendly, packaged project (zip with project.json + assets)
- Embed-ready with postMessage API

## Scope v2.0 (MVP)
- One editable path track, one camera track, one labels track
- Major/minor waypoints; timing modes: constant time per major→major, constant speed (arc-length)
- Pause modes: none, seconds, wait-for-click
- Always-on centripetal Catmull-Rom smoothing (~50% tension) with corner overshoot control
- Path head: none/arrow/pulsing dot; custom image with rotation offset
- Contrast overlay slider (black ↔ none ↔ white)
- Authoring UI: track tabs, click/drag points, reorder majors, keyboard (nudge, Space, J/K/L)
- Preview: start/end, play/stop, 200-step scrub on deterministic runtime clock
- Autosave (IndexedDB), undo/redo (≥100)
- Export: WebM 25 fps deterministic; PNG sequence with alpha fallback (CORS-safe only)
- Accessibility baseline: alt text required, reduced-motion (replace pans/zooms with fades), focus, touch targets ≥44 px
- Palette presets (2–3 colorblind-safe)
- Embed API: postMessage `play`, `pause`, `seekToStep`, `setSpeed`; events `ready`, `state`, `ended`
- Validation: alt text, monotonic times, sensible caps; export blocked on failure

## Architecture
- Separate Authoring and Runtime engines
- Deterministic runtime clock used by preview and export (fixed-step at 25 fps for export)
- Renderer layers: base image → contrast overlay → mask/unmask (basic) → vectors (paths/labels/head)
- Camera transform with bounds clamping and safety margin
- Versioned project schema with migrations; assets manifest by stable IDs
- Persistence: IndexedDB autosave; import/export via zip (project.json + assets/)

## Caps and Validation (initial)
- Path points per path: 1,000; major waypoints: 100
- Labels: 200 (recommend ≤8 visible concurrently); hotspots: 50
- Export duration cap ~90 s (2,250 frames @25 fps); PNG sequence cap ~1,500 frames
- Undo stack: 200; asset ≤10 MB each; total assets ≤100 MB
- Export blocked if: missing alt text, non-monotonic segment times, caps exceeded

## Export and Parity
- Export: WebM via captureStream with fixed time-stepping; PNG sequence with alpha as fallback
- Preview and export share the same timing map; target parity ±1 frame (~40 ms @ 25 fps)

## Backlog and Deferred
- v2.1: Basic label collision avoidance (anchor candidates + staggering); hotspot pattern presets; overlay export (PNG alpha)
- v2.2: i18n/RTL; query-param state restore; CSP-friendly packaging variant
- Deferred/dropped: Single-file HTML export; in-browser MP4; video background (explore later)

## Embed API (v2.0)
- Commands: `play`, `pause`, `seekToStep(number)`, `setSpeed(number)`
- Events: `ready`, `state({ step, playing, speed })`, `ended`

## Next Steps
- Scaffold (TypeScript + Vite), Canvas 2D renderer, IndexedDB autosave
- Implement core engine (geometry, arc-length LUTs, timing/easing, pauses)
- Build renderer layers, authoring UI, preview/transport, export pipeline
- Add validation, a11y/palettes, embed API; document usage and schema
