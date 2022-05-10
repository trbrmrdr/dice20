
import * as THREE from 'three';
// import * as THREE from 'three/build/three.module.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { GUI } from 'dat.gui';
import Stats from 'three/examples/jsm/libs/stats.module'

import Cookies from 'js-cookie'
import { EventDispatcher, Material } from 'three';



const stats = Stats()
stats.dom.style.left = '480px';
document.body.appendChild(stats.dom)

const gui = new GUI();
const options = {
	// enableSwoopingCamera: false,
	enableRotation: false,
	color: 0xffffff,
	roughness: 0.16,
	metalness: 0.16,
	// transmission: 0.58,
	// ior: 1.54,
	// reflectivity: 0.21,
	thickness: 2.0,
	envMapIntensity: 0.8,
	clearcoat: 0.59,
	clearcoatRoughness: 0.44,
	normalScale: 4.32,
	// clearcoatNormalScale: 0.69,
	normalRepeat: 1,
	// attenuationTint: 0xffffff,
	// attenuationDistance: 0,
	// bloomThreshold: 0.85,
	// bloomStrength: 0.35,
	// bloomRadius: 0.33,
};

declare global {
	interface Window {
		create_anim: any;
	}
}

const CANVAS_SIZE = {
	width: 1024,
	height: 1024,
}
var canvas_container_size = { width: 0, height: 0 }
const clock = new THREE.Clock();

