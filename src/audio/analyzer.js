export class AudioAnalyzer {
  constructor(analyserNode) {
    this.analyserNode = analyserNode;
    this.bufferLength = analyserNode.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.timeDataArray = new Uint8Array(this.bufferLength);

    // Smoothing state
    this.smoothedVolume = 0;
    this.smoothedBass = 0;

    // Smoothing factor (higher = smoother but more lag)
    this.smoothingFactor = 0.85;

    // Volume boost (real audio RMS is typically 0.01-0.1, we boost to 0-1+ range)
    // Reduced to 5.0 since users now control sensitivity directly
    this.volumeBoost = 5.0;

    // Power curve for dynamic range expansion (values < 1 expand dynamic range)
    this.volumePower = 0.7;
  }

  /**
   * Get audio features (volume, bass) from the analyser node
   * @param {number} maxVolume - Max volume scale factor for normalization
   * @returns {Object} { volume, bass, rawVolume }
   */
  getAudioFeatures(maxVolume = 1.0) {
    // Get time domain data for volume calculation
    this.analyserNode.getByteTimeDomainData(this.timeDataArray);

    // Calculate RMS (Root Mean Square) volume
    let sum = 0;
    for (let i = 0; i < this.timeDataArray.length; i++) {
      // Normalize from 0-255 to -1 to 1
      const normalized = (this.timeDataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    let rms = Math.sqrt(sum / this.timeDataArray.length);

    // Boost volume (real audio RMS is typically very small)
    rms = rms * this.volumeBoost;

    // Apply power curve for dynamic range expansion
    rms = Math.pow(rms, this.volumePower);

    // Apply max volume scaling (divide by maxVolume to normalize)
    // Lower maxVolume values treat louder sources as 100% (e.g., 0.5 = half the volume is 100%)
    // Higher maxVolume values require louder sources to reach 100% (e.g., 2.0 = needs double volume)
    rms = rms / maxVolume;

    // Clamp to 0-1 range
    rms = Math.min(1, Math.max(0, rms));

    // Apply exponential moving average smoothing
    this.smoothedVolume = this.smoothedVolume * this.smoothingFactor + rms * (1 - this.smoothingFactor);

    // Get frequency data for bass calculation
    this.analyserNode.getByteFrequencyData(this.dataArray);
    const bass = this.getAverageBass();
    this.smoothedBass = this.smoothedBass * this.smoothingFactor + bass * (1 - this.smoothingFactor);

    return {
      volume: this.smoothedVolume,
      bass: this.smoothedBass,
      rawVolume: rms
    };
  }

  /**
   * Calculate average bass frequency (20-250 Hz)
   * @returns {number} Bass level (0-1)
   */
  getAverageBass() {
    // Calculate which bins correspond to bass frequencies
    // Bin frequency = (sampleRate / fftSize) * binIndex
    const sampleRate = this.analyserNode.context.sampleRate;
    const fftSize = this.analyserNode.fftSize;
    const bassFreqMax = 250; // Hz

    const bassEndBin = Math.floor(bassFreqMax / (sampleRate / fftSize));
    const bassStartBin = 1; // Skip DC component

    let sum = 0;
    for (let i = bassStartBin; i <= bassEndBin && i < this.bufferLength; i++) {
      sum += this.dataArray[i];
    }

    // Normalize to 0-1 range
    return (sum / (bassEndBin - bassStartBin + 1)) / 255;
  }

  /**
   * Set the smoothing factor
   * @param {number} factor - 0 (no smoothing) to 0.99 (very smooth)
   */
  setSmoothingFactor(factor) {
    this.smoothingFactor = Math.max(0, Math.min(0.99, factor));
  }

  /**
   * Reset smoothed values
   */
  reset() {
    this.smoothedVolume = 0;
    this.smoothedBass = 0;
  }
}
