
import * as THREE from 'three';
// import * as THREE from 'three/build/three.module.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GUI } from 'dat.gui';
import Stats from 'three/examples/jsm/libs/stats.module'

import Cookies from 'js-cookie'
import { EventDispatcher, Light, Material, ObjectLoader, Vector3 } from 'three';
import { BokehShader, BokehDepthShader } from 'three/examples/jsm/shaders/BokehShader2.js';
import { type } from 'os';



const stats = Stats()
stats.dom.style.left = '480px';
document.body.appendChild(stats.dom)

const gui = new GUI();
const options = {
	enableRotation: true,

	enabled: true,
	// jsDepthCalculation: false,
	shaderFocus: false,

	fstop: 4.3,
	maxblur: 0.72,

	showFocus: false,
	focalDepth: 14.5,
	manualdof: true,
	vignetting: true,
	depthblur: true,

	threshold: 0.34,
	gain: 3.04,
	bias: 0.93,
	fringe: 0.93,

	focalLength: 35,
	noise: true,
	pentagon: false,

	dithering: 0.0001

};


const CANVAS_SIZE = {
	width: 1024,
	height: 1024,
}
var canvas_container_size = { width: 0, height: 0 }
const clock = new THREE.Clock();



let distance = 100;

const postprocessing = { enabled: true };

const shaderSettings = {
	rings: 3,
	samples: 4
};

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const target = new THREE.Vector3(0, 20, - 50);
const planes = [];
const leaves = 100;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

