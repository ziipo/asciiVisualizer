// Global application state
export const state = {
  // Audio sensitivity controls (user adjustable)
  waveSpeed: 2.0,         // Multiplier for how much audio affects speed
  waveAmplitude: 1.2,     // Multiplier for how much audio affects amplitude
  brightness: 1.5,        // Multiplier for how much audio affects brightness
  maxVolume: 1.0,         // Scale factor for normalizing volume (lower = louder sources treated as 100%)

  // Computed audio values (calculated in render loop)
  computedWaveSpeed: 0,
  computedWaveAmplitude: 0,
  computedBrightness: 0,

  // Manual control parameters
  cellSize: 18,
  noiseIntensity: 0.125,
  contrast: 1.0,
  hue: 210,
  saturation: 0.5,
  vignette: 1.0,
  vignetteIntensity: 0.5,
  threshold1: 0.2,
  threshold2: 0.4,
  threshold3: 0.6,
  threshold4: 0.8,
  threshold5: 1.0,
  seed: 42,

  // Audio state
  audioEnabled: false,
  audioSource: 'none', // 'mic' | 'file' | 'none'

  // Runtime state
  time: 0,
  paused: false,

  // Viewport
  width: window.innerWidth,
  height: window.innerHeight
};

// Helper to update state and trigger any necessary updates
export function updateState(updates) {
  Object.assign(state, updates);
}
