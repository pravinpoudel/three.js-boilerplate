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
const terrainChunkDimension = new Vector2(1024, 512);

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
  let mainscreen = document.getElementById("main-screen") as HTMLElement;
  mainscreen.appendChild(renderer.domElement);

  controls = new ArcballControls(camera, renderer.domElement, scene);
  controls.addEventListener("change", render);

  window.addEventListener("resize", onWindowResize, false);
  let data = await extract_height_data();

  const geometry = new THREE.PlaneGeometry(
    2 * terrainDimension.x,
    2 * terrainDimension.y,
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

  const meshMaterial = new THREE.MeshLambertMaterial({
    // map: texture,
    color: 0x888888,
    side: THREE.DoubleSide,
  });

  let chunk = new Array();
  let offsetX = 0;
  let offsetY = 0;
  for (let i = 0; i < chunkCount.x * chunkCount.y; i++) {
    let partial = new Vector2();
    chunk[i] = new Array();
    partial.x =
      terrainDimension.x - offsetX >= terrainChunkDimension.x
        ? terrainChunkDimension.x
        : terrainDimension.x - offsetX;
    partial.y =
      terrainDimension.y - offsetY >= terrainChunkDimension.y
        ? terrainChunkDimension.y
        : terrainDimension.y - offsetY;
    for (let m = 0; m < partial.y; m++) {
      for (let n = 0; n < partial.x; n++) {
        let indexX = offsetX + n;
        let indexY = offsetY + m;
        let index = indexX + indexY * terrainDimension.x;
        chunk[i].push(
          new THREE.Vector3(
            vertices[3 * index],
            vertices[3 * index + 1],
            vertices[3 * index + 2]
          )
        );
      }
    }
    let geometry = new THREE.PlaneGeometry(
      2 * partial.x,
      2 * partial.y,
      partial.x - 1,
      partial.y - 1
    );
    geometry.setFromPoints(chunk[i]);
    let mesh = new THREE.Mesh(geometry, meshMaterial);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.geometry.computeVertexNormals();
    scene.add(mesh);

    offsetX = offsetX + partial.x;
    if (offsetX == terrainDimension.x) {
      offsetY = offsetY + partial.y;
    }
    offsetX = offsetX % terrainDimension.x;
  }

  mainscreen.style.display = "block";
  (document.getElementById("loader") as HTMLElement).style.display = "none";
  //make new mesh from each geometry with same material

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
