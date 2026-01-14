export class AudioMapper {
  constructor() {
    // Configuration for audio-to-visual parameter mapping
    // These now return normalized 0-1 values that will be multiplied by user sensitivity
    this.config = {
      waveSpeed: {
        base: 0.15,          // Minimum speed during silence
        audioMultiplier: 0.85 // Maps volume to 0.15-1.0 range
      },
      waveAmplitude: {
        base: 0.1,           // Minimum amplitude during silence
        audioMultiplier: 0.9 // Maps volume to 0.1-1.0 range
      },
      brightness: {
        base: 0.0,           // MUST be 0 for blank during silence
        audioMultiplier: 1.0 // Maps volume to 0.0-1.0 range
      }
    };

    // Silence threshold (volume below this is treated as silence)
    this.silenceThreshold = 0.005;

    // Smoothed parameter state
    this.smoothedParams = {
      waveSpeed: 0,
      waveAmplitude: 0,
      brightness: 0
    };

    // Smoothing rates (alpha values for lerp)
    this.smoothingRates = {
      waveSpeed: 0.1,
      waveAmplitude: 0.15,
      brightnessAttack: 0.1,   // How fast brightness increases
      brightnessDecay: 0.05     // How fast brightness decreases (slower for fade-out)
    };
  }

  /**
   * Map audio features to visual parameters
   * @param {Object} audioFeatures - { volume, bass, rawVolume }
   * @returns {Object} Mapped parameters { waveSpeed, waveAmplitude, brightness }
   */
  mapAudioToParams(audioFeatures) {
    const { volume } = audioFeatures;

    // Apply silence threshold with smooth fade
    let effectiveVolume = 0;
    if (volume < this.silenceThreshold) {
      effectiveVolume = 0;
    } else {
      // Normalize to 0-1 range above threshold
      effectiveVolume = (volume - this.silenceThreshold) / (1 - this.silenceThreshold);
      effectiveVolume = Math.min(1, effectiveVolume); // Clamp to 1
    }

    // Map volume to target parameters
    const targetWaveSpeed = this.config.waveSpeed.base +
      (effectiveVolume * this.config.waveSpeed.audioMultiplier);

    const targetWaveAmplitude = this.config.waveAmplitude.base +
      (effectiveVolume * this.config.waveAmplitude.audioMultiplier);

    const targetBrightness = this.config.brightness.base +
      (effectiveVolume * this.config.brightness.audioMultiplier);

    // Apply smoothing with lerp (linear interpolation)
    this.smoothedParams.waveSpeed = this.lerp(
      this.smoothedParams.waveSpeed,
      targetWaveSpeed,
      this.smoothingRates.waveSpeed
    );

    this.smoothedParams.waveAmplitude = this.lerp(
      this.smoothedParams.waveAmplitude,
      targetWaveAmplitude,
      this.smoothingRates.waveAmplitude
    );

    // Brightness uses different rates for attack (increase) and decay (decrease)
    const brightnessRate = targetBrightness > this.smoothedParams.brightness
      ? this.smoothingRates.brightnessAttack
      : this.smoothingRates.brightnessDecay;

    this.smoothedParams.brightness = this.lerp(
      this.smoothedParams.brightness,
      targetBrightness,
      brightnessRate
    );

    return { ...this.smoothedParams };
  }

  /**
   * Linear interpolation
   * @param {number} current - Current value
   * @param {number} target - Target value
   * @param {number} alpha - Interpolation factor (0-1)
   * @returns {number} Interpolated value
   */
  lerp(current, target, alpha) {
    return current + (target - current) * alpha;
  }

  /**
   * Set mapping configuration for a parameter
   * @param {string} param - Parameter name (waveSpeed, waveAmplitude, brightness)
   * @param {number} base - Base value
   * @param {number} multiplier - Audio multiplier
   */
  setMapping(param, base, multiplier) {
    if (this.config[param]) {
      this.config[param].base = base;
      this.config[param].audioMultiplier = multiplier;
    }
  }

  /**
   * Set silence threshold
   * @param {number} threshold - Threshold value (0-1)
   */
  setSilenceThreshold(threshold) {
    this.silenceThreshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * Set smoothing rate for a parameter
   * @param {string} param - Parameter name
   * @param {number} rate - Smoothing rate (0-1)
   */
  setSmoothingRate(param, rate) {
    if (this.smoothingRates[param] !== undefined) {
      this.smoothingRates[param] = Math.max(0, Math.min(1, rate));
    }
  }

  /**
   * Reset smoothed parameters
   */
  reset() {
    this.smoothedParams.waveSpeed = 0;
    this.smoothedParams.waveAmplitude = 0;
    this.smoothedParams.brightness = 0;
  }

  /**
   * Get current configuration
   * @returns {Object} Configuration object
   */
  getConfig() {
    return {
      config: { ...this.config },
      silenceThreshold: this.silenceThreshold,
      smoothingRates: { ...this.smoothingRates }
    };
  }
}
