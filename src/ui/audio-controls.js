export function initAudioControls(audioManager, state, updateUI) {
  const micBtn = document.getElementById('mic-btn');
  const fileBtn = document.getElementById('file-btn');
  const sampleBtn = document.getElementById('sample-btn');
  const stopBtn = document.getElementById('stop-audio-btn');
  const audioFileInput = document.getElementById('audio-file-input');
  const playPauseBtn = document.getElementById('play-pause-btn');
  const fileUploadDiv = document.querySelector('.file-upload');
  const fileNameSpan = document.getElementById('file-name');
  const audioStatus = document.getElementById('audio-status');

  // Microphone button
  micBtn.addEventListener('click', async () => {
    const success = await audioManager.switchToMic();

    if (success) {
      state.audioEnabled = true;
      state.audioSource = 'mic';

      // Update UI
      micBtn.classList.add('active');
      fileBtn.classList.remove('active');
      stopBtn.disabled = false;
      fileUploadDiv.style.display = 'none';

      audioStatus.textContent = 'Listening...';
      audioStatus.className = 'listening';
    }
  });

  // File button
  fileBtn.addEventListener('click', () => {
    // Show file upload controls
    fileUploadDiv.style.display = 'flex';
    fileBtn.classList.add('active');
    micBtn.classList.remove('active');
    sampleBtn.classList.remove('active');

    // Trigger file input
    audioFileInput.click();
  });

  // Sample button - loads the demo audio file
  sampleBtn.addEventListener('click', async () => {
    try {
      // Fetch the sample audio file
      const response = await fetch('/demo-sample.mp3');
      if (!response.ok) throw new Error('Failed to load sample');

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const file = new File([blob], 'Air Mail Special - Benny Goodman.mp3', { type: 'audio/mpeg' });

      // Load it as if it were uploaded
      const success = await audioManager.switchToFile(file);

      if (success) {
        state.audioEnabled = true;
        state.audioSource = 'file';

        // Update UI
        sampleBtn.classList.add('active');
        fileBtn.classList.remove('active');
        micBtn.classList.remove('active');
        stopBtn.disabled = false;
        playPauseBtn.disabled = false;
        playPauseBtn.textContent = 'Pause';
        fileNameSpan.textContent = 'Air Mail Special (Demo)';
        fileUploadDiv.style.display = 'flex';

        audioStatus.textContent = 'Playing: Air Mail Special (Demo)';
        audioStatus.className = 'playing';
      }
    } catch (err) {
      console.error('Failed to load sample:', err);
      alert('Failed to load demo sample. Please try uploading your own audio file.');
    }
  });

  // File input change
  audioFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const success = await audioManager.switchToFile(file);

    if (success) {
      state.audioEnabled = true;
      state.audioSource = 'file';

      // Update UI
      stopBtn.disabled = false;
      playPauseBtn.disabled = false;
      playPauseBtn.textContent = 'Pause';
      fileNameSpan.textContent = file.name;

      audioStatus.textContent = `Playing: ${file.name}`;
      audioStatus.className = 'playing';
    }
  });

  // Play/Pause button
  playPauseBtn.addEventListener('click', () => {
    const isPlaying = audioManager.toggleFilePlayback();

    playPauseBtn.textContent = isPlaying ? 'Pause' : 'Play';

    if (isPlaying) {
      audioStatus.textContent = `Playing: ${fileNameSpan.textContent}`;
      audioStatus.className = 'playing';
    } else {
      audioStatus.textContent = 'Paused';
      audioStatus.className = '';
    }
  });

  // Stop button
  stopBtn.addEventListener('click', () => {
    audioManager.stopCurrent();
    state.audioEnabled = false;
    state.audioSource = 'none';

    // Update UI
    micBtn.classList.remove('active');
    fileBtn.classList.remove('active');
    sampleBtn.classList.remove('active');
    stopBtn.disabled = true;
    playPauseBtn.disabled = true;
    playPauseBtn.textContent = 'Play';
    fileUploadDiv.style.display = 'none';

    audioStatus.textContent = 'No Audio';
    audioStatus.className = '';

    // Reset volume meter
    if (updateUI) {
      updateUI(0);
    }
  });
}

export function updateVolumeMeter(volume) {
  const volumeBar = document.getElementById('volume-bar');
  const volumeLabel = document.getElementById('volume-label');

  // Update bar width
  const percentage = Math.min(100, volume * 100);
  volumeBar.style.width = `${percentage}%`;

  // Update label
  volumeLabel.textContent = `Volume: ${percentage.toFixed(0)}%`;
}
