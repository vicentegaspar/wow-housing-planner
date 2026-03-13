# Full Specification: WoW Player Housing Planner — Replication Prompt for AI Agents

This document is a complete, framework-agnostic specification for replicating the **WoW Player Housing Planner** application. Use it as a prompt for another AI agent to build a functionally equivalent project. The only hard dependency is **Three.js** for the 3D visualization; the rest of the stack (React, Vue, Svelte, vanilla JS, etc.) is left to the implementer.

---

## 1. Project Overview

**Name:** WoW Player Housing Planner

**Purpose:** A web-based tool for designing and planning custom house layouts for the World of Warcraft Player Housing feature. Users can drag rooms onto an infinite 2D canvas, organize them into sectors, and view the result in an interactive 3D view.

**Core Value Proposition:**
- Intuitive drag-and-drop room placement
- Multi-floor architecture (up to 10 floors)
- Sector-based organization with colors and optional textures
- Real-time 3D visualization using Three.js
- Persistent storage, import/export, and PDF export

---

## 2. Data Model

### 2.1 Core Types

```typescript
interface Point {
  x: number;
  y: number;
}

enum RoomShape {
  SQUARE, SQUARE_SMALL, LARGE_SQUARE,
  RECTANGLE, RECTANGLE_LONG, RECTANGLE_WIDE,
  OCTAGONAL, L_SHAPED, STAIRS_UP, STAIRS_DOWN,
  HALLWAY, T_SHAPED, CROSS_SHAPED, U_SHAPED, ROUND_ROOM
}

interface RoomInstance {
  id: string;           // UUID or unique string
  shape: RoomShape;
  x: number;            // Canvas position (top-left reference)
  y: number;
  rotation: number;     // Degrees: 0, 90, 180, 270
  sectorId?: string;    // Optional sector assignment
}

interface FloorLayout {
  rooms: RoomInstance[];
  name?: string;        // Optional floor label
}

interface Sector {
  id: string;
  name: string;
  color: string;        // Hex #RRGGBB
  description: string;
  textureData?: string; // Base64 data URL (data:image/...;base64,...) for 3D texture
}

interface Layout {
  floors: { [floor: number]: FloorLayout };  // floor index 1..MAX_FLOORS
  sectors: Record<string, Sector>;
}
```

### 2.2 Room Definitions

Each `RoomShape` has a **RoomDefinition** with:

- `width`, `height` (in canvas units)
- `vertices`: array of `Point` forming the room outline (closed polygon)
- `nodes`: connection points for snapping (midpoints of edges, corners, etc.)
- `area`: numeric area in square units (for total-area calculation)

**Required room shapes and exact dimensions (see Appendix A for full vertices/nodes):**

| Shape         | Width | Height | Area   | Notes                                      |
|---------------|-------|--------|--------|--------------------------------------------|
| SQUARE        | 100   | 100    | 10000  | Basic square                               |
| SQUARE_SMALL  | 50    | 50     | 2500   | Half-size square                           |
| LARGE_SQUARE  | 200   | 200    | 40000  | Double square                              |
| RECTANGLE     | 150   | 75     | 11250  | Horizontal rectangle                       |
| RECTANGLE_LONG| 250   | 75     | 18750  | Long horizontal                            |
| RECTANGLE_WIDE| 150   | 125    | 18750  | Tall rectangle                             |
| HALLWAY       | 200   | 50     | 10000  | Narrow corridor                            |
| OCTAGONAL     | 100   | 100    | 8284   | Regular octagon                            |
| ROUND_ROOM    | 100   | 100    | 7854   | Circle, 32 vertices                        |
| L_SHAPED      | 100   | 100    | 7500   | L polygon                                  |
| T_SHAPED      | 150   | 150    | 12500  | T polygon                                  |
| CROSS_SHAPED  | 150   | 150    | 12500  | Cross/plus polygon                         |
| U_SHAPED      | 150   | 100    | 10000  | U polygon                                  |
| STAIRS_UP     | 50    | 100    | 5000   | Stair icon, vertical                       |
| STAIRS_DOWN   | 50    | 100    | 5000   | Stair icon, vertical                       |

Vertices must form a closed polygon (first point implicitly connects to last). Nodes are used for **snap-to-connect** logic: when dragging a room, its nodes are compared to other rooms’ nodes; if within `SNAP_DISTANCE` (20px), the room snaps to align those nodes.

