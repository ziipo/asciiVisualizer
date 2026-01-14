export class FilePlayer {
  constructor() {
    this.audioBuffer = null;
    this.sourceNode = null;
    this.isPlaying = false;
    this.duration = 0;
    this.fileName = '';
  }

  /**
   * Load an audio file
   * @param {File} file - Audio file from input
   * @param {AudioContext} audioContext
   * @returns {Promise<boolean>} Success status
   */
  async loadFile(file, audioContext) {
    try {
      this.fileName = file.name;

      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();

      // Decode audio data
      this.audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      this.duration = this.audioBuffer.duration;

      console.log(`Loaded audio file: ${this.fileName} (${this.duration.toFixed(2)}s)`);
      return true;

    } catch (err) {
      console.error('Failed to load audio file:', err);
      alert('Failed to load audio file. Please try a different file (MP3, WAV, OGG).');
      return false;
    }
  }

  /**
   * Start playing the loaded audio file
   * @param {AudioContext} audioContext
   * @param {AnalyserNode} analyserNode
   * @returns {boolean} Success status
   */
  play(audioContext, analyserNode) {
    if (!this.audioBuffer) {
      console.warn('No audio file loaded');
      return false;
    }

    // Stop any existing playback
    this.stop();

    // Create new buffer source (can only be used once)
    this.sourceNode = audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.loop = true; // Loop for continuous visualization

    // Connect to analyser
    this.sourceNode.connect(analyserNode);

    // Start playback
    this.sourceNode.start(0);
    this.isPlaying = true;

    console.log('Playing audio file');
    return true;
  }

  /**
   * Stop playback
   */
  stop() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (err) {
        // Already stopped
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    this.isPlaying = false;
    console.log('Stopped audio file');
  }

  /**
   * Toggle play/pause
   * @param {AudioContext} audioContext
   * @param {AnalyserNode} analyserNode
   * @returns {boolean} New playing state
   */
  togglePlayPause(audioContext, analyserNode) {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.play(audioContext, analyserNode);
      return true;
    }
  }

  /**
   * Check if audio is currently playing
   * @returns {boolean}
   */
  playing() {
    return this.isPlaying;
  }

  /**
   * Get loaded file information
   * @returns {Object} { fileName, duration }
   */
  getInfo() {
    return {
      fileName: this.fileName,
      duration: this.duration
    };
  }

  /**
   * Check if a file is loaded
   * @returns {boolean}
   */
  hasFile() {
    return this.audioBuffer !== null;
  }
}
