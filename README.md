# WoW Player Housing Planner

An intuitive, web-based application for designing and planning custom house layouts for the upcoming Player Housing feature in World of Warcraft. Built for the community, this tool provides a game-like interface to assemble rooms, connect them seamlessly, and build your dream multi-story Azerothian home.

## Local development

- **Install:** `npm install`
- **Dev server:** `npm run dev` (Vite; open the URL it prints, e.g. `http://localhost:5173`)
- **Production build:** `npm run build` — output in `dist/`
- **3D view:** Three.js is loaded **only when you open 3D View**, so the initial page load stays lighter.
- **Optional:** Set `GEMINI_API_KEY` in `.env` if you use Gemini-related features (see `vite.config.ts`).

## ✨ Features

*   **Intuitive Drag & Drop Interface:** Effortlessly design your layout by dragging rooms from a comprehensive library onto an infinite canvas.
*   **Multi-Floor Architecture:** Up to **10 floors**; each floor has its own room list. Switch floors with **− / +** in the toolbar (or `PageDown` / `PageUp`). A floor you have not drawn on yet shows an empty canvas until you place rooms there.
*   **Immersive 3D Visualization:** Instantly switch to a real-time, navigable 3D view to explore your creation from every angle. Get a true sense of scale, flow, and verticality.
*   **Smart Snapping & Alignment:** Rooms intelligently snap together at connection nodes, ensuring perfect alignment without tedious manual work.
*   **Advanced Canvas Controls:** Seamlessly pan and zoom with keyboard and mouse shortcuts, making it easy to manage even the most massive and complex housing projects.
*   **Organizational Sector System:** Group rooms into color-coded sectors (e.g., "Living Quarters," "Crafting Wing") for superior organization and planning. The roof of each room in the 3D view will match its sector color. **Import textures** per sector (JPG, PNG, WebP) for walls and floors in the 3D view.
*   **Real-time Analytics:** Total area in m² counts only **floors 1–10** (same as the rest of the app).
*   **Persistent Local Saves:** Your project is automatically saved to your browser's local storage. Close the tab and pick up right where you left off, anytime.
*   **Viewport memory:** Pan and zoom are stored under `wow-housing-viewport` in localStorage (writes debounced ~220ms so panning doesn’t hammer storage) and restored on reload. Use toolbar **Reset view** anytime for pan (0,0) and zoom 100%; that also overwrites stored viewport. Loading a template, importing, or starting a new blank project resets the view the same way.
*   **Professional PDF Export:** Multi-page PDF with one page per floor that has rooms (**floors 1–10 only**); each page is cropped to the plan. Ideal for sharing or printing.

## 🚀 How to Use

### Basic Controls
1.  **Add a Room:** Click and drag a room shape from the **"Add Room"** sidebar on the left onto the main canvas.
2.  **Move a Room:** Click and drag any room that is already on the canvas.
3.  **Select a Room:** Simply click on a room on the canvas. It will be highlighted with a yellow border.
4.  **Delete a Room:** Select a room and press the `Delete` or `Backspace` key.
5.  **Rotate a Room:** While dragging a room, press the `R` key to rotate it 90 degrees clockwise, or `Shift+R` to rotate counter-clockwise.
6.  **Duplicate a Room:** Hold down the `Alt` key while clicking and dragging an existing room on the canvas to create a copy.

### Exploring in 3D
1.  Click the **"3D View"** button in the top toolbar to enter the 3D mode.
2.  Use your mouse to navigate:
    *   **Pan View:** Left-click and drag.
    *   **Rotate View:** Right-click and drag.
    *   **Zoom View:** Use the mouse scroll wheel.
3.  To exit, click the **"Close"** button or press the `Escape` key.

### Organizing with Sectors
You can group rooms into colored sectors for better planning. This color will appear on the roof of the rooms in the 3D view.
1.  **Create a Sector:** In the **"Sectors"** panel on the right, click "Create New Sector". Give it a name, description, and choose a color.
2.  **Assign Rooms:** After creating a sector, click the **"Assign Rooms"** button.
3.  **Click to Assign:** Your cursor will change. Click on any room on the canvas to add it to that sector. Clicking it again will remove it.
4.  **Finish Assigning:** When you're done, click the **"Finish Assigning"** button to return to the normal mode.

### Navigating Your Layout
*   **Pan:** Hold the `Shift` key and drag with your mouse, or click and drag with the middle mouse button.
*   **Zoom:** Use your mouse's scroll wheel or the `Zoom +` / `Zoom -` buttons.
*   **Change Floors:** Use the **−** and **+** floor controls in the toolbar, or press `PageDown` / `PageUp` (max 10 floors).
*   **Import limit:** Shared/imported JSON is clamped to **floors 1–10**. If the file had floor 11+, those floors are removed and you get a warning after import.
*   **Export (JSON & shareable code):** Always written with **floors 1–10 only**, so backups and shared codes always match what the app supports.

## ⌨️ Keyboard Shortcuts

| Action                        | Shortcut                      |
| :---------------------------- | :---------------------------- |
| Rotate Room (Clockwise)       | `R` (while dragging)          |
| Rotate Room (Counter-Clockwise) | `Shift` + `R` (while dragging) |
| Duplicate Room                | `Alt` + Drag Room             |
| Pan Canvas                    | `Shift` + Drag / Middle Mouse |
| Zoom In / Out                 | Mouse Wheel                   |
| Go to Floor Above             | `PageUp`                      |
| Go to Floor Below             | `PageDown`                    |
| Delete Selected Room          | `Delete` / `Backspace`        |
| Cancel Action / Close Panel   | `Escape`                      |

## 🗺️ Future Features (Roadmap)

This project is actively being developed. Here are some of the exciting features planned for the future:

### Design & Customization
*   **Furniture & Object Placement:** A new sidebar for placing furniture, decorations, and utility objects (anvils, mailboxes, etc.) within rooms.
*   **Doors, Windows & Archways:** Tools to precisely place and customize openings on room walls.
*   **Custom Room Shapes:** A polygon tool to draw unique room shapes for ultimate creative freedom.
*   **Texture & Material Customization:** Apply different wall, floor, and roof textures to individual rooms for a more personalized look.
*   **Outdoor & Landscaping:** Design gardens, pathways, fences, and other exterior elements around your structure.
*   **Automatic Roofing:** An intelligent tool to generate a roof over your top-most floor.

### Utility & Planning
*   **Cost & Material Estimation:** An integrated calculator to estimate the in-game resources and gold required to build your designed house.
*   **Measurement & Annotation Tools:** Add dimensions, labels, and notes directly onto your 2D floor plan.
*   **Layer System:** Toggleable layers for organizing elements like furniture, electrical wiring, or structural notes.
*   **Advanced Printing Options:** More controls for printing, including scale, grid lines, and room dimensions.

### Community & Sharing
*   **Community Hub & Layout Sharing:** An online gallery to upload, browse, and download layouts created by other players. Includes rating and commenting systems.
*   **Project Templates:** More pre-made templates like "Cozy Cottage," "Faction Embassy," or "Grand Feasting Hall."

### Enhanced Visualization
*   **First-Person Walkthrough Mode:** Explore your 3D creation from a character's point of view.
*   **Lighting & Shadow Simulation:** Place light sources and simulate how your home will look at different times of day.

## ⚖️ Disclaimer

WoW Player Housing Planner is a fan-made project and is not affiliated with, endorsed, sponsored, or specifically approved by Blizzard Entertainment. World of Warcraft is a trademark or registered trademark of Blizzard Entertainment, Inc., in the U.S. and/or other countries.