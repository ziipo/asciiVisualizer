(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const n of r.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&i(n)}).observe(document,{childList:!0,subtree:!0});function t(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(s){if(s.ep)return;s.ep=!0;const r=t(s);fetch(s.href,r)}})();const _=`#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`,T=`#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform float u_waveAmplitude;
uniform float u_noiseIntensity;
uniform float u_seed;
uniform vec2 u_resolution;

// Simplex 3D Noise implementation
// Based on: https://github.com/ashima/webgl-noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  // Permutations
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  // Gradients
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  // Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Fractional Brownian Motion
float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 1.0;
  float frequency = 1.0;

  for (int i = 0; i < 4; i++) {
    value += amplitude * snoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  // Normalize coordinates with aspect ratio correction
  vec2 uv = v_uv;
  float aspect = u_resolution.x / u_resolution.y;
  uv.x *= aspect;

  // Domain warping - create flowing effect
  vec2 q = vec2(
    fbm(vec3(uv * 2.0 + u_seed, u_time * 0.3)),
    fbm(vec3(uv * 2.0 + u_seed + 100.0, u_time * 0.3))
  );

  vec2 r = vec2(
    fbm(vec3(uv * 2.0 + q * u_waveAmplitude + u_seed + 200.0, u_time * 0.2)),
    fbm(vec3(uv * 2.0 + q * u_waveAmplitude + u_seed + 300.0, u_time * 0.2))
  );

  vec2 warpedUV = uv + r * u_waveAmplitude;

  // Generate multi-octave noise
  float noise = 0.0;
  noise += fbm(vec3(warpedUV * 1.0, u_time * 0.5)) * 1.0;
  noise += fbm(vec3(warpedUV * 2.0, u_time * 0.7)) * 0.5 * u_noiseIntensity;
  noise += fbm(vec3(warpedUV * 4.0, u_time * 0.9)) * 0.25 * u_noiseIntensity;

  // Normalize to 0-1 range
  noise = noise * 0.5 + 0.5;

  fragColor = vec4(vec3(noise), 1.0);
}
`,C=`#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_noiseTex;
uniform float u_cellSize;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_hue;
uniform float u_saturation;
uniform float u_vignette;
uniform float u_vignetteIntensity;
uniform float u_threshold1;
uniform float u_threshold2;
uniform float u_threshold3;
uniform float u_threshold4;
uniform float u_threshold5;
uniform vec2 u_resolution;

// HSV to RGB conversion
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Signed Distance Field functions for ASCII characters

// Dot (.)
float dot_sdf(vec2 p) {
  vec2 center = vec2(0.5, 0.3);
  float dist = length(p - center) - 0.08;
  return 1.0 - smoothstep(0.0, 0.05, dist);
}

// Dash (-)
float dash_sdf(vec2 p) {
  vec2 center = vec2(0.5, 0.5);
  float dist = abs(p.y - center.y) - 0.05;
  float width = step(0.25, p.x) * step(p.x, 0.75);
  dist = max(dist, 1.0 - width);
  return 1.0 - smoothstep(0.0, 0.05, dist);
}

// Plus (+)
float plus_sdf(vec2 p) {
  vec2 center = vec2(0.5);
  vec2 d = abs(p - center);
  float horizontal = step(d.y, 0.06) * step(d.x, 0.3);
  float vertical = step(d.x, 0.06) * step(d.y, 0.3);
  return max(horizontal, vertical);
}

// Ring (O)
float ring_sdf(vec2 p) {
  vec2 center = vec2(0.5);
  float dist = abs(length(p - center) - 0.25);
  return 1.0 - smoothstep(0.05, 0.1, dist);
}

// Cross (X)
float cross_sdf(vec2 p) {
  vec2 center = vec2(0.5);
  vec2 q = p - center;

  // Rotate 45 degrees
  float angle = 0.785398; // 45 degrees in radians
  vec2 rotated = vec2(
    q.x * cos(angle) - q.y * sin(angle),
    q.x * sin(angle) + q.y * cos(angle)
  );

  vec2 d = abs(rotated);
  float horizontal = step(d.y, 0.06) * step(d.x, 0.35);
  float vertical = step(d.x, 0.06) * step(d.y, 0.35);
  return max(horizontal, vertical);
}

void main() {
  // Calculate which cell we're in
  vec2 pixelCoord = v_uv * u_resolution;
  vec2 cellCoord = floor(pixelCoord / u_cellSize);
  vec2 cellUV = fract(pixelCoord / u_cellSize);

  // Sample noise texture at cell center
  vec2 sampleUV = (cellCoord * u_cellSize + u_cellSize * 0.5) / u_resolution;
  float noise = texture(u_noiseTex, sampleUV).r;

  // Apply brightness (CRITICAL: this creates blank during silence)
  float brightness = noise * u_brightness;

  // Apply contrast
  brightness = (brightness - 0.5) * u_contrast + 0.5;
  brightness = clamp(brightness, 0.0, 1.0);

  // Select glyph based on thresholds
  float glyph = 0.0;
  if (brightness < u_threshold1) {
    glyph = 0.0; // Blank
  } else if (brightness < u_threshold2) {
    glyph = dot_sdf(cellUV);
  } else if (brightness < u_threshold3) {
    glyph = dash_sdf(cellUV);
  } else if (brightness < u_threshold4) {
    glyph = plus_sdf(cellUV);
  } else if (brightness < u_threshold5) {
    glyph = ring_sdf(cellUV);
  } else {
    glyph = cross_sdf(cellUV);
  }

  // Convert brightness to HSV color
  vec3 color = hsv2rgb(vec3(u_hue / 360.0, u_saturation, brightness));

  // Apply vignette
  float dist = length(v_uv - 0.5);
  float vignette = 1.0 - smoothstep(u_vignette - 0.3, u_vignette, dist) * u_vignetteIntensity;

  // Final color
  vec3 finalColor = color * glyph * vignette;

  fragColor = vec4(finalColor, 1.0);
}
`;class P{constructor(e){this.canvas=e,this.gl=null,this.programs={},this.framebuffer=null,this.noiseTexture=null,this.quadBuffer=null}async init(){if(this.gl=this.canvas.getContext("webgl2",{alpha:!1,antialias:!1,depth:!1}),!this.gl)throw new Error("WebGL 2 is not supported in this browser");this.gl,this.programs.noise=this.createProgram(_,T),this.programs.ascii=this.createProgram(_,C),this.createFramebuffer(),this.createQuad(),this.resize(),window.addEventListener("resize",()=>this.resize()),console.log("WebGL renderer initialized")}createShader(e,t){const i=this.gl,s=i.createShader(e);if(i.shaderSource(s,t),i.compileShader(s),!i.getShaderParameter(s,i.COMPILE_STATUS)){const r=i.getShaderInfoLog(s);throw i.deleteShader(s),new Error("Shader compilation error: "+r)}return s}createProgram(e,t){const i=this.gl,s=this.createShader(i.VERTEX_SHADER,e),r=this.createShader(i.FRAGMENT_SHADER,t),n=i.createProgram();if(i.attachShader(n,s),i.attachShader(n,r),i.linkProgram(n),!i.getProgramParameter(n,i.LINK_STATUS)){const c=i.getProgramInfoLog(n);throw i.deleteProgram(n),new Error("Program linking error: "+c)}return i.deleteShader(s),i.deleteShader(r),n}createFramebuffer(){const e=this.gl;if(this.noiseTexture=e.createTexture(),e.bindTexture(e.TEXTURE_2D,this.noiseTexture),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,this.canvas.width,this.canvas.height,0,e.RGBA,e.UNSIGNED_BYTE,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),this.framebuffer=e.createFramebuffer(),e.bindFramebuffer(e.FRAMEBUFFER,this.framebuffer),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,this.noiseTexture,0),e.checkFramebufferStatus(e.FRAMEBUFFER)!==e.FRAMEBUFFER_COMPLETE)throw new Error("Framebuffer is not complete");e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindTexture(e.TEXTURE_2D,null)}createQuad(){const e=this.gl,t=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);this.quadBuffer=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,this.quadBuffer),e.bufferData(e.ARRAY_BUFFER,t,e.STATIC_DRAW)}setUniforms(e,t){const i=this.gl;for(const[s,r]of Object.entries(t)){const n=i.getUniformLocation(e,s);n!==null&&(typeof r=="number"?i.uniform1f(n,r):Array.isArray(r)&&(r.length===2?i.uniform2fv(n,r):r.length===3?i.uniform3fv(n,r):r.length===4&&i.uniform4fv(n,r)))}}setupVertexAttribute(e,t){const i=this.gl,s=i.getAttribLocation(e,t);s!==-1&&(i.enableVertexAttribArray(s),i.vertexAttribPointer(s,2,i.FLOAT,!1,0,0))}render(e){const t=this.gl;t.bindFramebuffer(t.FRAMEBUFFER,this.framebuffer),t.viewport(0,0,this.canvas.width,this.canvas.height),t.clearColor(0,0,0,1),t.clear(t.COLOR_BUFFER_BIT),t.useProgram(this.programs.noise),t.bindBuffer(t.ARRAY_BUFFER,this.quadBuffer),this.setupVertexAttribute(this.programs.noise,"a_position"),this.setUniforms(this.programs.noise,{u_time:e.time,u_waveAmplitude:e.computedWaveAmplitude,u_noiseIntensity:e.noiseIntensity,u_seed:e.seed,u_resolution:[e.width,e.height]}),t.drawArrays(t.TRIANGLES,0,6),t.bindFramebuffer(t.FRAMEBUFFER,null),t.viewport(0,0,this.canvas.width,this.canvas.height),t.clearColor(0,0,0,1),t.clear(t.COLOR_BUFFER_BIT),t.useProgram(this.programs.ascii),t.bindBuffer(t.ARRAY_BUFFER,this.quadBuffer),this.setupVertexAttribute(this.programs.ascii,"a_position"),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.noiseTexture),this.setUniforms(this.programs.ascii,{u_noiseTex:0,u_cellSize:e.cellSize,u_brightness:e.computedBrightness,u_contrast:e.contrast,u_hue:e.hue,u_saturation:e.saturation,u_vignette:e.vignette,u_vignetteIntensity:e.vignetteIntensity,u_threshold1:e.threshold1,u_threshold2:e.threshold2,u_threshold3:e.threshold3,u_threshold4:e.threshold4,u_threshold5:e.threshold5,u_resolution:[e.width,e.height]}),t.drawArrays(t.TRIANGLES,0,6)}resize(){const e=this.gl,t=window.devicePixelRatio||1;this.canvas.width=window.innerWidth*t,this.canvas.height=window.innerHeight*t,this.canvas.style.width=window.innerWidth+"px",this.canvas.style.height=window.innerHeight+"px",e.bindTexture(e.TEXTURE_2D,this.noiseTexture),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,this.canvas.width,this.canvas.height,0,e.RGBA,e.UNSIGNED_BYTE,null),e.bindTexture(e.TEXTURE_2D,null)}dispose(){const e=this.gl;this.quadBuffer&&e.deleteBuffer(this.quadBuffer),this.noiseTexture&&e.deleteTexture(this.noiseTexture),this.framebuffer&&e.deleteFramebuffer(this.framebuffer),this.programs.noise&&e.deleteProgram(this.programs.noise),this.programs.ascii&&e.deleteProgram(this.programs.ascii)}}const a={waveSpeed:.7,waveAmplitude:1.5,brightness:2.4,maxVolume:1.2,computedWaveSpeed:0,computedWaveAmplitude:0,computedBrightness:0,cellSize:18,noiseIntensity:.125,contrast:1,hue:210,saturation:.5,vignette:.5,vignetteIntensity:.9,threshold1:.2,threshold2:.4,threshold3:.6,threshold4:.8,threshold5:1,seed:Math.floor(Math.random()*1e3),audioEnabled:!1,audioSource:"none",time:0,paused:!1,width:window.innerWidth,height:window.innerHeight};class B{constructor(){this.mediaStream=null,this.sourceNode=null,this.isActive=!1}async start(e,t){try{return this.mediaStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:!1,noiseSuppression:!1,autoGainControl:!1}}),this.sourceNode=e.createMediaStreamSource(this.mediaStream),this.sourceNode.connect(t),this.isActive=!0,console.log("Microphone input started"),!0}catch(i){return console.error("Microphone access denied:",i),i.name==="NotAllowedError"?alert("Microphone permission denied. Please allow microphone access and try again."):i.name==="NotFoundError"?alert("No microphone found. Please connect a microphone and try again."):alert("Failed to access microphone: "+i.message),!1}}stop(){this.sourceNode&&(this.sourceNode.disconnect(),this.sourceNode=null),this.mediaStream&&(this.mediaStream.getTracks().forEach(e=>e.stop()),this.mediaStream=null),this.isActive=!1,console.log("Microphone input stopped")}isRunning(){return this.isActive}}class R{constructor(){this.audioBuffer=null,this.sourceNode=null,this.isPlaying=!1,this.duration=0,this.fileName=""}async loadFile(e,t){try{this.fileName=e.name;const i=await e.arrayBuffer();return this.audioBuffer=await t.decodeAudioData(i),this.duration=this.audioBuffer.duration,console.log(`Loaded audio file: ${this.fileName} (${this.duration.toFixed(2)}s)`),!0}catch(i){return console.error("Failed to load audio file:",i),alert("Failed to load audio file. Please try a different file (MP3, WAV, OGG)."),!1}}play(e,t){return this.audioBuffer?(this.stop(),this.sourceNode=e.createBufferSource(),this.sourceNode.buffer=this.audioBuffer,this.sourceNode.loop=!0,this.sourceNode.connect(t),this.sourceNode.start(0),this.isPlaying=!0,console.log("Playing audio file"),!0):(console.warn("No audio file loaded"),!1)}stop(){if(this.sourceNode){try{this.sourceNode.stop()}catch{}this.sourceNode.disconnect(),this.sourceNode=null}this.isPlaying=!1,console.log("Stopped audio file")}togglePlayPause(e,t){return this.isPlaying?(this.stop(),!1):(this.play(e,t),!0)}playing(){return this.isPlaying}getInfo(){return{fileName:this.fileName,duration:this.duration}}hasFile(){return this.audioBuffer!==null}}class z{constructor(e){this.analyserNode=e,this.bufferLength=e.frequencyBinCount,this.dataArray=new Uint8Array(this.bufferLength),this.timeDataArray=new Uint8Array(this.bufferLength),this.smoothedVolume=0,this.smoothedBass=0,this.smoothingFactor=.85,this.volumeBoost=5,this.volumePower=.7}getAudioFeatures(e=1){this.analyserNode.getByteTimeDomainData(this.timeDataArray);let t=0;for(let r=0;r<this.timeDataArray.length;r++){const n=(this.timeDataArray[r]-128)/128;t+=n*n}let i=Math.sqrt(t/this.timeDataArray.length);i=i*this.volumeBoost,i=Math.pow(i,this.volumePower),i=i/e,i=Math.min(1,Math.max(0,i)),this.smoothedVolume=this.smoothedVolume*this.smoothingFactor+i*(1-this.smoothingFactor),this.analyserNode.getByteFrequencyData(this.dataArray);const s=this.getAverageBass();return this.smoothedBass=this.smoothedBass*this.smoothingFactor+s*(1-this.smoothingFactor),{volume:this.smoothedVolume,bass:this.smoothedBass,rawVolume:i}}getAverageBass(){const e=this.analyserNode.context.sampleRate,t=this.analyserNode.fftSize,s=Math.floor(250/(e/t)),r=1;let n=0;for(let c=r;c<=s&&c<this.bufferLength;c++)n+=this.dataArray[c];return n/(s-r+1)/255}setSmoothingFactor(e){this.smoothingFactor=Math.max(0,Math.min(.99,e))}reset(){this.smoothedVolume=0,this.smoothedBass=0}}class N{constructor(){this.audioContext=null,this.analyserNode=null,this.gainNode=null,this.micInput=new B,this.filePlayer=new R,this.analyzer=null,this.currentSource="none",this.fftSize=2048,this.smoothingTimeConstant=.8}async init(){try{return this.audioContext=new(window.AudioContext||window.webkitAudioContext),this.analyserNode=this.audioContext.createAnalyser(),this.analyserNode.fftSize=this.fftSize,this.analyserNode.smoothingTimeConstant=this.smoothingTimeConstant,this.gainNode=this.audioContext.createGain(),this.gainNode.gain.value=1,this.analyserNode.connect(this.gainNode),this.gainNode.connect(this.audioContext.destination),this.analyzer=new z(this.analyserNode),console.log("AudioContext initialized"),!0}catch(e){return console.error("Failed to initialize AudioContext:",e),alert("Failed to initialize audio system. Your browser may not support Web Audio API."),!1}}async resumeContext(){this.audioContext&&this.audioContext.state==="suspended"&&(await this.audioContext.resume(),console.log("AudioContext resumed"))}async switchToMic(){if(!this.audioContext&&!await this.init())return!1;await this.resumeContext(),this.stopCurrent();const e=await this.micInput.start(this.audioContext,this.analyserNode);return e&&(this.currentSource="mic",this.analyzer.reset()),e}async switchToFile(e){if(!this.audioContext&&!await this.init())return!1;await this.resumeContext(),this.stopCurrent();const t=await this.filePlayer.loadFile(e,this.audioContext);return t&&(this.currentSource="file",this.analyzer.reset(),this.filePlayer.play(this.audioContext,this.analyserNode)),t}toggleFilePlayback(){return this.currentSource!=="file"?(console.warn("No file source active"),!1):this.filePlayer.togglePlayPause(this.audioContext,this.analyserNode)}stopCurrent(){this.micInput.isRunning()&&this.micInput.stop(),this.filePlayer.playing()&&this.filePlayer.stop(),this.currentSource="none",this.analyzer&&this.analyzer.reset()}getAnalyzer(){return this.analyzer}getCurrentSource(){return this.currentSource}isActive(){return this.currentSource!=="none"}getFilePlayer(){return this.filePlayer}setFFTSize(e){this.analyserNode&&(this.analyserNode.fftSize=e,this.fftSize=e)}setSmoothingConstant(e){this.analyserNode&&(this.analyserNode.smoothingTimeConstant=e,this.smoothingTimeConstant=e)}dispose(){this.stopCurrent(),this.audioContext&&(this.audioContext.close(),this.audioContext=null),console.log("AudioManager disposed")}}class L{constructor(){this.config={waveSpeed:{base:.15,audioMultiplier:.85},waveAmplitude:{base:.1,audioMultiplier:.9},brightness:{base:0,audioMultiplier:1}},this.silenceThreshold=.005,this.smoothedParams={waveSpeed:0,waveAmplitude:0,brightness:0},this.smoothingRates={waveSpeed:.1,waveAmplitude:.15,brightnessAttack:.1,brightnessDecay:.05}}mapAudioToParams(e){const{volume:t}=e;let i=0;t<this.silenceThreshold?i=0:(i=(t-this.silenceThreshold)/(1-this.silenceThreshold),i=Math.min(1,i));const s=this.config.waveSpeed.base+i*this.config.waveSpeed.audioMultiplier,r=this.config.waveAmplitude.base+i*this.config.waveAmplitude.audioMultiplier,n=this.config.brightness.base+i*this.config.brightness.audioMultiplier;this.smoothedParams.waveSpeed=this.lerp(this.smoothedParams.waveSpeed,s,this.smoothingRates.waveSpeed),this.smoothedParams.waveAmplitude=this.lerp(this.smoothedParams.waveAmplitude,r,this.smoothingRates.waveAmplitude);const c=n>this.smoothedParams.brightness?this.smoothingRates.brightnessAttack:this.smoothingRates.brightnessDecay;return this.smoothedParams.brightness=this.lerp(this.smoothedParams.brightness,n,c),{...this.smoothedParams}}lerp(e,t,i){return e+(t-e)*i}setMapping(e,t,i){this.config[e]&&(this.config[e].base=t,this.config[e].audioMultiplier=i)}setSilenceThreshold(e){this.silenceThreshold=Math.max(0,Math.min(1,e))}setSmoothingRate(e,t){this.smoothingRates[e]!==void 0&&(this.smoothingRates[e]=Math.max(0,Math.min(1,t)))}reset(){this.smoothedParams.waveSpeed=0,this.smoothedParams.waveAmplitude=0,this.smoothedParams.brightness=0}getConfig(){return{config:{...this.config},silenceThreshold:this.silenceThreshold,smoothingRates:{...this.smoothingRates}}}}function I(o,e,t){const i=document.getElementById("mic-btn"),s=document.getElementById("file-btn"),r=document.getElementById("sample-btn"),n=document.getElementById("stop-audio-btn"),c=document.getElementById("audio-file-input"),d=document.getElementById("play-pause-btn"),y=document.querySelector(".file-upload"),w=document.getElementById("file-name"),l=document.getElementById("audio-status");i.addEventListener("click",async()=>{await o.switchToMic()&&(e.audioEnabled=!0,e.audioSource="mic",i.classList.add("active"),s.classList.remove("active"),n.disabled=!1,y.style.display="none",l.textContent="Listening...",l.className="listening")}),s.addEventListener("click",()=>{y.style.display="flex",s.classList.add("active"),i.classList.remove("active"),r.classList.remove("active"),c.click()}),r.addEventListener("click",async()=>{try{const u=await fetch("/demo-sample.mp3");if(!u.ok)throw new Error("Failed to load sample");const f=await u.arrayBuffer(),b=new Blob([f],{type:"audio/mpeg"}),F=new File([b],"Air Mail Special - Benny Goodman.mp3",{type:"audio/mpeg"});await o.switchToFile(F)&&(e.audioEnabled=!0,e.audioSource="file",r.classList.add("active"),s.classList.remove("active"),i.classList.remove("active"),n.disabled=!1,d.disabled=!1,d.textContent="Pause",w.textContent="Air Mail Special (Demo)",y.style.display="flex",l.textContent="Playing: Air Mail Special (Demo)",l.className="playing")}catch(u){console.error("Failed to load sample:",u),alert("Failed to load demo sample. Please try uploading your own audio file.")}}),c.addEventListener("change",async u=>{const f=u.target.files[0];if(!f)return;await o.switchToFile(f)&&(e.audioEnabled=!0,e.audioSource="file",n.disabled=!1,d.disabled=!1,d.textContent="Pause",w.textContent=f.name,l.textContent=`Playing: ${f.name}`,l.className="playing")}),d.addEventListener("click",()=>{const u=o.toggleFilePlayback();d.textContent=u?"Pause":"Play",u?(l.textContent=`Playing: ${w.textContent}`,l.className="playing"):(l.textContent="Paused",l.className="")}),n.addEventListener("click",()=>{o.stopCurrent(),e.audioEnabled=!1,e.audioSource="none",i.classList.remove("active"),s.classList.remove("active"),r.classList.remove("active"),n.disabled=!0,d.disabled=!0,d.textContent="Play",y.style.display="none",l.textContent="No Audio",l.className="",t&&t(0)})}function E(o){const e=document.getElementById("volume-bar"),t=document.getElementById("volume-label"),i=Math.min(100,o*100);e.style.width=`${i}%`,t.textContent=`Volume: ${i.toFixed(0)}%`}function M(o){["maxVolume","waveSpeed","waveAmplitude","brightness","cellSize","noiseIntensity","hue","saturation","contrast","threshold1","threshold2","threshold3","threshold4","threshold5"].forEach(t=>{const i=document.getElementById(t),s=document.getElementById(`${t}-value`);if(!i||!s){console.warn(`Slider or value display not found for ${t}`);return}i.addEventListener("input",r=>{const n=parseFloat(r.target.value);o[t]=n,s.textContent=A(n,t)}),i.value=o[t],s.textContent=A(o[t],t)})}function A(o,e){return e==="cellSize"||e==="seed"||e==="hue"?Math.round(o).toString():e==="waveSpeed"||e==="waveAmplitude"||e==="brightness"||e==="maxVolume"?o.toFixed(1):o.toFixed(2)}function U(o,e){M(e),I(o,e,E),console.log("Controls initialized")}let v,m,g,x=0;async function D(){try{const o=document.getElementById("canvas");if(!o)throw new Error("Canvas element not found");v=new P(o),await v.init(),m=new N,g=new L,U(m,a),a.width=o.width,a.height=o.height,window.addEventListener("resize",()=>{a.width=o.width,a.height=o.height}),requestAnimationFrame(S),console.log("Application initialized successfully")}catch(o){console.error("Failed to initialize application:",o),alert("Failed to initialize the visualization. Please check the console for details.")}}function S(o){const e=x===0?0:(o-x)/1e3;if(x=o,a.audioEnabled&&m.isActive()){const t=m.getAnalyzer();if(t){const i=t.getAudioFeatures(a.maxVolume),s=g.mapAudioToParams(i);a.computedWaveSpeed=s.waveSpeed*a.waveSpeed,a.computedWaveAmplitude=s.waveAmplitude*a.waveAmplitude,a.computedBrightness=s.brightness*a.brightness,E(i.volume)}}else a.computedWaveSpeed=g.lerp(a.computedWaveSpeed,0,.05),a.computedWaveAmplitude=g.lerp(a.computedWaveAmplitude,0,.05),a.computedBrightness=g.lerp(a.computedBrightness,0,.05);a.paused||(a.time+=e*(a.computedWaveSpeed||.2)),v.render(a),requestAnimationFrame(S)}document.addEventListener("visibilitychange",()=>{document.hidden?a.paused=!0:(a.paused=!1,x=0)});const h=document.getElementById("collapse-toggle"),p=document.getElementById("controls-container");h&&p&&h.addEventListener("click",()=>{p.classList.toggle("collapsed"),h.classList.toggle("collapsed"),p.classList.contains("collapsed")?h.textContent="+":h.textContent="−"});document.addEventListener("keydown",o=>{o.code==="Space"&&o.target.tagName!=="INPUT"&&(o.preventDefault(),a.paused=!a.paused,console.log(a.paused?"Paused":"Resumed")),o.code==="KeyF"&&(o.preventDefault(),V()),o.code==="KeyC"&&(o.preventDefault(),p.classList.toggle("collapsed"),h.classList.toggle("collapsed"),p.classList.contains("collapsed")?h.textContent="+":h.textContent="−")});function V(){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen().catch(o=>{console.error("Failed to enter fullscreen:",o)})}window.addEventListener("beforeunload",()=>{v&&v.dispose(),m&&m.dispose()});D();
