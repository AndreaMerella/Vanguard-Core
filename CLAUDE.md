# Vanguard-Core Project Guidelines

## 🛡️ CRITICAL: UI INVARIANTS (DO NOT TOUCH)
- **Clock & Ticker:** The CSS and JS responsible for the time display and news ticker are 100% stable. Do NOT refactor, rename classes, or move these files.
- **HUD Layout:** The grid and absolute positioning of the "DRIS//CORE" interface must remain intact.

## 🛠️ FIX PRIORITIES
1. **3D Logo Loading:** - Always use **relative paths** (e.g., `./assets/logo.glb`) for GitHub Pages.
   - Use a `LoadingManager` to ensure the model exists before rendering.
2. **WebMIDI:**
   - Must be initialized inside a user gesture (Click event). 
   - Add a fallback message if `navigator.requestMIDIAccess` is denied.
3. **P2P Calling:**
   - Ensure `secure: true` and `port: 443` in PeerJS/WebRTC config.
   - Redirect logging to the "GHOST> " terminal in the UI, not the browser console.

## ⚙️ DEPLOYMENT RULES
- **GitHub Pages:** Always include a `.nojekyll` file in the root to prevent asset blocking.
- **Paths:** No absolute paths (starting with `/`). Everything must be relative to the repo root.
