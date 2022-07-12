import "./styles/style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import { GUI } from "dat.gui";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";
import SimplexNoise from "simplex-noise";
import { ArcballControls } from "three/examples/jsm/controls/ArcballControls.js";
// import { FirstPersonControls } from "three/examples/jsm/controls/FirstPersonControls.js";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { Vector2 } from "three";

const perlin = new ImprovedNoise();

let object1: any,
  object2: any,
  object3: any,
  debug: any,
  geometry1: THREE.BufferGeometry,
  cube: any,
  camera: any,
  renderer: any;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xefd1b5);
const colours = [];

const stats = Stats();
const gui = new GUI();
let _noise = null;
let _scale = 20;
const simplex = new SimplexNoise();

const noiseParam: any = {
  octaves: 6,
  persistence: 0.707,
  lacunarity: 1.8,
  exponentiation: 4.5,
  height: 300.0,
  scale: 800.0,
  noiseType: "simplex",
  seed: 1,
};

let terrainChunkWidth: number = 256;
let terrainChunkHeight: number = 256;

let cols: number = terrainChunkWidth / _scale;
let rows: number = terrainChunkHeight / _scale;

const terrainDimension = new THREE.Vector2(4104, 1856);
const terrainChunkDimension = new Vector2(256, 256);

const chunkCount: THREE.Vector2 = new THREE.Vector2(
  Math.ceil(terrainDimension.x / terrainChunkDimension.x),
  Math.ceil(terrainDimension.y / terrainChunkDimension.y)
);

const G = 2.0 ** -noiseParam.persistence;

let controls: any = null;

async function extract_height_data() {
  const height_data_response = await fetch("./resources/elevate3.json");

  if (!height_data_response.ok) {
    const message = `An error has occured: ${height_data_response.status}`;
    throw new Error(message);
  }
  const data2 = await height_data_response.json();
  data2.forEach((element: Number, index: Number) => {});
  return data2;
}

function _ChooseColour(x: Number, y: Number, z: Number) {
  return new THREE.Color(0x808080);
}

// const textureLoader = new THREE.TextureLoader();
// textureLoader.load("textures/grid.png", function (texture) {
//   texture.wrapS = THREE.RepeatWrapping;
//   texture.wrapT = THREE.RepeatWrapping;
//   texture.repeat.set(terrainWidth - 1, terrainDepth - 1);
//   groundMaterial.map = texture;
//   groundMaterial.needsUpdate = true;
// });

function generateTexture(data: Uint8Array, width: number, height: number) {
  let context, texture, image, imageData, shade;
  const vector3 = new THREE.Vector3(0, 0, 0);

  const sun = new THREE.Vector3(1, 1, 1);
  sun.normalize();

  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;
  context = canvas.getContext("2d");

  if (context != undefined) {
    context!.fillStyle = "#000";
    context!.fillRect(0, 0, width, height);
    image = context.getImageData(0, 0, canvas.width, canvas.height);
    imageData = image.data;

    for (let i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {
      vector3.x = data[j - 2] - data[j + 2];
      vector3.y = 2;
      vector3.z = data[j - width * 2] - data[j + width * 2];
      vector3.normalize();

      shade = vector3.dot(sun);

      imageData[i] = (96 + shade * 128) * (0.5 + data[j] * 0.007);
      imageData[i + 1] = (32 + shade * 96) * (0.5 + data[j] * 0.007);
      imageData[i + 2] = shade * 96 * (0.5 + data[j] * 0.007);
    }
    context.putImageData(image, 0, 0);

    const canvasScaled = document.createElement("canvas");
    canvasScaled.width = 4 * width;
    canvasScaled.height = 4 * height;

    context = canvasScaled.getContext("2d");
    if (context != undefined) {
      context.scale(4, 4);
      context.drawImage(canvas, 0, 0);
      image = context.getImageData(
        0,
        0,
        canvasScaled.width,
        canvasScaled.height
      );
      imageData = image.data;

      for (let i = 0, l = imageData.length; i < l; i += 4) {
        const v = ~~(Math.random() * 5);

        imageData[i] += v;
        imageData[i + 1] += v;
        imageData[i + 2] += v;
      }

      context.putImageData(image, 0, 0);
      return canvasScaled;
    }
  }
}

//terrain architecture or flow to achieve
// 1. _OnInitialize - create a terrain cuhunk manager with a scene, gui, and params
// 2. in terrain chuk manager
// 3. create lod for different chunk size

async function init() {
  scene.position.set(0, 0, 0); // it is default value but for sanity
  camera = new THREE.PerspectiveCamera(
    90,
    window.innerWidth / window.innerHeight,
    0.1,
    50000
  );
  camera.position.set(100, 800, -4000);
  camera.lookAt(-100, 810, -800);

  renderer = new THREE.WebGLRenderer();
  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new ArcballControls(camera, renderer.domElement, scene);
  controls.addEventListener("change", render);

  window.addEventListener("resize", onWindowResize, false);
  let data = await extract_height_data();

  const geometry = new THREE.PlaneGeometry(
    3 * terrainDimension.x,
    3 * terrainDimension.y,
    terrainDimension.x - 1,
    terrainDimension.y - 1
  );

  geometry.rotateX(-Math.PI / 2);
  const vertices: Array<number> = (geometry as THREE.BufferGeometry).attributes
    .position.array as Array<number>;

  let i = 0,
    j = 0,
    l = 0;
  for (i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
    vertices[j + 1] = data[i] * 1000;
    colours.push(_ChooseColour(vertices[j], vertices[j + 1], vertices[j + 2]));
  }
  (geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;

  geometry.computeVertexNormals();

  // let texture: any = generateTexture(
  //   data,
  //   4 * terrainDimension.x,
  //   4 * terrainDimension.y
  // );

  // texture = new THREE.CanvasTexture(texture);
  // texture.wrapS = THREE.ClampToEdgeWrapping;
  // texture.wrapT = THREE.ClampToEdgeWrapping;

  const meshMaterial = new THREE.MeshLambertMaterial({
    // map: texture,
    color: 0x888888,
    side: THREE.DoubleSide,
  });
  let mesh = new THREE.Mesh(geometry, meshMaterial);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const light = new THREE.AmbientLight(0xffffff, 0.7); // soft white light
  scene.add(light);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
  dirLight.color.setHSL(0.1, 1, 0.95);
  dirLight.position.set(100, 400, 100);
  dirLight.position.multiplyScalar(30);
  scene.add(dirLight);

  dirLight.castShadow = true;

  dirLight.shadow.mapSize.width = 256;
  dirLight.shadow.mapSize.height = 256;

  const d = 50;

  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;

  dirLight.shadow.camera.far = 350;
  dirLight.shadow.bias = -0.0001; // just to remove artifact in the shadow; just got this value from documentation
  //default is 0

  // const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 100);
  // scene.add(dirLightHelper);

  // scene.add(new THREE.HemisphereLight(0xff8080, 0xff0000, 0.6));

  // for (let f of mesh.geometry.faces) {
  //   const vs = [f.a, f.b, f.c];

  //   const vertexColours = [];
  //   for (let v of vs) {
  //     vertexColours.push(colours[v]);
  //   }
  //   f.vertexColors = vertexColours;
  // }

  mesh.geometry.computeVertexNormals();
  const octaves = 10;
  const lacunarity = 2.0;
  const gain = 0.5;

  let amplitude = 0.5;
  let frequency = 1.0;

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    // controls.handleResize();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    render();
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
    stats.update();
  }

  function render() {
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}
init();
