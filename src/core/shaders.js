// Vertex shader (shared by both passes)
export const vertexShaderSource = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Noise generation fragment shader (Pass 1 - renders to framebuffer)
export const noiseFragmentShaderSource = `#version 300 es
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
`;

// ASCII glyph rendering fragment shader (Pass 2 - renders to screen)
export const asciiFragmentShaderSource = `#version 300 es
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
`;
