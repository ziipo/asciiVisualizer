import { WebGLRenderer } from './core/webgl-renderer.js';
import { state } from './core/state.js';
import { AudioManager } from './audio/audio-manager.js';
import { AudioMapper } from './utils/mapping.js';
import { initControls, updateVolumeMeter, updateAudioDrivenParams } from './ui/controls.js';

// Global instances
let renderer;
let audioManager;
let audioMapper;
let lastTime = 0;

/**
 * Initialize the application
 */
async function init() {
  try {
    // Get canvas element
    const canvas = document.getElementById('canvas');
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    // Initialize WebGL renderer
    renderer = new WebGLRenderer(canvas);
    await renderer.init();

    // Initialize audio manager (deferred until user gesture)
    audioManager = new AudioManager();

    // Initialize audio mapper
    audioMapper = new AudioMapper();

    // Initialize UI controls
    initControls(audioManager, state);

    // Update state dimensions
    state.width = canvas.width;
    state.height = canvas.height;

    // Listen for window resize
    window.addEventListener('resize', () => {
      state.width = canvas.width;
      state.height = canvas.height;
    });

    // Start render loop
    requestAnimationFrame(render);

    console.log('Application initialized successfully');

  } catch (err) {
    console.error('Failed to initialize application:', err);
    alert('Failed to initialize the visualization. Please check the console for details.');
  }
}

/**
 * Main render loop
 * @param {number} currentTime - Current timestamp from requestAnimationFrame
 */
function render(currentTime) {
  // Calculate delta time
  const deltaTime = lastTime === 0 ? 0 : (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  // Update audio-driven parameters if audio is enabled
  if (state.audioEnabled && audioManager.isActive()) {
    const analyzer = audioManager.getAnalyzer();

    if (analyzer) {
      // Get audio features (pass maxVolume for normalization)
      const audioFeatures = analyzer.getAudioFeatures(state.maxVolume);

      // Map audio to normalized values (0-1 range based on volume)
      const mappedParams = audioMapper.mapAudioToParams(audioFeatures);

      // Apply user sensitivity multipliers to get final computed values
      state.computedWaveSpeed = mappedParams.waveSpeed * state.waveSpeed;
      state.computedWaveAmplitude = mappedParams.waveAmplitude * state.waveAmplitude;
      state.computedBrightness = mappedParams.brightness * state.brightness;

      // Update UI displays
      updateVolumeMeter(audioFeatures.volume);
    }
  } else {
    // No audio - gradually fade to zero
    state.computedWaveSpeed = audioMapper.lerp(state.computedWaveSpeed, 0, 0.05);
    state.computedWaveAmplitude = audioMapper.lerp(state.computedWaveAmplitude, 0, 0.05);
    state.computedBrightness = audioMapper.lerp(state.computedBrightness, 0, 0.05);
  }

  // Update time accumulator (scaled by computed wave speed)
  if (!state.paused) {
    state.time += deltaTime * (state.computedWaveSpeed || 0.2);
  }

  // Render frame
  renderer.render(state);

  // Continue loop
  requestAnimationFrame(render);
}

/**
 * Handle visibility change (pause when tab is hidden)
 */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    state.paused = true;
  } else {
    state.paused = false;
    lastTime = 0; // Reset time to avoid large delta
  }
});

/**
 * Keyboard shortcuts
 */
document.addEventListener('keydown', (e) => {
  // Space: toggle pause
  if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
    e.preventDefault();
    state.paused = !state.paused;
    console.log(state.paused ? 'Paused' : 'Resumed');
  }

  // F: toggle fullscreen
  if (e.code === 'KeyF') {
    e.preventDefault();
    toggleFullscreen();
  }
});

/**
 * Toggle fullscreen mode
 */
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.error('Failed to enter fullscreen:', err);
    });
  } else {
    document.exitFullscreen();
  }
}

/**
 * Handle window unload (cleanup)
 */
window.addEventListener('beforeunload', () => {
  if (renderer) {
    renderer.dispose();
  }
  if (audioManager) {
    audioManager.dispose();
  }
});

// Start the application
init();
