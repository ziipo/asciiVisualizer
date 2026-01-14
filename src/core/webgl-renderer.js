import { vertexShaderSource, noiseFragmentShaderSource, asciiFragmentShaderSource } from './shaders.js';

export class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.programs = {};
    this.framebuffer = null;
    this.noiseTexture = null;
    this.quadBuffer = null;
  }

  async init() {
    // Get WebGL2 context
    this.gl = this.canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false
    });

    if (!this.gl) {
      throw new Error('WebGL 2 is not supported in this browser');
    }

    const gl = this.gl;

    // Compile shader programs
    this.programs.noise = this.createProgram(vertexShaderSource, noiseFragmentShaderSource);
    this.programs.ascii = this.createProgram(vertexShaderSource, asciiFragmentShaderSource);

    // Create framebuffer for noise pass
    this.createFramebuffer();

    // Create fullscreen quad
    this.createQuad();

    // Set initial viewport
    this.resize();

    // Listen for window resize
    window.addEventListener('resize', () => this.resize());

    console.log('WebGL renderer initialized');
  }

  createShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('Shader compilation error: ' + info);
    }

    return shader;
  }

  createProgram(vertexSource, fragmentSource) {
    const gl = this.gl;

    const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error('Program linking error: ' + info);
    }

    // Clean up shaders (no longer needed after linking)
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
  }

  createFramebuffer() {
    const gl = this.gl;

    // Create texture to render noise into
    this.noiseTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      this.canvas.width,
      this.canvas.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Create framebuffer
    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.noiseTexture,
      0
    );

    // Check framebuffer status
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error('Framebuffer is not complete');
    }

    // Unbind
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  createQuad() {
    const gl = this.gl;

    // Fullscreen quad vertices
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]);

    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  }

  setUniforms(program, uniforms) {
    const gl = this.gl;

    for (const [name, value] of Object.entries(uniforms)) {
      const location = gl.getUniformLocation(program, name);
      if (location === null) continue;

      if (typeof value === 'number') {
        gl.uniform1f(location, value);
      } else if (Array.isArray(value)) {
        if (value.length === 2) {
          gl.uniform2fv(location, value);
        } else if (value.length === 3) {
          gl.uniform3fv(location, value);
        } else if (value.length === 4) {
          gl.uniform4fv(location, value);
        }
      }
    }
  }

  setupVertexAttribute(program, name) {
    const gl = this.gl;
    const location = gl.getAttribLocation(program, name);
    if (location === -1) return;

    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  }

  render(state) {
    const gl = this.gl;

    // PASS 1: Render noise to framebuffer texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.programs.noise);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    this.setupVertexAttribute(this.programs.noise, 'a_position');

    this.setUniforms(this.programs.noise, {
      u_time: state.time,
      u_waveAmplitude: state.computedWaveAmplitude,
      u_noiseIntensity: state.noiseIntensity,
      u_seed: state.seed,
      u_resolution: [state.width, state.height]
    });

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // PASS 2: Render ASCII glyphs from noise texture to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.programs.ascii);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    this.setupVertexAttribute(this.programs.ascii, 'a_position');

    // Bind noise texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);

    this.setUniforms(this.programs.ascii, {
      u_noiseTex: 0,
      u_cellSize: state.cellSize,
      u_brightness: state.computedBrightness,
      u_contrast: state.contrast,
      u_hue: state.hue,
      u_saturation: state.saturation,
      u_vignette: state.vignette,
      u_vignetteIntensity: state.vignetteIntensity,
      u_threshold1: state.threshold1,
      u_threshold2: state.threshold2,
      u_threshold3: state.threshold3,
      u_threshold4: state.threshold4,
      u_threshold5: state.threshold5,
      u_resolution: [state.width, state.height]
    });

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  resize() {
    const gl = this.gl;
    const dpr = window.devicePixelRatio || 1;

    // Update canvas size
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';

    // Resize noise texture
    gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      this.canvas.width,
      this.canvas.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  dispose() {
    const gl = this.gl;

    // Clean up resources
    if (this.quadBuffer) gl.deleteBuffer(this.quadBuffer);
    if (this.noiseTexture) gl.deleteTexture(this.noiseTexture);
    if (this.framebuffer) gl.deleteFramebuffer(this.framebuffer);
    if (this.programs.noise) gl.deleteProgram(this.programs.noise);
    if (this.programs.ascii) gl.deleteProgram(this.programs.ascii);
  }
}
