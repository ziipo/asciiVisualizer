export function initParameterSliders(state) {
  // List of manual control parameters
  const parameters = [
    'maxVolume',
    'waveSpeed',
    'waveAmplitude',
    'brightness',
    'cellSize',
    'noiseIntensity',
    'hue',
    'saturation',
    'contrast',
    'threshold1',
    'threshold2',
    'threshold3',
    'threshold4',
    'threshold5'
  ];

  // Set up event listeners for each parameter
  parameters.forEach(param => {
    const slider = document.getElementById(param);
    const valueDisplay = document.getElementById(`${param}-value`);

    if (!slider || !valueDisplay) {
      console.warn(`Slider or value display not found for ${param}`);
      return;
    }

    // Update on input
    slider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      state[param] = value;

      // Update value display
      valueDisplay.textContent = formatValue(value, param);
    });

    // Set initial value
    slider.value = state[param];
    valueDisplay.textContent = formatValue(state[param], param);
  });
}

// This function is no longer needed since sensitivity is now user-controlled
// Kept for backward compatibility but does nothing
export function updateAudioDrivenParams(params) {
  // Audio-driven values are now controlled by user sliders
}

/**
 * Format value for display based on parameter type
 * @param {number} value
 * @param {string} param
 * @returns {string}
 */
function formatValue(value, param) {
  // Integer parameters
  if (param === 'cellSize' || param === 'seed' || param === 'hue') {
    return Math.round(value).toString();
  }

  // Sensitivity parameters (1 decimal place for cleaner display)
  if (param === 'waveSpeed' || param === 'waveAmplitude' || param === 'brightness' || param === 'maxVolume') {
    return value.toFixed(1);
  }

  // Float parameters (2 decimal places)
  return value.toFixed(2);
}
