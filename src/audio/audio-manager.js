import { MicInput } from './mic-input.js';
import { FilePlayer } from './file-player.js';
import { AudioAnalyzer } from './analyzer.js';

export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.analyserNode = null;
    this.gainNode = null;

    this.micInput = new MicInput();
    this.filePlayer = new FilePlayer();
    this.analyzer = null;

    this.currentSource = 'none'; // 'mic' | 'file' | 'none'

    // Analyser configuration
    this.fftSize = 2048;
    this.smoothingTimeConstant = 0.8;
  }

  /**
   * Initialize the audio context and nodes
   * Must be called after user gesture (click, etc.)
   * @returns {Promise<boolean>} Success status
   */
  async init() {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create analyser node
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = this.fftSize;
      this.analyserNode.smoothingTimeConstant = this.smoothingTimeConstant;

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;

      // Connect analyser to gain to destination
      this.analyserNode.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // Create analyzer
      this.analyzer = new AudioAnalyzer(this.analyserNode);

      console.log('AudioContext initialized');
      return true;

    } catch (err) {
      console.error('Failed to initialize AudioContext:', err);
      alert('Failed to initialize audio system. Your browser may not support Web Audio API.');
      return false;
    }
  }

  /**
   * Ensure AudioContext is resumed (required by some browsers)
   */
  async resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('AudioContext resumed');
    }
  }

  /**
   * Switch to microphone input
   * @returns {Promise<boolean>} Success status
   */
  async switchToMic() {
    // Initialize audio context if not already done
    if (!this.audioContext) {
      const success = await this.init();
      if (!success) return false;
    }

    await this.resumeContext();

    // Stop any current source
    this.stopCurrent();

    // Start microphone
    const success = await this.micInput.start(this.audioContext, this.analyserNode);
    if (success) {
      this.currentSource = 'mic';
      this.analyzer.reset();
    }

    return success;
  }

  /**
   * Load and switch to audio file
   * @param {File} file - Audio file to load
   * @returns {Promise<boolean>} Success status
   */
  async switchToFile(file) {
    // Initialize audio context if not already done
    if (!this.audioContext) {
      const success = await this.init();
      if (!success) return false;
    }

    await this.resumeContext();

    // Stop any current source
    this.stopCurrent();

    // Load file
    const success = await this.filePlayer.loadFile(file, this.audioContext);
    if (success) {
      this.currentSource = 'file';
      this.analyzer.reset();
      // Auto-play the file
      this.filePlayer.play(this.audioContext, this.analyserNode);
    }

    return success;
  }

  /**
   * Toggle file playback (play/pause)
   * @returns {boolean} New playing state
   */
  toggleFilePlayback() {
    if (this.currentSource !== 'file') {
      console.warn('No file source active');
      return false;
    }

    return this.filePlayer.togglePlayPause(this.audioContext, this.analyserNode);
  }

  /**
   * Stop current audio source
   */
  stopCurrent() {
    if (this.micInput.isRunning()) {
      this.micInput.stop();
    }

    if (this.filePlayer.playing()) {
      this.filePlayer.stop();
    }

    this.currentSource = 'none';
    if (this.analyzer) {
      this.analyzer.reset();
    }
  }

  /**
   * Get audio analyzer instance
   * @returns {AudioAnalyzer|null}
   */
  getAnalyzer() {
    return this.analyzer;
  }

  /**
   * Get current audio source type
   * @returns {string} 'mic' | 'file' | 'none'
   */
  getCurrentSource() {
    return this.currentSource;
  }

  /**
   * Check if audio is currently active
   * @returns {boolean}
   */
  isActive() {
    return this.currentSource !== 'none';
  }

  /**
   * Get file player for external control
   * @returns {FilePlayer}
   */
  getFilePlayer() {
    return this.filePlayer;
  }

  /**
   * Set analyser FFT size
   * @param {number} size - Must be power of 2 (512, 1024, 2048, 4096, etc.)
   */
  setFFTSize(size) {
    if (this.analyserNode) {
      this.analyserNode.fftSize = size;
      this.fftSize = size;
    }
  }

  /**
   * Set analyser smoothing constant
   * @param {number} constant - 0 to 1
   */
  setSmoothingConstant(constant) {
    if (this.analyserNode) {
      this.analyserNode.smoothingTimeConstant = constant;
      this.smoothingTimeConstant = constant;
    }
  }

  /**
   * Dispose and clean up all resources
   */
  dispose() {
    this.stopCurrent();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    console.log('AudioManager disposed');
  }
}
