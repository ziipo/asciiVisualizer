# Audio-Reactive ASCII Clouds

A WebGL-powered audio visualization that renders flowing ASCII cloud patterns driven by sound. The visualization responds to both microphone input and audio files, with complete blank during silence and dynamic reactions to volume through wave speed, amplitude, and brightness.

![Audio-Reactive ASCII Clouds](https://img.shields.io/badge/WebGL-2.0-blue) ![Vite](https://img.shields.io/badge/Vite-6.0-646CFF) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Dual Audio Sources**: Switch between live microphone input and audio file playback
- **Blank During Silence**: Visualization fades to complete black when no audio is present
- **User-Controlled Sensitivity**: Adjust how much audio affects speed, amplitude, and brightness
- **Two-Pass WebGL Rendering**: Simplex 3D noise generation with domain warping → ASCII glyph rendering
- **Real-Time Audio Analysis**: Professional FFT and RMS volume calculation via Web Audio API
- **Customizable Parameters**: Control noise settings, colors, vignette, and ASCII glyph thresholds
- **Responsive UI**: Clean control panel with real-time feedback

## Demo

[Live Demo](https://ziipo.github.io/asciiVisualizer) *(Deploy to GitHub Pages to activate)*

## Installation

```bash
# Clone the repository
git clone https://github.com/ziipo/asciiVisualizer.git
cd asciiVisualizer

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`

## Usage

### Audio Sources

**Load Sample:**
1. Click the "Load Sample" button to instantly load a demo audio file
2. Features a 60-second clip of "Air Mail Special" by Benny Goodman (1941-1942, public domain)
3. Perfect for testing the visualization without uploading your own files

**Microphone:**
1. Click the "Microphone" button
2. Allow microphone permissions when prompted
3. Speak, play music, or make sounds - watch the visualization react!

**Audio File:**
1. Click the "Audio File" button
2. Select an audio file (MP3, WAV, OGG)
3. The file will auto-play and loop
4. Use Play/Pause to control playback

### Controls

#### Audio Sensitivity
- **Max Volume Scale** (0.2-3.0): Normalizes audio volume - lower values for loud sources, higher for quiet sources
- **Speed Sensitivity** (0-5): How much audio affects animation speed
- **Amplitude Sensitivity** (0-3): How much audio affects warping intensity
- **Brightness Sensitivity** (0-5): How much audio affects visibility

#### Visual Parameters
- **Cell Size**: ASCII character grid resolution
- **Noise Intensity**: Fine detail level in the noise
- **Seed**: Variation in noise pattern
- **Hue/Saturation/Contrast**: Color controls
- **Vignette**: Edge darkening effect
- **Glyph Thresholds**: Which ASCII characters (`.`, `-`, `+`, `O`, `X`) appear at different brightness levels

### Keyboard Shortcuts
- **Space**: Pause/Resume animation
- **F**: Toggle fullscreen mode
- **C**: Collapse/Expand control panel

## Technical Details

### Architecture

```
asciiVisualizer/
├── src/
│   ├── main.js              # Application entry point
│   ├── core/
│   │   ├── webgl-renderer.js  # Two-pass WebGL rendering
│   │   ├── shaders.js         # Simplex noise and ASCII shaders
│   │   └── state.js           # Global state management
│   ├── audio/
│   │   ├── audio-manager.js   # Audio source management
│   │   ├── mic-input.js       # Microphone capture
│   │   ├── file-player.js     # Audio file playback
│   │   └── analyzer.js        # RMS volume calculation
│   ├── ui/
│   │   ├── controls.js        # UI initialization
│   │   ├── audio-controls.js  # Audio source controls
│   │   └── parameter-sliders.js # Parameter controls
│   └── utils/
│       └── mapping.js         # Audio-to-visual mapping
└── styles/
    └── main.css
```

### Rendering Pipeline

1. **Pass 1 (Noise Generation)**: Generates Simplex 3D noise with domain warping using fractional Brownian motion (FBM), renders to framebuffer texture
2. **Pass 2 (ASCII Rendering)**: Samples noise texture and renders ASCII glyphs using signed distance fields (SDF), applies HSL color transformation and vignette

### Audio Processing

1. **AudioContext** → AnalyserNode (FFT size: 2048, smoothing: 0.8)
2. **RMS Volume Calculation** from time domain data with boost and power curve
3. **Multi-stage Smoothing**: Built-in FFT smoothing + exponential moving average + lerp interpolation
4. **Parameter Mapping**: Normalized volume multiplied by user sensitivity controls

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari (may have limited microphone support)

Requires WebGL 2.0 support.

## Credits

Inspired by the ASCII cloud visualization patterns from [caidanw's portfolio](https://github.com/caidanw/caidanw.github.io).

## License

MIT License - feel free to use and modify for your own projects!

## Contributing

Issues and pull requests are welcome! Feel free to:
- Report bugs
- Suggest new features
- Improve documentation
- Optimize performance

## Development

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Troubleshooting

**Microphone not working:**
- Ensure browser has microphone permissions
- Check that microphone is not being used by another application
- Try reloading the page

**Audio file not playing:**
- Supported formats: MP3, WAV, OGG
- Some browsers may have codec limitations
- Try a different file format

**Visualization barely visible:**
- Increase brightness sensitivity
- Lower max volume scale for loud sources
- Adjust glyph thresholds

**Performance issues:**
- Lower cell size for faster rendering
- Close other browser tabs
- Reduce canvas resolution (modify in code)