window.create_anim = function (id_block = "canvas-container") {

	const canvas_container = document.getElementById(id_block);

	canvas_container.style.touchAction = 'none';
	canvas_container.addEventListener('pointermove', onPointerMove);

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x414168);


	// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

	const camera = new THREE.PerspectiveCamera(45, CANVAS_SIZE.width / CANVAS_SIZE.height, 1, 100);
	camera.position.set(
		Number(Cookies.get('px') || -0.06),
		Number(Cookies.get('py') || 3.721),
		Number(Cookies.get('pz') || 4.16));



	const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setClearColor(0x000000, 0);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(CANVAS_SIZE.width, CANVAS_SIZE.height);
	renderer.autoClear = false;
	// renderer.shadowMap.enabled = true;
	canvas_container.appendChild(renderer.domElement);


	const depthShader = BokehDepthShader;

	const materialDepth = new THREE.ShaderMaterial({
		uniforms: depthShader.uniforms,
		vertexShader: depthShader.vertexShader,
		fragmentShader: depthShader.fragmentShader
	});

	materialDepth.uniforms['mNear'].value = camera.near;
	materialDepth.uniforms['mFar'].value = camera.far;

	const controls = new OrbitControls(camera, renderer.domElement);
	// controls.target.set(0, 0, 0);
	controls.update();

	controls.addEventListener('change', () => {
		Cookies.set('px', camera.position.x.toString());
		Cookies.set('py', camera.position.y.toString());
		Cookies.set('pz', camera.position.z.toString());
	});

	const grid = new THREE.GridHelper(100, 100, 0x000000, 0x000000);
	scene.add(grid);


	window.addEventListener('resize', onWindowResize);


	initPostprocessing();
	onWindowResize();

	function onWindowResize() {

		let new_width = canvas_container.clientWidth
		let new_height = new_width / CANVAS_SIZE.width * CANVAS_SIZE.height;
		if (canvas_container.clientWidth < canvas_container.clientHeight) {
		}
		if (canvas_container_size.width == new_width && canvas_container_size.height == new_height) return;
		canvas_container_size = { width: new_width, height: new_height };



		windowHalfX = window.innerWidth / 2;
		windowHalfY = window.innerHeight / 2;

		postprocessing.rtTextureDepth.setSize(window.innerWidth, window.innerHeight);
		postprocessing.rtTextureColor.setSize(window.innerWidth, window.innerHeight);

		postprocessing.bokeh_uniforms['textureWidth'].value = window.innerWidth;
		postprocessing.bokeh_uniforms['textureHeight'].value = window.innerHeight;


		renderer.setSize(new_width, new_height);

		camera.aspect = new_width / new_height;
		camera.updateProjectionMatrix();
	}

	function onPointerMove(event) {


		if (event.isPrimary === false) return;
		mouse.x = (event.clientX - windowHalfX) / windowHalfX;
		mouse.y = - (event.clientY - windowHalfY) / windowHalfY;

		// console.log(event.clientX / window.innerWidth, 1 - (event.clientY / window.innerHeight));
		postprocessing.bokeh_uniforms['focusCoords'].value.set(event.clientX / window.innerWidth, 1 - (event.clientY / window.innerHeight));

	}

	function initPostprocessing() {
		postprocessing.scene = new THREE.Scene();

		postprocessing.camera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, - 10000, 10000);
		postprocessing.camera.position.z = 100;

		postprocessing.scene.add(postprocessing.camera);

		postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
		postprocessing.rtTextureColor = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

		const bokeh_shader = BokehShader;

		postprocessing.bokeh_uniforms = THREE.UniformsUtils.clone(bokeh_shader.uniforms);

		postprocessing.bokeh_uniforms['tColor'].value = postprocessing.rtTextureColor.texture;
		postprocessing.bokeh_uniforms['tDepth'].value = postprocessing.rtTextureDepth.texture;
		postprocessing.bokeh_uniforms['textureWidth'].value = window.innerWidth;
		postprocessing.bokeh_uniforms['textureHeight'].value = window.innerHeight;

		postprocessing.materialBokeh = new THREE.ShaderMaterial({

			uniforms: postprocessing.bokeh_uniforms,
			vertexShader: bokeh_shader.vertexShader,
			fragmentShader: bokeh_shader.fragmentShader,
			defines: {
				RINGS: shaderSettings.rings,
				SAMPLES: shaderSettings.samples
			}

		});

		postprocessing.quad = new THREE.Mesh(new THREE.PlaneGeometry(window.innerWidth, window.innerHeight), postprocessing.materialBokeh);
		postprocessing.quad.position.z = - 500;
		postprocessing.scene.add(postprocessing.quad);

	}


	//###########################################################################
	let mesh//: THREE.Object3D | undefined;
	new ObjectLoader().load("data/scene.json",
		function (obj) {
			if (obj.parent) return
			obj.children.forEach((obj) => {
				// if (obj as Light)(obj as Light)
				obj.intensity *= 10;
			})
			mesh = obj.getObjectByName("Solid.002");
			scene.add(obj);
		},

		function (xhr) {
			console.log((xhr.loaded / xhr.total * 100) + '% loaded');
		},

		function (err) {
			console.error('An error happened');
		}
	);


	// GUI
	// ---
	gui.add(options, "enableRotation").onChange(() => {
		if (mesh) mesh.rotation.set(0, 0, 0);
	});


	const matChanger = function () {

		for (const e in options) {

			if (e in postprocessing.bokeh_uniforms) {

				postprocessing.bokeh_uniforms[e].value = options[e];

			}

		}

		postprocessing.enabled = options.enabled;
		postprocessing.bokeh_uniforms['znear'].value = camera.near;
		postprocessing.bokeh_uniforms['zfar'].value = camera.far;
		camera.setFocalLength(options.focalLength);

	};

	gui.add(options, 'enabled').onChange(matChanger);
	// gui.add(options, 'jsDepthCalculation').onChange(matChanger);
	// gui.add(options, 'shaderFocus').onChange(matChanger);
	gui.add(options, 'focalDepth', 0.0, 100.0).listen().onChange(matChanger);

	gui.add(options, 'fstop', 0.1, 50, 0.001).onChange(matChanger);
	gui.add(options, 'maxblur', 0.0, 5.0, 0.025).onChange(matChanger);

	// gui.add(options, 'showFocus').onChange(matChanger);
	gui.add(options, 'manualdof').onChange(matChanger);
	gui.add(options, 'vignetting').onChange(matChanger);

	gui.add(options, 'depthblur').onChange(matChanger);

	gui.add(options, 'threshold', 0, 1, 0.001).onChange(matChanger);
	gui.add(options, 'gain', 0, 100, 0.001).onChange(matChanger);
	gui.add(options, 'bias', 0, 3, 0.001).onChange(matChanger);
	gui.add(options, 'fringe', 0, 5, 0.001).onChange(matChanger);

	gui.add(options, 'focalLength', 16, 80, 0.001).onChange(matChanger);

	gui.add(options, 'noise').onChange(matChanger);

	gui.add(options, 'dithering', 0, 0.001, 0.0001).onChange(matChanger);

	gui.add(options, 'pentagon').onChange(matChanger);

	gui.add(shaderSettings, 'rings', 1, 8).step(1).onChange(shaderUpdate);
	gui.add(shaderSettings, 'samples', 1, 13).step(1).onChange(shaderUpdate);

	matChanger();



	//#####################################################################


	// try {
	// 	const volume_range = document.getElementById("volume_range");
	// 	volume_range.addEventListener("input", function (val) {
	// 		isPlay = false;
	// 		curr_angle = duration * val.target.value / 100.0;
	// 	});
	// } catch { }

	function linearize(depth) {

		const zfar = camera.far;
		const znear = camera.near;
		return - zfar * znear / (depth * (zfar - znear) - zfar);

	}

	function smoothstep(near, far, depth) {

		const x = saturate((depth - near) / (far - near));
		return x * x * (3 - 2 * x);

	}

	function saturate(x) {

		return Math.max(0, Math.min(1, x));

	}

	function shaderUpdate() {

		postprocessing.materialBokeh.defines.RINGS = shaderSettings.rings;
		postprocessing.materialBokeh.defines.SAMPLES = shaderSettings.samples;
		postprocessing.materialBokeh.needsUpdate = true;

	}


	function animate() {
		const delta = clock.getDelta();


		const rotateX = (delta / (10 - 5 + (1 + Math.sin(clock.elapsedTime) * 2))) * Math.PI * 2;
		const rotateY = (delta / (5 + 2 * (1 + Math.sin(clock.elapsedTime) * 2))) * Math.PI * 2;
		const rotateZ = (delta / 7) * Math.PI * 2;

		if (options.enableRotation && mesh) {
			mesh.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), rotateX);
			mesh.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), rotateY);
			mesh.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), rotateZ);
		}

		// renderer.render(scene, camera);


		camera.lookAt(new Vector3(0, 0, 0));

		camera.updateMatrixWorld();

		// if (options.jsDepthCalculation) {

		// 	raycaster.setFromCamera(mouse, camera);

		// 	const intersects = raycaster.intersectObjects(scene.children, true);

		// 	const targetDistance = (intersects.length > 0) ? intersects[0].distance : 1000;

		// 	distance += (targetDistance - distance) * 0.03;

		// 	const sdistance = smoothstep(camera.near, camera.far, distance);

		// 	const ldistance = linearize(1 - sdistance);

		// 	postprocessing.bokeh_uniforms['focalDepth'].value = ldistance;

		// 	options['focalDepth'] = ldistance;

		// }

		if (postprocessing.enabled) {

			renderer.clear();

			// render scene into texture

			renderer.setRenderTarget(postprocessing.rtTextureColor);
			renderer.clear();
			renderer.render(scene, camera);

			// render depth into texture

			scene.overrideMaterial = materialDepth;
			renderer.setRenderTarget(postprocessing.rtTextureDepth);
			renderer.clear();
			renderer.render(scene, camera);
			scene.overrideMaterial = null;

			// render bokeh composite

			renderer.setRenderTarget(null);
			renderer.render(postprocessing.scene, postprocessing.camera);


		} else {

			scene.overrideMaterial = null;

			renderer.setRenderTarget(null);
			renderer.clear();
			renderer.render(scene, camera);

		}


		stats.update();
		requestAnimationFrame(animate);
	}

	// после как код на местах убрать после init
	animate();

};

// 


const easeOutQuart = function (x) {
	// x = x + 0.1
	return 1 - Math.pow(1 - x, 4);
}

const easeOutSine = function (x) {
	return Math.sin((x * Math.PI) / 2);
}
const easeInSine = function (x) {
	if (x == Infinity || x == -Infinity) return 0;
	return 1 - Math.cos((x * Math.PI) / 2);
}

