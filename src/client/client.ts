import "./styles/style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import { GUI } from "dat.gui";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";
import SimplexNoise from "simplex-noise";
import { FirstPersonControls } from "three/examples/jsm/controls/FirstPersonControls.js";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";

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
const stats = Stats();
const gui = new GUI();
let _noise = null;
let _scale = 20;
const simplex = new SimplexNoise();
const clock = new THREE.Clock();

let terrainChunkWidth: number = 256;
let terrainChunkHeight: number = 256;
scene.fog = new THREE.FogExp2(0xefd1b5, 0.002);

let controls: any = null;
const data = generateHeight(terrainChunkWidth, terrainChunkHeight);
// camera.position.set(100, 800, -800);
// camera.lookAt(-100, 810, -800);

const geometry = new THREE.PlaneGeometry(
  7500,
  7500,
  terrainChunkWidth - 1,
  terrainChunkHeight - 1
);
geometry.rotateX(-Math.PI / 2);
const vertices: Array<number> = (geometry as THREE.BufferGeometry).attributes
  .position.array as Array<number>;

let i = 0,
  j = 0,
  l = 0;
for (i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
  vertices[j + 1] = data[i] * 10;
}

let texture: any = generateTexture(data, terrainChunkWidth, terrainChunkHeight);
if (texture != undefined) {
  texture = new THREE.CanvasTexture(texture);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  let mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ map: texture })
  );
  scene.add(mesh);
}
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

