
import * as THREE from 'three';
// import * as THREE from './libs/three.js/build/three.module.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GUI } from 'dat.gui';
import Stats from 'three/examples/jsm/libs/stats.module'

import Cookies from 'js-cookie'
import { AmbientLight, EventDispatcher, Light, Material, MeshStandardMaterial, ObjectLoader, Texture, Vector3 } from './libs/three.js/build/three.module.js';
import { BokehShader, BokehDepthShader } from './libs/three.js/examples/jsm/shaders/BokehShader2.js';

import { EffectComposer } from './libs/three.js/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './libs/three.js/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from './libs/three.js/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from './libs/three.js/examples/jsm/postprocessing/UnrealBloomPass.js';


// import "./styles.scss"



const stats = Stats()
stats.dom.style.left = '480px';
document.body.appendChild(stats.dom)

const gui = new GUI();

const options = {
	dirLight: 1.2,
	dirLightColor: 0xE4E186,
	spotLight: 4,
	spotLightColor: 0xE2DBAB,

	enableMap: true,
	typeBump: true,
	roughness: 0.24,
	bumpScale: 0.22,

	enableRotation: false,

	enabled: false,
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

//_______________________________________________________________
const params_bloom = {
	exposure: 1,
	bloomStrength: 5,
	bloomThreshold: 0,
	bloomRadius: 0,
	scene: 'Scene with Glow'
};
const ENTIRE_SCENE = 0, BLOOM_SCENE = 1;

const bloomLayer = new THREE.Layers();
bloomLayer.set(BLOOM_SCENE);
const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
const materials = {};

//_______________________________________________________________
const CANVAS_SIZE = {
	width: 1024,
	height: 1024,
}
var canvas_container_size = { width: 0, height: 0 }
const clock = new THREE.Clock();



const hasPostProcessing = false;
const postprocessing = {};
var materialDepth;
const shaderSettings = {
	rings: 3,
	samples: 4
};

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

window.create_anim = function (id_block = "canvas-container") {

	const canvas_container = document.getElementById(id_block);
	canvas_container.style.touchAction = 'none';
	canvas_container.addEventListener('pointermove', onPointerMove);
	canvas_container.addEventListener('pointerdown', onPointerDown);

	//____________________________
	const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setClearColor(0x000000, 0);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(CANVAS_SIZE.width, CANVAS_SIZE.height);
	renderer.autoClear = false;
	renderer.toneMapping = THREE.ReinhardToneMapping;
	// renderer.shadowMap.enabled = true;

	canvas_container.appendChild(renderer.domElement);
	//____________________________
	const scene = new THREE.Scene();
	// scene.background = new THREE.Color(0x414168);
	scene.background = null;
	//____________________________

	const camera = new THREE.PerspectiveCamera(45, CANVAS_SIZE.width / CANVAS_SIZE.height, 1, 200);
	camera.position.set(
		Number(Cookies.get('px') || -0.06),
		Number(Cookies.get('py') || 3.721),
		Number(Cookies.get('pz') || 4.16));

	// camera.position.set(-0.06, 3.721, 4.16);
	//____________________________
	if (hasPostProcessing) {
		const depthShader = BokehDepthShader;

		materialDepth = new THREE.ShaderMaterial({
			uniforms: depthShader.uniforms,
			vertexShader: depthShader.vertexShader,
			fragmentShader: depthShader.fragmentShader
		});

		materialDepth.uniforms['mNear'].value = camera.near;
		materialDepth.uniforms['mFar'].value = camera.far;
	}
	//____________________________
	const controls = new OrbitControls(camera, renderer.domElement);
	// controls.target.set(0, 0, 0);
	controls.update();

	controls.addEventListener('change', () => {
		Cookies.set('px', camera.position.x.toString());
		Cookies.set('py', camera.position.y.toString());
		Cookies.set('pz', camera.position.z.toString());
	});
	//____________________________
	const grid = new THREE.GridHelper(100, 100, 0x000000, 0x000000);
	scene.add(grid);
	//____________________________


	// scene.add( new THREE.AmbientLight( 0x404040 ) );
	const renderScene = new RenderPass(scene, camera);

	const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0);
	// bloomPass.threshold = params_bloom.bloomThreshold;
	bloomPass.strength = params_bloom.bloomStrength;
	bloomPass.radius = params_bloom.bloomRadius;

	const bloomComposer = new EffectComposer(renderer);
	bloomComposer.renderToScreen = false;
	bloomComposer.addPass(renderScene);
	bloomComposer.addPass(bloomPass);

	const finalPass = new ShaderPass(
		new THREE.ShaderMaterial({
			uniforms: {
				baseTexture: { value: null },
				bloomTexture: { value: bloomComposer.renderTarget2.texture }
			},
			vertexShader: `varying vec2 vUv;
			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			}`,
			fragmentShader: `uniform sampler2D baseTexture;
			uniform sampler2D bloomTexture;
			varying vec2 vUv;
			void main() {
				gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );

			}`,
			defines: {}
		}), 'baseTexture'
	);
	finalPass.needsSwap = true;

	const finalComposer = new EffectComposer(renderer);
	finalComposer.addPass(renderScene);
	finalComposer.addPass(finalPass);

	//____________________________


	window.addEventListener('resize', onWindowResize);

	if (hasPostProcessing) initPostprocessing();
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

		if (hasPostProcessing) {
			postprocessing.rtTextureDepth.setSize(window.innerWidth, window.innerHeight);
			postprocessing.rtTextureColor.setSize(window.innerWidth, window.innerHeight);

			postprocessing.bokeh_uniforms['textureWidth'].value = window.innerWidth;
			postprocessing.bokeh_uniforms['textureHeight'].value = window.innerHeight;
		}

		renderer.setSize(new_width, new_height);

		camera.aspect = new_width / new_height;
		camera.updateProjectionMatrix();

		bloomComposer.setSize(new_width, new_height);
		finalComposer.setSize(new_width, new_height);
		console.log(window.innerWidth, window.innerHeight);
		// draw();
	}


	function onPointerDown(event) {

		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

		raycaster.setFromCamera(mouse, camera);
		const intersects = raycaster.intersectObjects(scene.children, false);
		if (intersects.length > 0) {

			const object = intersects[0].object;
			object.layers.toggle(BLOOM_SCENE);
			// draw();
		}

	}

	function onPointerMove(event) {
		if (hasPostProcessing) {
			if (event.isPrimary === false) return;
			mouse.x = (event.clientX - windowHalfX) / windowHalfX;
			mouse.y = - (event.clientY - windowHalfY) / windowHalfY;

			// console.log(event.clientX / window.innerWidth, 1 - (event.clientY / window.innerHeight));
			postprocessing.bokeh_uniforms['focusCoords'].value.set(event.clientX / window.innerWidth, 1 - (event.clientY / window.innerHeight));
		}
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
	let material_dice;//Material
	let group_dice //:THREE.Group
	let mesh_dice, mesh_number//: THREE.Object3D | undefined;

	const textureLoader = new THREE.TextureLoader();
	const dice_map = textureLoader.load("data/map.png");
	const bumpTexture_0 = textureLoader.load("data/ret_noise_bump.png");
	const bumpTexture_1 = textureLoader.load("data/ret_noise_bump_2.png");

	let dirLights = [];
	let spotLights = [];
	new ObjectLoader().load("data/scene_2.json",
		function (obj) {
			if (obj.parent) return
			obj.children.forEach((obj) => {
				// if (obj as Light)(obj as Light)
				// if(obj.type == DirectionalLight)
				if (obj.type == "SpotLight") {
					spotLights.push(obj);
					obj.intensity = options.spotLight;
				}
				if (obj.type == "DirectionalLight") {
					dirLights.push(obj);
					obj.intensity = options.dirLight;
				}
			})

			// scene.add(new AmbientLight(0x404040))

			group_dice = obj.getObjectByName("dice_2.obj");
			mesh_number = obj.getObjectByName("number_1");

			mesh_dice = obj.getObjectByName("dice");

			// mesh_dice.removeFromParent();mesh_dice = null;
			material_dice = mesh_dice.material;

			material_dice.map = dice_map;
			material_dice.bumpMap = bumpTexture_0;
			material_dice.needsUpdate = true;

			scene.add(obj);

			afterLoad();
		},

		function (xhr) {
			console.log((xhr.loaded / xhr.total * 100) + '% loaded');
		},

		function (err) {
			console.error('An error happened');
		}
	);

	var map = null
	function afterLoad() {

		gui.add(options, "enableMap").onChange((value) => {

			if (value) {
				material_dice.map = map;
			} else {
				map = material_dice.map;
				material_dice.map = null;
			}
			material_dice.needsUpdate = true;
		});

		gui.add(options, "typeBump").onChange((value) => {
			if (value) {
				material_dice.bumpMap = bumpTexture_0;
			} else {
				material_dice.bumpMap = bumpTexture_1;
			}
			material_dice.needsUpdate = true;
		});

		gui.add(options, 'roughness', 0, 1, 0.01).onChange(function (value) {
			material_dice.roughness = value;
		});
		// MeshStandardMaterial

		gui.add(options, 'bumpScale', 0, 1, 0.01).onChange(function (value) {
			material_dice.bumpScale = value;
		});

		let golor_gp = gui.addFolder("Light");

		golor_gp.add(options, 'dirLight', 0, 10, 0.01).onChange(function (value) {
			dirLights.forEach((obj) => {
				obj.intensity = value;
			})
		});

		golor_gp.addColor(options, 'dirLightColor').onChange(function (color) {
			dirLights.forEach((obj) => {
				obj.color.set(color);
			})
		});

		golor_gp.add(options, 'spotLight', 0, 20, 0.01).onChange(function (value) {
			spotLights.forEach((obj) => {
				obj.intensity = value;
			})
		});

		golor_gp.addColor(options, 'spotLightColor').onChange(function (color) {
			spotLights.forEach((obj) => {
				obj.color.set(color);
			})
		});

		gui.add(options, "enableRotation").onChange(() => {
			if (mesh_dice) mesh_dice.rotation.set(0, 0, 0);
		});

		if (hasPostProcessing) {

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


			let effect_gp = gui.addFolder("Effect");

			effect_gp.add(options, 'enabled').onChange(matChanger);
			// effect_gp.add(options, 'jsDepthCalculation').onChange(matChanger);
			// effect_gp.add(options, 'shaderFocus').onChange(matChanger);
			effect_gp.add(options, 'focalDepth', 0.0, 100.0).listen().onChange(matChanger);

			effect_gp.add(options, 'fstop', 0.1, 50, 0.001).onChange(matChanger);
			effect_gp.add(options, 'maxblur', 0.0, 5.0, 0.025).onChange(matChanger);

			// effect_gp.add(options, 'showFocus').onChange(matChanger);
			effect_gp.add(options, 'manualdof').onChange(matChanger);
			effect_gp.add(options, 'vignetting').onChange(matChanger);

			effect_gp.add(options, 'depthblur').onChange(matChanger);

			effect_gp.add(options, 'threshold', 0, 1, 0.001).onChange(matChanger);
			effect_gp.add(options, 'gain', 0, 100, 0.001).onChange(matChanger);
			effect_gp.add(options, 'bias', 0, 3, 0.001).onChange(matChanger);
			effect_gp.add(options, 'fringe', 0, 5, 0.001).onChange(matChanger);

			effect_gp.add(options, 'focalLength', 16, 80, 0.001).onChange(matChanger);

			effect_gp.add(options, 'noise').onChange(matChanger);

			effect_gp.add(options, 'dithering', 0, 0.001, 0.0001).onChange(matChanger);

			effect_gp.add(options, 'pentagon').onChange(matChanger);

			effect_gp.add(shaderSettings, 'rings', 1, 8).step(1).onChange(shaderUpdate);
			effect_gp.add(shaderSettings, 'samples', 1, 13).step(1).onChange(shaderUpdate);

			matChanger();


			function shaderUpdate() {

				postprocessing.materialBokeh.defines.RINGS = shaderSettings.rings;
				postprocessing.materialBokeh.defines.SAMPLES = shaderSettings.samples;
				postprocessing.materialBokeh.needsUpdate = true;

			}
		}

		//##########################################################################
		gui.add(params_bloom, 'scene', ['Scene with Glow', 'Glow only', 'Scene only']).onChange(function (value) {
			switch (value) {
				case 'Scene with Glow':
					bloomComposer.renderToScreen = false;
					break;
				case 'Glow only':
					bloomComposer.renderToScreen = true;
					break;
				case 'Scene only':
					// nothing to do
					break;
			}
			// draw();
		});

		const folder = gui.addFolder('Bloom Parameters');

		folder.add(params_bloom, 'exposure', 0.1, 2).onChange(function (value) {
			renderer.toneMappingExposure = Math.pow(value, 4.0);
		});

		// folder.add(params_bloom, 'bloomThreshold', 0.0, 1.0, 0.01).onChange(function (value) {
		// 	bloomPass.threshold = Number(value);
		// });

		folder.add(params_bloom, 'bloomStrength', 0.0, 50.0).onChange(function (value) {
			bloomPass.strength = Number(value);
		});

		folder.add(params_bloom, 'bloomRadius', 0.0, 5.0).step(0.01).onChange(function (value) {
			bloomPass.radius = Number(value);
		});
		folder.open();


		scene.traverse(disposeMaterial);
		// scene.children.length = 0;

		const color = new THREE.Color();
		color.setHSL(Math.random(), 0.7, Math.random() * 0.2 + 0.05);

		const material = new THREE.MeshBasicMaterial({ color: color });
		mesh_number.layers.enable(BLOOM_SCENE);
		mesh_number.material = material;




		//##########################################################################
		// try {
		// 	const volume_range = document.getElementById("volume_range");
		// 	volume_range.addEventListener("input", function (val) {
		// 		isPlay = false;
		// 		curr_angle = duration * val.target.value / 100.0;
		// 	});
		// } catch { }

		// после как код на местах убрать после init
		draw();

	}

	function draw() {
		const delta = clock.getDelta();


		const rotateX = (delta / (10 - 5 + (1 + Math.sin(clock.elapsedTime) * 2))) * Math.PI * 2;
		const rotateY = (delta / (5 + 2 * (1 + Math.sin(clock.elapsedTime) * 2))) * Math.PI * 2;
		const rotateZ = (delta / 7) * Math.PI * 2;

		if (options.enableRotation && group_dice) {
			group_dice.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), rotateX);
			group_dice.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), rotateY);
			group_dice.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), rotateZ);
		}

		// renderer.render(scene, camera);

		camera.lookAt(new Vector3(0, 0, 0));

		camera.updateMatrixWorld();


		if (hasPostProcessing && postprocessing.enabled) {

			renderer.clear();

			// render scene into texture

			renderer.setRenderTarget(postprocessing.rtTextureColor);
			renderer.clear();
			renderer.render(scene, camera);
			// drawDice();


			// render depth into texture

			scene.overrideMaterial = materialDepth;
			renderer.setRenderTarget(postprocessing.rtTextureDepth);
			renderer.clear();
			renderer.render(scene, camera);
			// drawDice();

			scene.overrideMaterial = null;

			// render bokeh composite

			renderer.setRenderTarget(null);
			renderer.render(postprocessing.scene, postprocessing.camera);
			// camera.layers.set(BLOOM_SCENE);
			// bloomComposer.render();
			// camera.layers.set(ENTIRE_SCENE);

		} else {

			scene.overrideMaterial = null;

			// renderer.setRenderTarget(null);
			// renderer.clear();
			// renderer.render(scene, camera);


			// renderer.render( scene, camera );

			drawDice();

		}

		stats.update();
		requestAnimationFrame(draw);
	}
	function drawDice() {
		switch (params_bloom.scene) {

			case 'Scene only':
				renderer.render(scene, camera);
				break;
			case 'Glow only':
				camera.layers.set(BLOOM_SCENE);
				bloomComposer.render();
				camera.layers.set(ENTIRE_SCENE);
				break;
			case 'Scene with Glow':
			default:
				scene.traverse(darkenNonBloomed);
				bloomComposer.render();
				scene.traverse(restoreMaterial);
				finalComposer.render();
				break;
		}
	}

	function darkenNonBloomed(obj) {
		if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
			materials[obj.uuid] = obj.material;
			obj.material = darkMaterial;
		}
	}

	function restoreMaterial(obj) {
		if (materials[obj.uuid]) {
			obj.material = materials[obj.uuid];
			delete materials[obj.uuid];
		}
	}

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


function disposeMaterial(obj) {
	if (obj.material) {
		// console.log(obj.material);
		obj.material.dispose();
	}
}





//####################

window.onload = () => {
	window.create_anim();
}
