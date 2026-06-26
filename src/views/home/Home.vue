<template>
  <div class="app-layout home-view">
    <!-- Topbar locked at the absolute top of the viewport -->
    <header class="app-header fixed-topbar">
      <h1 class="header-title">Goods Receipting</h1>
      <router-link to="/" class="header-home-btn">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </router-link>
    </header>

    <!-- Main Workspace with dynamic viewport-height constraints to eliminate scroll -->
    <main class="app-content content-workspace">
      <div class="dashboard-grid">
        
        <!-- Tile 1: Register Delivery -->
        <router-link to="/services" class="tile-card">
          <div class="tile-icon-container">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </div>
          <div class="tile-label">Register Delivery</div>
        </router-link>

        <!-- Tile 2: Goods to Scan -->
        <router-link to="/services" class="tile-card">
          <div class="tile-meta">
            <div class="tile-icon-container">
<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round">
  <!-- Barcode Vertical Slats (Varied Widths and Offsets) -->
  <path d="M3 6h1v12H3zm3 0h2v12H6zm4 0h1v12h-1zm3 0h3v12h-3zm5 0h1v12h-1zm3 0h1v12h-1z" fill="currentColor" stroke="none" />
  
  <!-- Laser Target Line Overlay -->
  <line x1="1" y1="12" x2="23" y2="12" stroke="var(--accent-color)" stroke-width="1.5" />
</svg>
            </div>
            <div class="badge-count-wrapper">
              <span class="badge-number">1</span>
              <span class="badge-text">PEND.</span>
            </div>
          </div>
          <div class="tile-label">Goods to Scan</div>
        </router-link>

        <!-- Tile 3: Scanned Goods -->
        <router-link to="/services" class="tile-card">
          <div class="tile-meta">
            <div class="tile-icon-container">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="9" x2="15" y2="9"></line>
                <line x1="9" y1="13" x2="15" y2="13"></line>
                <line x1="9" y1="17" x2="15" y2="17"></line>
              </svg>
            </div>
            <div class="badge-count-wrapper">
              <span class="badge-number">1</span>
              <span class="badge-text">PEND.</span>
            </div>
          </div>
          <div class="tile-label">Scanned Goods 1</div>
        </router-link>

        <!-- Tile 4: Dashboard Home View -->
        <router-link to="/services" class="tile-card">
          <div class="tile-icon-container">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div class="tile-label">Home</div>
        </router-link>

        <!-- Tile 5: Lock Application System Hook -->
        <div class="tile-card interactive-action lock-tile" @click="handleLock">
          <div class="tile-icon-container">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div class="tile-label">Lock</div>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { storeActions } from '../../util/store.js';

const router = useRouter();

const handleLock = () => {
  storeActions.logout();
  router.push('/enter');
};
</script>

<style scoped>
/* Master Container Layout */
.app-layout {
  display: flex;
  flex-direction: column;
  /* Use dvh (Dynamic Viewport Height) to account for mobile URL browser toolbars */
  height: 100dvh; 
  overflow: hidden; /* Hard restriction to kill accidental screen scrolling */
  box-sizing: border-box;
}

/* Topbar Layout Locking */
.fixed-topbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 56px; /* Set rigid explicit header boundary height */
  z-index: 100;
  box-sizing: border-box;
  background-color: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
}

.header-title {
  font-family: monospace;
  font-size: 1.2rem;
  margin: 0;
  color: var(--text-main);
}

/* Screen container offset adjustment and flex alignment */
.content-workspace {
/*
  flex: 1;
  margin-top: 56px;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
*/
}

/* Fluid, defensive grid structure layout */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem; /* Tighter padding margins on small physical hardware */
  width: 100%;
  box-sizing: border-box;
}

/* Optimized Mobile Tile Card */
.tile-card {
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1rem; /* Compact card margins */
  aspect-ratio: 1 / 1; 
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  box-sizing: border-box;
  font-family: monospace;
}

.interactive-action {
  cursor: pointer;
}

/* Metadata formatting items */
.tile-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
}

.tile-icon-container, .header-home-btn {
  color: var(--accent-color);
}

.tile-label {
  font-size: 0.85rem; /* Downscaled layout texts to survive layout clipping */
  line-height: 1.2;
  color: var(--text-main);
}

.badge-count-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 0.8;
}

.badge-number {
  font-size: 2.2rem;
  font-weight: normal;
  color: var(--text-main);
}

.badge-text {
  font-size: 0.6rem;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}
</style>