function generateHeight(width: number, height: number) {
  const terrainSize = width * height;
  let seed = Math.PI / 4;
  window.Math.random = function () {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  const data = new Uint8Array(terrainSize);
  const z = Math.random();
  let quality = 1;
  for (let j = 0; j < 4; j++) {
    for (let i = 0; i < terrainSize; i++) {
      const x = i % width;
      const y = Math.floor(i / width);
      data[i] += Math.abs(
        perlin.noise(x / quality, y / quality, z) * quality * 1.75
      );
    }
    quality *= 5;
  }
  return data;
}

let cols: number = terrainChunkWidth / _scale;
let rows: number = terrainChunkHeight / _scale;

//constant colors
const _WHITE = new THREE.Color(0x808080);
const _OCEAN = new THREE.Color(0xd9d592);
const _BEACH = new THREE.Color(0xd9d592);
const _SNOW = new THREE.Color(0xffffff);
const _FOREST_TROPICAL = new THREE.Color(0x4f9f0f);
const _FOREST_TEMPERATE = new THREE.Color(0x2b960e);
const _FOREST_BOREAL = new THREE.Color(0x29c100);

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

const G = 2.0 ** -noiseParam.persistence;

const _group = new THREE.Group();
_group.rotation.x = -Math.PI / 2;
scene.add(_group);

let terrainGeometry = new THREE.PlaneGeometry(
  terrainChunkWidth,
  terrainChunkHeight,
  rows,
  cols
);
const _plane = new THREE.Mesh(
  terrainGeometry,
  new THREE.MeshStandardMaterial({
    wireframe: false,
    color: 0xffffff,
    side: THREE.FrontSide,
  })
);
_plane.castShadow = false;
_plane.receiveShadow = true;
_group.add(_plane);

//terrain architecture or flow
// 1. _OnInitialize - create a terrain cuhunk manager with a scene, gui, and params
// 2. in terrain chuk manager
let _chunkSize = 500;
const _chunks: any = [];

var geom = new THREE.BufferGeometry();
for (let i = 0; i < cols; i++) {
  for (let j = 0; j < rows; j++) {
    const shape = new THREE.Shape();
    const x = i * _scale;
    const y = i * _scale;
    shape.moveTo(x + _scale, j + _scale);
    shape.lineTo(x + _scale, y - _scale);
    shape.lineTo(x, y + _scale);
    const TriangleGeometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(TriangleGeometry, material);
    scene.add(mesh);
  }
}

// const noiseRollup = gui.addFolder("Terrain.Noise");

function init() {
  scene.position.set(0, 0, 0); // it is default value but for sanity
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.set(100, 800, -800);
  camera.lookAt(-100, 810, -800);

  renderer = new THREE.WebGLRenderer();
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new FirstPersonControls(camera, renderer.domElement);
  controls.movementSpeed = 150;
  controls.lookSpeed = 0.1;

  window.addEventListener("resize", onWindowResize, false);

  // new OrbitControls(camera, renderer.domElement);

  object1 = new THREE.Mesh(
    new THREE.SphereBufferGeometry(),
    new THREE.MeshPhongMaterial({ color: 0xb11919 })
  );
  object1.position.set(4, 0, 0);
  scene.add(object1);
  object1.add(new THREE.AxesHelper(4));

  object2 = new THREE.Mesh(
    new THREE.SphereBufferGeometry(),
    new THREE.MeshPhongMaterial({ color: 0x116211 })
  );
  object2.position.set(4, 0, 0);
  object1.add(object2);
  object2.add(new THREE.AxesHelper(5));

  object3 = new THREE.Mesh(
    new THREE.SphereBufferGeometry(),
    new THREE.MeshPhongMaterial({ color: 0x0022ff })
  );
  object3.position.set(4, 0, 0);
  object2.add(object3);
  object3.add(new THREE.AxesHelper(5));

  let points = [];
  points.push(new THREE.Vector3(-5, 0, -5));
  points.push(new THREE.Vector3(-5, 0, 5));
  geometry1 = new THREE.BufferGeometry().setFromPoints(points);
  let line = new THREE.Line(
    geometry1,
    new THREE.LineBasicMaterial({ color: 0x888888 })
  );
  scene.add(line);

  const octaves = 10;
  const lacunarity = 2.0;
  const gain = 0.5;

  let amplitude = 0.5;
  let frequency = 1.0;

  // for (let i = 0; i < octaves; i++) {
  //   total += amplitude * noise(frequency * x);
  //   frequency *= lacunarity;
  //   amplitude *= gain;
  // }

  // let terrain = new Array(cols);

  const _map = (
    num: number,
    in_min: number,
    in_max: number,
    out_min: number,
    out_max: number
  ) => {
    return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
  };

  // for (let y = 0; y < rows; y++) {
  //   for (let x = 0; x < cols; x++) {
  //     terrain[x] = new Array(rows);
  //   }
  // }

  // for (let y = 0; y < terrainChunkWidth; y++) {
  //   for (let x = 0; x < terrainChunkHeight; x++) {
  //     let total = 0.0;
  //     let amplitude = 1.0;
  //     let normalization = 0.0;
  //     let frequency = 1.0;
  //     for (let o = 0; o <= noiseParam.octaves; o++) {
  //       const noiseValue =
  //         simplex.noise2D(x * frequency, y * frequency) * 0.5 + 0.5;
  //       total += noiseValue * amplitude;
  //       normalization += amplitude;
  //       amplitude *= noiseParam.G;
  //       frequency *= noiseParam.lacunarity;
  //     }
  //     total /= normalization;
  //     terrain[x][y] =
  //       Math.pow(total, noiseParam.exponentiation) * noiseParam.height;
  //   }
  // }

  const positions: Array<number> = (terrainGeometry as THREE.BufferGeometry)
    .attributes.position.array as Array<number>;

  for (let i = 0; i < positions.length; i += 3) {
    const v = new THREE.Vector3(
      positions[i],
      positions[i + 1],
      positions[i + 2]
    ).multiplyScalar(2);
    positions[i] = v.x;
    positions[i + 1] = v.y;
    positions[i + 2] = v.z;
  }
  (terrainGeometry as THREE.BufferGeometry).attributes.position.needsUpdate =
    true;

  const boxGeometry = new THREE.BoxGeometry(5, 5, 5);
  const glass = new THREE.MeshPhysicalMaterial({});
  glass.reflectivity = 0.0;
  glass.sheen = 0.5;
  glass.specularIntensity = 0.5;
  glass.transmission = 0.95;
  glass.metalness = 0.0;
  glass.clearcoatRoughness = 0.9;
  glass.clearcoat = 1.0;
  glass.color = new THREE.Color(0xffffff);
  glass.thickness = 10;
  glass.ior = 1.2;

  const skyBoxURL = [
    "posx.png",
    "negx.png",
    "posy.png",
    "negy.png",
    "posz.png",
    "negz.png",
  ];

  let PMREMGenerator = new THREE.PMREMGenerator(renderer); // it is just instance of PMREMGenerator
  // PMREMGenerator- Premultiplied MipMapped Radiance Environment Map from a cubeMapped envrionment texture;
  // This allows different levels of blur to be quickly accessed based on material roughness
  // and remember that cubemap size is fixed 256 and will not vary with image size
  //https://github.com/mrdoob/three.js/pull/8363
  //this.resolution = 256; // NODE: 256 is currently hard coded in the glsl code for performance reasons

  // load function takes first parameter as an array of 6 urls to images and
  // second parameter as functiopn which will be called when load completes and the argiument will be the loaded texture

  let cubeMapTexture = new THREE.CubeTextureLoader()
    .setPath("./textures/field-skyboxes/Sorsele2/")
    .load(
      ["posx.jpg", "negx.jpg", "posy.jpg", "negy.jpg", "posz.jpg", "negz.jpg"], // images are big so it might not be instant load of image
      () => {
        glass.envMap = PMREMGenerator.fromCubemap(cubeMapTexture).texture;
        PMREMGenerator.dispose();
        console.log(glass.envMap);
        // scene.background = glass.envMap;
        scene.background = new THREE.Color(0xefd1b5);
      }
    );

  const glassCube = new THREE.Mesh(boxGeometry, glass);
  glassCube.scale.x = -2;
  scene.add(glassCube);

  // const hemLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
  // hemLight.position.set(0.0, 10, 0);
  // scene.add(hemLight);

  // const pointLight1 = new THREE.PointLight();
  // pointLight1.position.set(10, 10, 10);
  // scene.add(pointLight1);

  // const pointLight2 = new THREE.PointLight();
  // pointLight2.position.set(-10, 10, 10);
  // scene.add(pointLight2);

  // const light1 = new THREE.PointLight();
  // light1.position.set(10, 10, 10);
  // light1.castShadow = true;
  // light1.shadow.bias = -0.002;
  // light1.decay = 2;
  // light1.shadow.mapSize.height = 2048;
  // light1.shadow.mapSize.width = 2048;
  // scene.add(light1);

  const geometry = new THREE.BoxGeometry(5, 5, 10);
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true,
  });

  cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  document.body.appendChild(stats.dom);

  const object1Folder = gui.addFolder("Object1");
  object1Folder.add(object1.position, "x", 0, 10, 0.01).name("X Position");
  object1Folder
    .add(object1.rotation, "x", 0, Math.PI * 2, 0.01)
    .name("X Rotation");
  object1Folder.add(object1.scale, "x", 0, 2, 0.01).name("X Scale");
  object1Folder.open(); // this is just to make it open or close; which mean collapsed or expanded; default is collapsed
  const object2Folder = gui.addFolder("Object2");
  object2Folder.add(object2.position, "x", 0, 10, 0.01).name("X Position");
  object2Folder
    .add(object2.rotation, "x", 0, Math.PI * 2, 0.01)
    .name("X Rotation");
  object2Folder.add(object2.scale, "x", 0, 2, 0.01).name("X Scale");
  object2Folder.open();
  const object3Folder = gui.addFolder("Object3");
  object3Folder.add(object3.position, "x", 0, 10, 0.01).name("X Position");
  object3Folder
    .add(object3.rotation, "x", 0, Math.PI * 2, 0.01)
    .name("X Rotation");
  object3Folder.add(object3.scale, "x", 0, 2, 0.01).name("X Scale");
  object3Folder.open();
  document.body.appendChild(VRButton.createButton(renderer));

  renderer.xr.enabled = true;
  debug = document.getElementById("debug1") as HTMLDivElement;
}
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  controls.handleResize();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function debugBoxUpdate() {
  const cameraWorldPosition = new THREE.Vector3();
  camera.getWorldPosition(cameraWorldPosition);
  const object1WorldPosition = new THREE.Vector3();
  object1.getWorldPosition(object1WorldPosition);
  const object2WorldPosition = new THREE.Vector3();
  object2.getWorldPosition(object2WorldPosition);
  const object3WorldPosition = new THREE.Vector3();
  object3.getWorldPosition(object3WorldPosition);

  debug.innerText =
    "\n Camera\n" +
    " World Pos : " +
    " ( " +
    cameraWorldPosition.x.toFixed(2) +
    ", " +
    cameraWorldPosition.y.toFixed(2) +
    ", " +
    cameraWorldPosition.z.toFixed(2) +
    " )" +
    "\n" +
    "\n Red\n" +
    "Local Pos X : " +
    object1.position.x.toFixed(2) +
    "\n" +
    "World Pos X : " +
    object1WorldPosition.x.toFixed(2) +
    "\n" +
    "\nGreen\n" +
    "Local Pos X : " +
    object2.position.x.toFixed(2) +
    "\n" +
    "World Pos X : " +
    object2WorldPosition.x.toFixed(2) +
    "\n" +
    "\nBlue\n" +
    "Local Pos X : " +
    object3.position.x.toFixed(2) +
    "\n" +
    "World Pos X : " +
    object3WorldPosition.x.toFixed(2) +
    "\n";
}

function animate() {
  requestAnimationFrame(animate);
  debugBoxUpdate();
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  render();
  stats.update();
}

function render() {
  controls.update(clock.getDelta());
  renderer.render(scene, camera);
}

init();
animate();