window.create_anim = function (id_block = "canvas-container") {

	const canvas_container = document.getElementById(id_block);

	const scene = new THREE.Scene();
	// scene.background = new THREE.Color(0x414168,);


	// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);


	const camera = new THREE.PerspectiveCamera(45, CANVAS_SIZE.width / CANVAS_SIZE.height, 1, 500);
	camera.position.set(
		Number(Cookies.get('px') || 12),
		Number(Cookies.get('py') || 15),
		Number(Cookies.get('pz') || 20));



	const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setClearColor(0x000000, 0);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(CANVAS_SIZE.width, CANVAS_SIZE.height);
	// renderer.shadowMap.enabled = true;
	canvas_container!.appendChild(renderer.domElement);

	const controls = new OrbitControls(camera, renderer.domElement);
	// controls.target.set(0, 0, 0);
	controls.update();

	controls.addEventListener('change', () => {
		Cookies.set('px', camera.position.x.toString());
		Cookies.set('py', camera.position.y.toString());
		Cookies.set('pz', camera.position.z.toString());
	});


	const grid = new THREE.GridHelper(2000, 100, 0x000000, 0x000000);
	// 	// grid.material.opacity = 0.2;
	// 	// grid.material.transparent = true;
	scene.add(grid);


	window.addEventListener('resize', onWindowResize);


	onWindowResize();
	onWindowResize();

	function onWindowResize() {

		let new_width = canvas_container!.clientWidth
		let new_height = new_width / CANVAS_SIZE.width * CANVAS_SIZE.height;
		if (canvas_container!.clientWidth < canvas_container!.clientHeight) {
		}
		if (canvas_container_size.width == new_width && canvas_container_size.height == new_height) return;
		canvas_container_size = { width: new_width, height: new_height };

		renderer.setSize(new_width, new_height);

		camera.aspect = new_width / new_height;
		camera.updateProjectionMatrix();
	}

	//###########################################################################

	const textureLoader = new THREE.TextureLoader();

	const bgTexture = textureLoader.load("data/texture.jpg");
	const bgGeometry = new THREE.PlaneGeometry(50, 50);
	const bgMaterial = new THREE.MeshBasicMaterial({ map: bgTexture });
	const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
	bgMesh.position.set(0, 0, -10);
	scene.add(bgMesh);

	const hdrEquirect = new RGBELoader().load(
		"data/empty_warehouse_01_2k.hdr",
		() => {
			hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
		}
	);


	const normalMapTexture = textureLoader.load("data/normal.jpg");
	normalMapTexture.wrapS = THREE.RepeatWrapping;
	normalMapTexture.wrapT = THREE.RepeatWrapping;
	normalMapTexture.repeat.set(options.normalRepeat, options.normalRepeat);

	const material = new THREE.MeshStandardMaterial({
		// lightMap:textureLoader.load("data/noise_texture/morgan-padgett-rock-texture-one.jpeg"),
		color: 0xffffff,
		metalness: options.metalness,
		roughness: options.roughness,
		// transmission: options.transmission,
		// ior: options.ior,
		// reflectivity: options.reflectivity,
		//   thickness: options.thickness,
		envMap: hdrEquirect,
		envMapIntensity: options.envMapIntensity,
		// clearcoat: options.clearcoat,
		// clearcoatRoughness: options.clearcoatRoughness,
		normalScale: new THREE.Vector2(options.normalScale),
		normalMap: normalMapTexture,
		// clearcoatNormalMap: normalMapTexture,
		// clearcoatNormalScale: new THREE.Vector2(options.clearcoatNormalScale),
		// attenuationTint: options.attenuationTint,
		// attenuationDistance: options.attenuationDistance,
	});
	//##

	let mesh: THREE.Mesh;

	new STLLoader().load("data/dice.stl", (geometry_) => {
		
		const geometry = geometry_.clone();
		// Adjust geometry to suit our scene
		geometry.rotateX(-Math.PI / 2);
		// geometry.translate(0, -4, 0);

		mesh = new THREE.Mesh(geometry, material);
		mesh.scale.set(3,3,3);
		scene.add(mesh);
	});
	// Load dragon GLTF model
	if (false) {
		new GLTFLoader().load("data/dragon.glb", (gltf) => {
			const dragon = gltf.scene.children.find((mesh) => mesh.name === "Dragon") as THREE.Mesh;

			// Just copy the geometry from the loaded model
			const geometry = dragon.geometry.clone();

			// Adjust geometry to suit our scene
			geometry.rotateX(Math.PI / 2);
			geometry.translate(0, -4, 0);

			// Create a new mesh and place it in the scene
			mesh = new THREE.Mesh(geometry, material);
			// mesh.scale.set(0.25, 0.25, 0.25);
			scene.add(mesh);

			// Discard the loaded model
			gltf.scene.children.forEach((child) => {
				(child as THREE.Mesh).geometry.dispose();
				((child as THREE.Mesh).material as Material).dispose();
			});

		});
	}


	// GUI
	// ---

	// gui.add(options, "enableSwoopingCamera").onChange((val) => {
	// 	controls.enabled = !val;
	// 	controls.reset();
	// });

	gui.add(options, "enableRotation").onChange(() => {
		if (mesh) mesh.rotation.set(0, 0, 0);
	});

	gui.addColor(options, "color").onChange((val) => {
		material.color.set(val);
	});

	gui.add(options, "roughness", 0, 1, 0.01).onChange((val) => {
		material.roughness = val;
	});

	gui.add(options, "metalness", 0, 1, 0.01).onChange((val) => {
		material.metalness = val;
	});

	gui.add(options, "transmission", 0, 1, 0.01).onChange((val) => {
		material.transmission = val;
	});

	gui.add(options, "ior", 1, 2.33, 0.01).onChange((val) => {
		material.ior = val;
	});

	gui.add(options, "reflectivity", 0, 1, 0.01).onChange((val) => {
		material.reflectivity = val;
	});

	gui.add(options, "thickness", 0, 5, 0.1).onChange((val) => {
		material.thickness = val;
	});

	gui.add(options, "envMapIntensity", 0, 3, 0.1).onChange((val) => {
		material.envMapIntensity = val;
	});

	gui.add(options, "clearcoat", 0, 1, 0.01).onChange((val) => {
		material.clearcoat = val;
	});

	gui.add(options, "clearcoatRoughness", 0, 1, 0.01).onChange((val) => {
		material.clearcoatRoughness = val;
	});

	gui.add(options, "normalScale", 0, 5, 0.01).onChange((val) => {
		material.normalScale.set(val, val);
	});

	gui.add(options, "clearcoatNormalScale", 0, 5, 0.01).onChange((val) => {
		material.clearcoatNormalScale.set(val, val);
	});

	gui.add(options, "normalRepeat", 1, 4, 1).onChange((val) => {
		normalMapTexture.repeat.set(val, val);
	});

	// gui.addColor(options, "attenuationTint").onChange((val) => {
	//   material.attenuationTint.set(val);
	// });

	// gui.add(options, "attenuationDistance", 0, 1, 0.01).onChange((val) => {
	//   material.attenuationDistance = val;
	// });

	// const postprocessing = gui.addFolder("Post Processing");

	// postprocessing.add(options, "bloomThreshold", 0, 1, 0.01).onChange((val) => {
	// 	bloomPass.threshold = val;
	// });

	// postprocessing.add(options, "bloomStrength", 0, 5, 0.01).onChange((val) => {
	// 	bloomPass.strength = val;
	// });

	// postprocessing.add(options, "bloomRadius", 0, 1, 0.01).onChange((val) => {
	// 	bloomPass.radius = val;
	// });
	//#####################################################################


	// try {
	// 	const volume_range = document.getElementById("volume_range");
	// 	volume_range.addEventListener("input", function (val) {
	// 		isPlay = false;
	// 		curr_angle = duration * val.target.value / 100.0;
	// 	});
	// } catch { }


	function animate() {
		const delta = clock.getDelta();

		const ROTATE_TIME = 10; // Time in seconds for a full rotation
		const xAxis = new THREE.Vector3(1, 0, 0);
		const yAxis = new THREE.Vector3(0, 1, 0);
		const rotateX = (delta / ROTATE_TIME) * Math.PI * 2;
		const rotateY = (delta / ROTATE_TIME) * Math.PI * 2;

		if (options.enableRotation && mesh) {
			mesh.rotateOnWorldAxis(xAxis, rotateX);
			mesh.rotateOnWorldAxis(yAxis, rotateY);
		}

		renderer.render(scene, camera);
		stats.update();

		requestAnimationFrame(animate);
	}

	// после как код на местах убрать после init
	animate();

};

// 


const easeOutQuart = function (x: number) {
	// x = x + 0.1
	return 1 - Math.pow(1 - x, 4);
}

const easeOutSine = function (x: number) {
	return Math.sin((x * Math.PI) / 2);
}
const easeInSine = function (x: number) {
	if (x == Infinity || x == -Infinity) return 0;
	return 1 - Math.cos((x * Math.PI) / 2);
}

