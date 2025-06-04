// main.js
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass    } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass    } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// 1) BASIC SCENE + CAMERA + RENDERER
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 1.5, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2) CUBE (lighter base color)
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
  color: 0x5599cc,   // lighter blue
  roughness: 0.4,
  metalness: 0.1,
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 3) LIGHTING (brighter)
const keyLight = new THREE.PointLight(0xffffff, 2.0); // intensity 2
keyLight.position.set(2, 3, 2);
scene.add(keyLight);

// add ambient fill light so shadows aren’t too dark
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

// 4) POST‐PROCESSING: POSTERIZE + DITHER
const PosterizeDitherShader = {
  uniforms: {
    tDiffuse: { value: null },
    levels:   { value: 8.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float levels;
    varying vec2 vUv;

    float rand(vec2 co){
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      float noise = rand(gl_FragCoord.xy) - 0.5;
      vec3 c = color.rgb + (noise / levels);
      c = floor(c * levels) / levels;

      gl_FragColor = vec4(c, color.a);
    }
  `,
};

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const posterizePass = new ShaderPass(PosterizeDitherShader);
posterizePass.uniforms.levels.value = 8.0;
composer.addPass(posterizePass);

// 5) RESIZE HANDLER
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
});

// 6) ANIMATION LOOP
function animate() {
  requestAnimationFrame(animate);

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  composer.render();
}
animate();
