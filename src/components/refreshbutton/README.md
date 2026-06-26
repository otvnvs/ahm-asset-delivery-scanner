# RefreshButton Component

A stylized, floating action button (FAB) that provides an on-screen macro trigger to reload the user application context window. It features self-contained vector paths and optimized hover transition mechanics.

## Features
* **Fixed Viewport Overlay**: Anchors itself at the bottom-right corner of the application interface (`position: fixed`). A high `z-index` ensures it floats cleanly over scrollable elements (such as `DataGridDisplay.vue`) without disrupting text layouts.
* **SVG Vector Art**: Features an embedded stroke-based vector path that scales smoothly without distortion on high-density mobile retina displays.
* **Micro-Interaction Transforms**: Implements hardware-accelerated CSS animations. Tapping or hovering triggers a `-180deg` rotation and a slight elevation lift (`translateY`).
* **Hard Reload Pipeline**: Avoids complex state-tracking variables. Tapping the button directly forces a clean, standard page-level initialization string pass via `window.location.reload()`.

## Component Properties (Props)
This presentation component runs autonomously and does not require any input properties (Props).

## Component Events (Emits)
This component triggers a window-level reload natively and does not dispatch explicit child-to-parent Vue events.

## Integration Usage
```html
<!-- Place at the root layout or view container wrapper level -->
<RefreshButton />
```

