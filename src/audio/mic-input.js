export class MicInput {
  constructor() {
    this.mediaStream = null;
    this.sourceNode = null;
    this.isActive = false;
  }

  /**
   * Start capturing microphone input
   * @param {AudioContext} audioContext
   * @param {AnalyserNode} analyserNode
   * @returns {Promise<boolean>} Success status
   */
  async start(audioContext, analyserNode) {
    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,  // We want raw audio
          noiseSuppression: false,  // No processing
          autoGainControl: false    // Preserve natural dynamics
        }
      });

      // Create source node from stream
      this.sourceNode = audioContext.createMediaStreamSource(this.mediaStream);

      // Connect to analyser
      this.sourceNode.connect(analyserNode);

      this.isActive = true;
      console.log('Microphone input started');
      return true;

    } catch (err) {
      console.error('Microphone access denied:', err);

      // Handle specific error types
      if (err.name === 'NotAllowedError') {
        alert('Microphone permission denied. Please allow microphone access and try again.');
      } else if (err.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else {
        alert('Failed to access microphone: ' + err.message);
      }

      return false;
    }
  }

  /**
   * Stop microphone input and clean up resources
   */
  stop() {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      // Stop all audio tracks
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.isActive = false;
    console.log('Microphone input stopped');
  }

  /**
   * Check if microphone is currently active
   * @returns {boolean}
   */
  isRunning() {
    return this.isActive;
  }
}