### 2.3 Floor Constraints

- **MAX_FLOORS = 10**
- Valid floor indices: **1** through **10**
- Any floor index outside this range must be **dropped** on import and when loading templates
- At least floor 1 must always exist (even if empty)

### 2.4 Utility: Point Rotation

Implement a function to rotate a point around a center by an angle (degrees):

```
rotatePoint(point, center, angle) → Point
  rad = angle * π / 180
  translated = (point.x - center.x, point.y - center.y)
  return (
    translated.x * cos(rad) - translated.y * sin(rad) + center.x,
    translated.x * sin(rad) + translated.y * cos(rad) + center.y
  )
```

This is used for:
- Applying room rotation when rendering
- Snap logic (rotating node positions by room.rotation before distance check)

---

## 3. Feature Specifications

### 3.1 2D Canvas

**Purpose:** Infinite pan-and-zoom canvas where rooms are placed and edited.

**Behavior:**
- **Pan:** Left-click + drag on empty canvas, or middle-click + drag. Pan updates `(panX, panY)`.
- **Zoom:** Mouse wheel; typical range 0.2–3.0. Zoom is applied as CSS `transform: scale(zoom)`.
- **Coordinate transform:** Screen to canvas: `canvasX = (screenX - rectLeft - panX) / zoom`, `canvasY = (screenY - rectTop - panY) / zoom`.
- **Room drag:** Left-click on room starts drag. Do **not** start pan when clicking a room.
- **Room drop:** On mouse up, commit the room position (and rotation) to the layout.

**Room interactions:**
- **Add room:** Drag from a sidebar of room shapes onto the canvas. On drop, create a new `RoomInstance` with `crypto.randomUUID()` (or equivalent) and add to current floor.
- **Move room:** Drag existing room; update its `x`, `y` on drop.
- **Rotate room:** While dragging, `R` = +90°, `Shift+R` = -90°.
- **Duplicate room:** `Alt` + drag existing room creates a copy (new id) on drop.
- **Delete room:** Select room, then `Delete` or `Backspace`.
- **Select room:** Click to select; show visual highlight (e.g. border).

**Snapping:**
- When dragging, for each node of the dragged room (rotated by `room.rotation`), check distance to each node of other rooms on the same floor (rotated by their `room.rotation`).
- If distance < `SNAP_DISTANCE / zoom`, snap the dragged room so those nodes align.
- Use `rotatePoint` to get world-space node positions.

**Rendering:**
- Each room is rendered as a polygon (SVG or Canvas) using `vertices` from its `RoomDefinition`, transformed by `(x, y, rotation)`.
- Rooms with a `sectorId` use that sector’s `color` for fill.
- Show a “ghost” of the floor below (current floor - 1) with reduced opacity for context.

### 3.2 Sectors

**Purpose:** Group rooms into named, colored categories (e.g. “Living Quarters”, “Kitchen”).

