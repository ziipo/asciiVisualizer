export function initAudioControls(audioManager, state, updateUI) {
  const micBtn = document.getElementById('mic-btn');
  const fileBtn = document.getElementById('file-btn');
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

    // Trigger file input
    audioFileInput.click();
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
