import "./styles/style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import { GUI } from "dat.gui";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";

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

function init() {
  scene.position.set(0, 0, 0); // it is default value but for sanity
  camera = new THREE.PerspectiveCamera(90, 2, 1, 1000);
  camera.position.set(0, 8, 20);

  renderer = new THREE.WebGLRenderer();
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  window.addEventListener("resize", onWindowResize, false);

  new OrbitControls(camera, renderer.domElement);

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

  const positions = geometry1.attributes.position.array as Array<number>; // position is strided 1d array not 2 dimension
  for (let i = 0, length = positions.length; i < length; i = i + 3) {
    const v = new THREE.Vector3(
      positions[i],
      positions[i + 1],
      positions[i + 2]
    ).multiplyScalar(2);
    positions[i] = v.x;
    positions[i + 1] = v.y;
    positions[i + 2] = v.z;
  }

  geometry1.attributes.position.needsUpdate = true; // specifies whether material need to be recompiled

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
        scene.background = glass.envMap;
      }
    );

  const glassCube = new THREE.Mesh(boxGeometry, glass);
  glassCube.scale.x = -2;
  scene.add(glassCube);

  const hemLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
  hemLight.position.set(0.0, 10, 0);
  scene.add(hemLight);

  const pointLight1 = new THREE.PointLight();
  pointLight1.position.set(10, 10, 10);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight();
  pointLight2.position.set(-10, 10, 10);
  scene.add(pointLight2);

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

  const gui = new GUI();
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
  renderer.render(scene, camera);
}

init();
animate();