**CRUD:**
- Create sector: id, name, color (#RRGGBB), description.
- Edit sector: update name, color, description.
- Delete sector: remove sector and clear `sectorId` from all rooms that referenced it.

**Assign mode:**
- User clicks “Assign Rooms” for a sector.
- Cursor changes to indicate assign mode.
- Click room: if room has no sector or different sector → set `sectorId`; if same sector → clear `sectorId`.
- Click “Finish Assigning” to exit.

**Texture import (optional per sector):**
- Allow uploading an image (JPG, PNG, WebP).
- Store as base64 data URL in `sector.textureData`.
- Used in 3D view for walls and floors of rooms in that sector.

**Sector color palette (suggested):** Stormwind Blue, Orgrimmar Red, Verdant Forest, Dalaran Violet, Stonemason Grey, Sunwell Gold, Gnomish Pink, Scholarly Purple, Earthen Brown, Tidal Turquoise (hex values in constants).

### 3.3 Multi-Floor

- Toolbar shows current floor (1–10) and up/down controls.
- Keyboard: `PageUp` / `PageDown` to change floor.
- Canvas shows only rooms on the current floor (plus ghost of floor below).
- Each floor has its own `rooms` array in `layout.floors[floorIndex]`.

### 3.4 Undo / Redo

- Implement a history stack (past, present, future).
- On each layout change, push previous state to past, clear future.
- Undo: pop from past to present, push current to future.
- Redo: pop from future to present, push current to past.
- Do not add to history if the new state is identical to the current (e.g. no-op drag).

### 3.5 Persistence (localStorage)

- **Layout:** Save `layout` as JSON under key `wow-house-layout` whenever it changes (debounced if desired).
- **Viewport:** Save `{ zoom, pan }` under key `wow-housing-viewport`. Load on init. Debounce writes (e.g. 220ms) to avoid excessive writes during pan.
- On load: if `wow-house-layout` exists and has rooms, restore layout and do not show startup modal. If empty or missing, show startup modal.

### 3.6 Viewport Reset

- **Reset view:** Set `pan = { x: 0, y: 0 }`, `zoom = 1`, and persist immediately.
- **When to reset:** On “New blank project”, “Load template”, “Import”, or explicit “Reset view” button.

### 3.7 Startup Modal

Shown when the app loads with no saved project (or empty project). Options:

1. **New Blank Project:** Clear storage, reset layout to `{ floors: { 1: { rooms: [] } }, sectors: {} }`, reset viewport, close modal.
2. **Load Template:** Open template picker modal.
3. **Import:** Open import modal.

### 3.8 Templates

- Provide a list of **pre-built layouts** (e.g. 21 templates: Human Cottage, Dwarf Bunker, Orc Barracks, etc.).
- Each template: `{ name, description, layout }`.
- **Floor indices must be 1..MAX_FLOORS.** Templates with floors 0, -1, -2, or >10 will have those floors dropped; warn or fix at authoring time.
- **Load template:** If current project has rooms, show confirmation (“This will overwrite your project”). On confirm, replace layout with template, reset viewport, set current floor to first floor in template.
- Templates can be loaded from a **Template Modal** (toolbar button) or from the startup modal.

### 3.9 New Project

- Toolbar “New” button.
- If project has rooms: show confirmation. On confirm, clear storage, reset layout, reset viewport.
- If empty: do it immediately without confirmation.

### 3.10 Import

- Accept: (1) raw JSON string, (2) Base64-encoded JSON.
- Try `JSON.parse(input)`; if it fails, try `JSON.parse(decodeURIComponent(escape(atob(input))))`.
- Validate: must have `floors` and `sectors` objects.
- Run `clampLayoutFloors`: keep only floors 1..MAX_FLOORS. If any floors were dropped, show alert listing them.
- Replace layout with imported data, reset viewport, set current floor to first floor in result.

### 3.11 Export

- **JSON:** `JSON.stringify(layout, null, 2)` after `clampLayoutFloors`.
- **Shareable code:** Base64 of the JSON string.
- **Download:** Offer .json file download.
- **PDF:** Multi-page PDF, one page per floor that has rooms. Each page shows the 2D floor plan cropped to the content. Use a PDF library (e.g. jsPDF, pdf-lib) or server-side generation.

### 3.12 Total Area Display

- Sum `room.area` from `ROOM_DEFINITIONS[room.shape].area` for all rooms on floors 1..MAX_FLOORS.
- Convert to m² (e.g. divide by 100 if area is in square units).
- Display with a configurable limit (e.g. 100,000 m²) and show a progress bar or warning when over limit.

---

## 4. 3D View (Three.js — Required)

**Purpose:** Real-time 3D visualization of the layout. Use **Three.js** exclusively for this view.

### 4.1 Scene Setup

- **Scene:** Dark background (e.g. `#0d1017`).
- **Camera:** `PerspectiveCamera`, FOV 60°, near 1, far 10000.
- **Renderer:** WebGLRenderer, antialias, `outputColorSpace = SRGB`, `toneMapping = ACESFilmicToneMapping`, `toneMappingExposure ≈ 1.05`.
- **Shadows:** `renderer.shadowMap.enabled = true`, `shadowMap.type = PCFSoftShadowMap`. Directional light `castShadow = true`; meshes `castShadow` and `receiveShadow` as appropriate.

### 4.2 Lighting

- HemisphereLight (sky/ground).
- DirectionalLight (key) with shadow map.
- Fill light (optional).

### 4.3 Environment Map (Optional but Recommended)

- Load HDR via `RGBELoader` (e.g. from Three.js examples or a CDN).
- Use `PMREMGenerator.fromEquirectangular(texture)` to create `scene.environment`.
- Fallback: neutral grey or skip if load fails.

### 4.4 Geometry Generation

For each room in the layout (floors 1..MAX_FLOORS only):

1. **Floor:** `Shape` from `vertices` → `ShapeGeometry` → mesh with floor material. Rotate -90° around X to lay flat. Y position = `(floorIndex - 1) * FLOOR_SEPARATION`.
2. **Walls:** For each edge (vertex[i] to vertex[i+1]), create a `BoxGeometry(length, WALL_HEIGHT, thickness)` or equivalent. Position at edge midpoint, rotate to align with edge direction. `length = hypot(p2.x-p1.x, p2.y-p1.y)`.
3. **Roof:** Same shape as floor, raised by `WALL_HEIGHT`, use sector color for roof material.

**Constants:** `WALL_HEIGHT = 40`, `WALL_THICKNESS = 2`, `FLOOR_SEPARATION = 60`, `SNAP_DISTANCE = 20`.

**Room transform:** Each room has `(x, y, rotation)`. Build geometry in local space (centered at origin), then: translate by `(-width/2, 0, -height/2)`, rotate Y by `rotation` (degrees to radians), translate to `(room.x + width/2, yPos, room.y + height/2)`.

### 4.5 Materials

- **Walls:** `MeshStandardMaterial`. If sector has `textureData`, load texture from data URL and use as `map`; otherwise use `sector.color`.
- **Floor:** Same logic (texture or color).
- **Roof:** Use sector color (texture optional).
- Cache materials by sector to avoid duplicates. Dispose textures and materials on layout change or unmount.

### 4.6 Room Labels

- Optional billboard labels above each room.
- Use `THREE.Sprite` with `CanvasTexture`: draw text (sector name or shape name) on a canvas, create texture, apply to `SpriteMaterial`.
- `depthTest: false`, `depthWrite: false` so labels stay visible.
- Toggle visibility via UI.

### 4.7 Camera Controls

- Use `OrbitControls` from `three/examples/jsm/controls/OrbitControls.js`.
- **Left-drag:** Pan.
- **Right-drag:** Rotate.
- **Scroll:** Zoom.
- `enableDamping`, `screenSpacePanning = true`, `minDistance`, `maxDistance`, `maxPolarAngle` to avoid flipping.

### 4.8 Floor Visibility

- Allow hiding individual floors in the 3D view.
- Tag each floor group with `userData.floorIndex`.
- Toggle `visible` based on user selection.
- “Solo” button: show only one floor; if already soloed, restore all.

### 4.9 Auto-Frame

- On layout load or when opening 3D view, compute a bounding box of all layout geometry.
- Position camera and `controls.target` so the full layout is in view (e.g. distance = fov-based formula from max dimension).

### 4.10 Cleanup

- On layout change or component unmount: remove layout meshes from scene, `dispose()` geometries, materials, and textures.

---

## 5. UI Structure (Framework-Agnostic)

- **Toolbar:** Logo, floor controls, New, Templates, Import, Export, Sectors toggle, 3D View button, Zoom +/- , Reset view, Undo, Redo.
- **Sidebar (left):** List of room shapes to drag from.
- **Canvas (center):** Main 2D view with pan/zoom.
- **Sector panel (right, slide-out):** List of sectors, create/edit form, texture upload, assign mode.
- **Modals:** Startup, Template picker, Import, Export, Confirm (for destructive actions).
- **Overlays:** Total area display, current floor label.

---

## 6. Keyboard Shortcuts

| Action              | Shortcut                    |
|---------------------|-----------------------------|
| Rotate room CW      | R (while dragging)          |
| Rotate room CCW     | Shift+R (while dragging)    |
| Duplicate room      | Alt + drag                  |
| Pan canvas          | Left-drag empty / Middle-drag |
| Zoom                | Mouse wheel                 |
| Floor up            | PageUp                      |
| Floor down          | PageDown                    |
| Delete room         | Delete / Backspace          |
| Cancel / close      | Escape                      |

---

## 7. Validation Rules (for Templates and Import)

When validating a layout (e.g. for templates or tests):

1. **Floor indices:** All in 1..MAX_FLOORS.
2. **Room shapes:** Every `room.shape` exists in `ROOM_DEFINITIONS`.
3. **Coordinates:** `x`, `y`, `rotation` are finite numbers.
4. **Sector references:** Every `room.sectorId` exists in `layout.sectors`.
5. **Room IDs:** Unique within a layout; globally unique across templates if sharing.
6. **Sector colors:** Valid hex `#RRGGBB`.
7. **Geometry:** Each shape has ≥3 vertices, finite coordinates, non-zero width/height.

---

## 8. Template List (21 Templates)

Provide at least these categories and examples:

- **Alliance:** Human Cottage, Human Blacksmith, Human Arcanum Spire, Human Small Castle, Dwarf Mountain Forge, Dwarf Underground Bunker, Gnome Topsy-Turvy House, Gnome Grand Workshop, Night Elf Elven Lodge, Night Elf Mage Tower.
- **Horde:** Orc Grunt Barracks, Troll Village Center, Tauren Great Tent, Undead Sprawling Crypt, Undead Apothecary Lab.
- **Neutral:** Druid Healing Grove, Druid Great Tree House, Generic Crossroads Inn, Generic Sprawling Tavern, Generic Town Hall, Generic Grand Library.

Each template must have `floors` with indices 1..10 only, `sectors` with all referenced sectorIds, and valid room data.

---

## 9. Technical Notes

- **Lazy-load 3D:** Load Three.js and the 3D view only when the user opens it, to keep initial bundle smaller.
- **Responsive:** Handle window resize for canvas and 3D viewport.
- **Accessibility:** ARIA labels, keyboard support, focus management where applicable.
- **Error handling:** Graceful fallbacks for failed texture load, HDR load, import parse errors.

---

## 10. File / Module Structure (Suggested)

```
/
├── types.ts           # Point, RoomShape, RoomInstance, Sector, Layout, etc.
├── constants.ts       # ROOM_DEFINITIONS, SNAP_DISTANCE, SECTOR_COLORS
├── layoutFloors.ts    # clampLayoutFloors, MAX_FLOORS
├── utils.ts           # rotatePoint
├── templates.ts       # TEMPLATES array
├── components/
│   ├── Toolbar
│   ├── Sidebar        # Room shape palette
│   ├── Canvas         # 2D view
│   ├── SectorPanel
│   ├── ThreeDView     # Three.js 3D view
│   ├── StartupModal
│   ├── TemplateModal
│   ├── ImportModal
│   ├── ExportModal
│   ├── ConfirmModal
│   └── Modal (base)
├── hooks/ or store/   # Layout state, undo/redo, canvas controls, room interaction
└── App / main         # Root component, routing if needed
```

---

## 11. Summary Checklist for Implementation

- [ ] Data model: Layout, RoomInstance, Sector, RoomDefinition
- [ ] 16 room shapes with vertices, nodes, dimensions
- [ ] 2D canvas: pan, zoom, drag rooms, snap, rotate, duplicate, delete
- [ ] Sectors: CRUD, assign mode, texture upload
- [ ] Multi-floor (1–10), floor switching
- [ ] Undo/redo
- [ ] localStorage: layout, viewport
- [ ] Startup modal, template modal, import/export modals
- [ ] New project, load template, import (with confirmation when overwriting)
- [ ] Export: JSON, Base64, PDF
- [ ] Total area display
- [ ] Three.js 3D view: scene, lights, shadows, geometry from layout, textures, labels, OrbitControls, floor visibility
- [ ] Keyboard shortcuts
- [ ] 21 templates with valid floor indices

---

*End of specification. Use this document as the single source of truth when replicating the WoW Player Housing Planner with another AI agent or development team.*

---

## Appendix A: Full Room Geometry (vertices and nodes)

Use this data to implement `ROOM_DEFINITIONS`. Coordinates are in canvas units. `roundRoomVertices` = 32 points: `{ x: 50 + 50*cos(i*2π/32), y: 50 + 50*sin(i*2π/32) }` for i = 0..31.

```json
{
  "SQUARE": {
    "width": 100, "height": 100, "area": 10000,
    "vertices": [[0,0],[100,0],[100,100],[0,100]],
    "nodes": [[50,0],[100,50],[50,100],[0,50]]
  },
  "SQUARE_SMALL": {
    "width": 50, "height": 50, "area": 2500,
    "vertices": [[0,0],[50,0],[50,50],[0,50]],
    "nodes": [[25,0],[50,25],[25,50],[0,25]]
  },
  "LARGE_SQUARE": {
    "width": 200, "height": 200, "area": 40000,
    "vertices": [[0,0],[200,0],[200,200],[0,200]],
    "nodes": [[100,0],[200,100],[100,200],[0,100]]
  },
  "RECTANGLE": {
    "width": 150, "height": 75, "area": 11250,
    "vertices": [[0,0],[150,0],[150,75],[0,75]],
    "nodes": [[75,0],[150,37.5],[75,75],[0,37.5]]
  },
  "RECTANGLE_LONG": {
    "width": 250, "height": 75, "area": 18750,
    "vertices": [[0,0],[250,0],[250,75],[0,75]],
    "nodes": [[125,0],[250,37.5],[125,75],[0,37.5]]
  },
  "RECTANGLE_WIDE": {
    "width": 150, "height": 125, "area": 18750,
    "vertices": [[0,0],[150,0],[150,125],[0,125]],
    "nodes": [[75,0],[150,62.5],[75,125],[0,62.5]]
  },
  "HALLWAY": {
    "width": 200, "height": 50, "area": 10000,
    "vertices": [[0,0],[200,0],[200,50],[0,50]],
    "nodes": [[100,0],[200,25],[100,50],[0,25]]
  },
  "OCTAGONAL": {
    "width": 100, "height": 100, "area": 8284,
    "vertices": [[30,0],[70,0],[100,30],[100,70],[70,100],[30,100],[0,70],[0,30]],
    "nodes": [[50,0],[85.35,14.65],[100,50],[85.35,85.35],[50,100],[14.65,85.35],[0,50],[14.65,14.65]]
  },
  "ROUND_ROOM": {
    "width": 100, "height": 100, "area": 7854,
    "vertices": "32 points: 50+50*cos(i*2π/32), 50+50*sin(i*2π/32) for i=0..31",
    "nodes": [[50,0],[100,50],[50,100],[0,50]]
  },
  "L_SHAPED": {
    "width": 100, "height": 100, "area": 7500,
    "vertices": [[0,0],[100,0],[100,50],[50,50],[50,100],[0,100]],
    "nodes": [[50,0],[100,25],[75,50],[50,75],[25,100],[0,50]]
  },
  "T_SHAPED": {
    "width": 150, "height": 150, "area": 12500,
    "vertices": [[0,0],[150,0],[150,50],[100,50],[100,150],[50,150],[50,50],[0,50]],
    "nodes": [[75,0],[150,25],[125,50],[75,150],[25,50],[0,25]]
  },
  "CROSS_SHAPED": {
    "width": 150, "height": 150, "area": 12500,
    "vertices": [[50,0],[100,0],[100,50],[150,50],[150,100],[100,100],[100,150],[50,150],[50,100],[0,100],[0,50],[50,50]],
    "nodes": [[75,0],[125,50],[150,75],[125,100],[75,150],[25,100],[0,75],[25,50]]
  },
  "U_SHAPED": {
    "width": 150, "height": 100, "area": 10000,
    "vertices": [[0,0],[150,0],[150,50],[100,50],[100,100],[50,100],[50,50],[0,50]],
    "nodes": [[75,0],[150,25],[125,50],[75,100],[25,50],[0,25]]
  },
  "STAIRS_UP": {
    "width": 50, "height": 100, "area": 5000,
    "vertices": [[0,0],[50,0],[50,100],[0,100]],
    "nodes": [[25,0],[50,50],[25,100],[0,50]]
  },
  "STAIRS_DOWN": {
    "width": 50, "height": 100, "area": 5000,
    "vertices": [[0,0],[50,0],[50,100],[0,100]],
    "nodes": [[25,0],[50,50],[25,100],[0,50]]
  }
}
```

---

## Appendix B: Sector Color Palette

| Name          | Hex       |
|---------------|-----------|
| Stormwind Blue| #1a3c8c   |
| Orgrimmar Red | #8c1a1a   |
| Verdant Forest| #266d3a   |
| Dalaran Violet| #5a2d91   |
| Stonemason Grey| #555555  |
| Sunwell Gold  | #b08b00   |
| Gnomish Pink  | #de55a4   |
| Scholarly Purple| #4b0082  |
| Earthen Brown | #8b4513   |
| Tidal Turquoise| #1e828c  |
