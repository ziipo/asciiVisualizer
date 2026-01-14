import { initAudioControls, updateVolumeMeter } from './audio-controls.js';
import { initParameterSliders, updateAudioDrivenParams } from './parameter-sliders.js';

export function initControls(audioManager, state) {
  // Initialize parameter sliders
  initParameterSliders(state);

  // Initialize audio controls
  initAudioControls(audioManager, state, updateVolumeMeter);

  console.log('Controls initialized');
}

export { updateVolumeMeter, updateAudioDrivenParams };
