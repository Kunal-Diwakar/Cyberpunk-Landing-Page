import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import gsap from "gsap";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputEncoding = THREE.sRGBEncoding;

// Ensure the renderer is initialized correctly
if (!renderer) {
  console.error("Renderer could not be initialized.");
}

let model;

// Load the GLTF model
const gltfLoader = new GLTFLoader();
gltfLoader.load(
  "./DamagedHelmet.gltf",
  (gltf) => {
    model = gltf.scene;
    scene.add(model);
  },
  undefined,
  (error) => {
    console.error(error);
  }
);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// Load the HDR image and generate PMREM
const rgbeLoader = new RGBELoader();
rgbeLoader.load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr",
  (texture) => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    // Uncomment the following line if you want to set the background
    // scene.background = envMap;
  }
);

camera.position.z = 3.4;

// Postprocessing setup
const composer = new EffectComposer(renderer);
if (!composer) {
  console.error("EffectComposer could not be initialized.");
}

// Ensure the render pass is created correctly
const renderPass = new RenderPass(scene, camera);
if (!renderPass) {
  console.error("RenderPass could not be initialized.");
}

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms["amount"].value = 0.0015;

// Add passes to composer
composer.addPass(renderPass);
composer.addPass(rgbShiftPass);

window.addEventListener("mousemove", (e) => {
  if (model) {
    gsap.to(model.rotation, {
      y: (e.clientX / window.innerWidth - 0.5) * (Math.PI * 0.12),
      x: (e.clientY / window.innerHeight - 0.5) * (Math.PI * 0.12),
      duration: 1,
      ease: "power3.Out",
    });
  }
});

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

function animate() {
  window.requestAnimationFrame(animate);
  composer.render();
}
animate();
