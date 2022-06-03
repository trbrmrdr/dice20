// 
// import * as THREE from 'three';
import * as THREE from './libs/three.js/build/three.module.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GUI } from 'dat.gui';
import Stats from 'three/examples/jsm/libs/stats.module'

import Cookies from 'js-cookie'
import { AmbientLight, EventDispatcher, Light, Material, MeshStandardMaterial, ObjectLoader, Texture, Vector3 } from './libs/three.js/build/three.module.js';
import { BokehShader, BokehDepthShader } from './libs/three.js/examples/jsm/shaders/BokehShader2.js';

import { OBJLoader } from './libs/three.js/examples/jsm/loaders/OBJLoader.js';
import { EffectComposer } from './libs/three.js/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './libs/three.js/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from './libs/three.js/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from './libs/three.js/examples/jsm/postprocessing/UnrealBloomPass.js';
import * as Shaders from './libs/shaders.js'

import { GodRaysFakeSunShader, GodRaysDepthMaskShader, GodRaysCombineShader, GodRaysGenerateShader } from './libs/three.js/examples/jsm/shaders/GodRaysShader.js';

// import "./styles.scss"



const stats = Stats()
stats.dom.style.left = '480px';
document.body.appendChild(stats.dom)

const gui = new GUI();

var options = {
	global: {
		background: CNum("backColor", 0x20000),
	},
	diceIn: {
		color: CNum("diceIn-color", 0x1243d9),
		roughness: CNum("diceIn-roughness", 0.27),
		metalness: CNum("diceIn-metalness", 0.84),
		bumpScale: CNum("diceIn-bumpScale", 0.71),
		scale: CNum("diceIn-scale", 0.95)
	},
	dice: {
		reflectivity: CNum("dice-reflectivity", 0.15),
		roughness: CNum("dice-roughness", 0.93),
		transmission: CNum("dice-transmission", 0.96),
		thickness: CNum("dice-thickness", 0.15),

		typeBump: CStr("dice-typeBump", "type_1"),
		bumpScale: CNum("dice-bumpScale", 0.01),
	},
	light: {
		dir: CNum("dir", 0.49),
		dirColor: CNum("dirColor", 0xE4E186),
		spot: CNum("spot", 0.75),
		spotColor: CNum("spotColor", 0xE2DBAB),
	},


	anim: {
		color: {
			h: Math.random(),
			h_end: Math.random(),

			l: 0.7,

			s: 0.03,
			s_end: 0.5
		},

		enableRotation: false,
		enableTranslateNumber: CGet("anim-enableTranslateNumber", true),
		show_all: false,
		position_number: CNum("anim-position_number", -0.09),

		speed: CNum("anim-speed", 2.74),
		delay: CNum("anim-delay", 0.27),


		raduis_main: CNum("anim-raduis_main", 1.5),

		radius_small_light: CNum("anim-radius_small_light", 1.0),
		position_light: CNum("anim-position_light", 1),
	}
};

// Cookies.remove("anim-color")
options.anim.color = CJson("anim-color", options.anim.color)

//_______________________________________________________________
const CANVAS_SIZE = {
	width: 1024,
	height: 1024,
}

var enable_rays = true;
window.create_anim = function (id_block = "canvas-container") {

	const canvas_container = document.getElementById(id_block);
	canvas_container.style.touchAction = 'none';
	canvas_container.addEventListener('pointermove', onPointerMove);
	canvas_container.addEventListener('pointerdown', onPointerDown);

	//____________________________
	const renderer = new THREE.WebGLRenderer({
		antialias: true, alpha: true
	});
	// renderer.setClearColor(options.global.background);
	renderer.toneMapping = THREE.ReinhardToneMapping;
	renderer.setClearColor(0x000000, 0);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(CANVAS_SIZE.width, CANVAS_SIZE.height);
	renderer.autoClear = false;
	renderer.sortObjects = true;
	// renderer.shadowMap.enabled = true;

	canvas_container.appendChild(renderer.domElement);
	//____________________________
	const scene = new THREE.Scene();
	// scene.background = new THREE.Color(0x414168);
	scene.background = new THREE.Color(options.global.background);
	// scene.background = null;
	//____________________________

	const camera = new THREE.PerspectiveCamera(45, CANVAS_SIZE.width / CANVAS_SIZE.height, 1, 200);
	camera.position.set(
		CNum('px', -0.027),
		CNum('py', 1.723),
		CNum('pz', 1.927));
	// camera.position.set(-0.06, 3.721, 4.16);

	//____________________________
	const controls = new OrbitControls(camera, renderer.domElement);
	// controls.target.set(0, 0, 0);
	controls.update();

	controls.addEventListener('change', () => {
		CSet('px', camera.position.x);
		CSet('py', camera.position.y);
		CSet('pz', camera.position.z);
	});
	//____________________________
	// const grid = new THREE.GridHelper(100, 100, 0x000000, 0x000000);
	// scene.add(grid);

	//____________________________

	function onWindowResize() {


		let new_width = canvas_container.clientWidth
		let new_height = new_width / CANVAS_SIZE.width * CANVAS_SIZE.height;
		if (canvas_container.clientWidth < canvas_container.clientHeight) {
		}
		if (canvas_container_size.width == new_width && canvas_container_size.height == new_height) return;
		canvas_container_size = { width: new_width, height: new_height };



		windowHalfX = window.innerWidth / 2;
		windowHalfY = window.innerHeight / 2;
		renderer.setSize(new_width, new_height);

		camera.aspect = new_width / new_height;
		camera.updateProjectionMatrix();


		// raysParam.rtOcl.setSize(new_width, new_height)
		// raysParam.rtFinal.setSize(new_width, new_height)
	}


	function onPointerDown(event) {

		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

		raycaster.setFromCamera(mouse, camera);
		const intersects = raycaster.intersectObjects(scene.children, false);
		if (intersects.length > 0) {

			const object = intersects[0].object;
			// object.layers.toggle(BLOOM_SCENE);
			// draw();
		}

	}

	function onPointerMove(event) {

	}




	//###########################################################################

	let diceOBJ = {
		resetAngle: () => {
			if (diceOBJ.group) {
				diceOBJ.group.rotation.set(0, 0, 0);
				diceOBJ.groupOcl.rotation.set(0, 0, 0);
			}
		},
		rotate: (delta, elapsed) => {
			const rotateX = delta / sinft(5, 10, elapsed) * Math.PI * 2;
			const rotateY = delta / sinft(5, 7, elapsed) * Math.PI * 2;
			const rotateZ = (delta / 3) * Math.PI * 2;
			group_rotate(diceOBJ.group, rotateX, rotateY, rotateZ);
			group_rotate(diceOBJ.groupOcl, rotateX, rotateY, rotateZ)
		},

		group: null,

		center: null,
		radius: -1,//TODO delete
		mesh_dice: null,
		mesh_diceIn: null,

		//init material
		//god light clone object
		//
		init: () => {

			//material mesh_dice
			if (true) {
				diceOBJ.mesh_dice.material = new THREE.MeshPhysicalMaterial()
				const mat = diceOBJ.mesh_dice.material;
				mat.reflectivity = options.dice.reflectivity
				mat.roughness = options.dice.roughness
				mat.transmission = options.dice.transmission
				mat.thickness = options.dice.thickness

				mat.map = dice_map


				// mat.bumpMap = dice_bump
				switch (options.dice.typeBump) {
					case "none":
						mat.bumpMap = null
						break;
					case "type_1":
						mat.bumpMap = dice_bump
						break;
					case "type_2":
						mat.bumpMap = dice_bump_in
						break;
				}

				mat.bumpScale = options.dice.bumpScale
			}
			//material diceIn
			if (true) {
				diceOBJ.mesh_diceIn.scale.set(options.diceIn.scale, options.diceIn.scale, options.diceIn.scale)

				diceOBJ.mesh_diceIn.material = new THREE.MeshStandardMaterial()
				const mat = diceOBJ.mesh_diceIn.material
				mat.roughness = options.diceIn.roughness
				mat.metalness = options.diceIn.metalness

				mat.bumpScale = options.diceIn.bumpScale
				mat.bumpMap = dice_bump_in
			}

			diceOBJ.center = getCenter(diceOBJ.mesh_dice);
			diceOBJ.radius = diceOBJ.mesh_dice.geometry.boundingSphere.radius

			// diceOBJ.mesh_dice.removeFromParent();diceOBJ.mesh_dice = null;

			// mesh_number.removeFromParent(); mesh_number = null;

			const gmat = new THREE.MeshBasicMaterial({ color: 0x000000, map: null });
			diceOBJ.groupOcl.add(cloneGeometry(diceOBJ.mesh_diceIn, gmat));
			// group_ocl.add(cloneGeometry(mesh_number, gmat));

		},

		numbers: [],
		addNumber: (meshNumber) => {
			//перед установкой материала всем цифрами - из примера
			// scene.traverse(disposeMaterial);

			meshNumber.layers.enable(BLOOM_SCENE);
			meshNumber.material = new THREE.MeshBasicMaterial();

			const numberObj = {
				obj: meshNumber,
				center: getCenter(meshNumber),
				color: {
					h: options.anim.color.h,
					l: options.anim.color.l,
					s: options.anim.color.s
				},

				light: new THREE.Mesh(
					new THREE.IcosahedronGeometry(0.2, 20),
					new THREE.MeshBasicMaterial({ color: 0x77bbff })
				)
			}
			diceOBJ.numbers.push(numberObj);
			meshNumber.material.color.setHSL(numberObj.color.h, numberObj.color.l, numberObj.color.s);


			if (diceOBJ.numbers.length > 1) return
			const light = numberObj.light
			diceOBJ.groupOcl.add(light);

			light.position.copy(numberObj.center);
			// diceOBJ.vlight.scale.set(scaleR, scaleR, scaleR)
		},


		groupOcl: new THREE.Group(),
		vlight: null,

		initLight: (scaleR) => {
			if (diceOBJ.vlight) {
				diceOBJ.vlight.scale.set(scaleR, scaleR, scaleR)
				return
			}

			diceOBJ.vlight = new THREE.Mesh(
				new THREE.IcosahedronGeometry(0.35, 20),
				new THREE.MeshBasicMaterial({ color: 0x77bbff })
			);
			diceOBJ.groupOcl.add(diceOBJ.vlight);

			diceOBJ.vlight.position.copy(diceOBJ.center);
			diceOBJ.vlight.scale.set(scaleR, scaleR, scaleR)
		}
	};

	const textureLoader = new THREE.TextureLoader();
	const dice_map = textureLoader.load("data/barhat.jpeg");
	const dice_bump_in = textureLoader.load("data/noise_bump_in_1.png");
	const dice_bump = textureLoader.load("data/barhat_bump.jpg");

	const dirLights = [];
	const spotLights = [];

	// var oclcamera = new THREE.PerspectiveCamera(45, CANVAS_SIZE.width / CANVAS_SIZE.height, 1, 200);
	// oclcamera.position.copy(camera.position);

	const oclscene = new THREE.Scene();
	// oclscene.add(new THREE.AmbientLight(0xffffff));
	// oclscene.background = new THREE.Color(0x000000);
	// oclscene.add(new THREE.GridHelper(100, 100, 0x000000, 0x000000));

	oclscene.add(diceOBJ.groupOcl);

	//______________________________________________________________
	raysParam.rtOcl = new THREE.WebGLRenderTarget(CANVAS_SIZE.width, CANVAS_SIZE.height, renderTargetParameters);
	raysParam.rtFinal = new THREE.WebGLRenderTarget(CANVAS_SIZE.width, CANVAS_SIZE.height, renderTargetParameters);

	const effectFXAA = new ShaderPass(Shaders.ShaderExtras.fxaa);
	effectFXAA.uniforms['resolution'].value.set(1 / CANVAS_SIZE.width, 1 / CANVAS_SIZE.height);

	const hblur = new ShaderPass(Shaders.ShaderExtras["horizontalBlur"]);
	const vblur = new ShaderPass(Shaders.ShaderExtras["verticalBlur"]);
	// hblur.renderToScreen= true;
	// vblur.renderToScreen = true;

	const bluriness = 2;

	hblur.uniforms['h'].value = bluriness / CANVAS_SIZE.width * 2;
	vblur.uniforms['v'].value = bluriness / CANVAS_SIZE.height * 2;

	const renderModel = new RenderPass(scene, camera);
	const renderModelOcl = new RenderPass(oclscene, camera);

	const grPass = new ShaderPass(Shaders.ShaderExtras.Godrays);
	grPass.uniforms.fExposure.value = 0.58;
	grPass.uniforms.fDecay.value = 0.98;
	grPass.uniforms.fDensity.value = 0.59;
	grPass.uniforms.fWeight.value = 0.21;
	grPass.uniforms.fClamp.value = 1.0;

	// grPass.needsSwap = true;
	// grPass.renderToScreen = true;

	const oclcomposer = new EffectComposer(renderer, raysParam.rtOcl);

	oclcomposer.addPass(renderModelOcl);
	oclcomposer.addPass(hblur);
	oclcomposer.addPass(vblur);

	oclcomposer.addPass(grPass);
	oclcomposer.addPass(hblur);
	oclcomposer.addPass(vblur);

	//test fCoeff 
	const additivePass = new ShaderPass(Shaders.ShaderExtras.Additive);
	additivePass.uniforms.tAdd.value = raysParam.rtOcl.texture;
	// additivePass.needsSwap = true;
	// additivePass.renderToScreen = true;

	const finalcomposer = new EffectComposer(renderer, raysParam.rtFinal);

	finalcomposer.addPass(renderModel);
	finalcomposer.addPass(effectFXAA);
	finalcomposer.addPass(additivePass);

	// finalcomposer.renderToScreen = false;
	//______________________________________________________________


	const bloomPass = new UnrealBloomPass(
		new THREE.Vector2(CANVAS_SIZE.width, CANVAS_SIZE.height),
		options_bloom.strength,
		options_bloom.radius,
		0);
	// bloomPass.clearColor = new THREE.Color(0x123FA3)

	const bloomComposer = new EffectComposer(renderer);
	bloomComposer.renderToScreen = false;
	bloomComposer.addPass(renderModel);
	bloomComposer.addPass(bloomPass);


	additivePass.uniforms.tAddBloom.value = bloomComposer.renderTarget2.texture;
	//______________________________________________________________

	new ObjectLoader().load("data/scene_2.json",
		function (obj) {
			if (obj.parent) return
			if (diceOBJ.group) return;

			obj.children.forEach((obj) => {

				if (obj.type == "SpotLight") {
					spotLights.push(obj);
					obj.intensity = options.light.spot;
					obj.color.set(options.light.spotColor)
				}
				if (obj.type == "DirectionalLight") {
					dirLights.push(obj);
					obj.intensity = options.light.dir;
					obj.color.set(options.light.dirColor)
				}
			})

			// scene.add(new AmbientLight(0x404040))

			diceOBJ.group = obj.getObjectByName("dice.obj");

			diceOBJ.mesh_dice = obj.getObjectByName("DICE");
			diceOBJ.mesh_diceIn = obj.getObjectByName("DICE_in");

			diceOBJ.mesh_dice.removeFromParent();
			diceOBJ.mesh_diceIn.removeFromParent();
			scene.add(obj);
			load_two();
		}
	);


	function load_two() {
		new OBJLoader().load("data/dice.obj",
			function (obj) {

				console.log(obj)

				diceOBJ.mesh_dice = obj.getObjectByName("DICE_dice");
				diceOBJ.mesh_diceIn = obj.getObjectByName("DICE_IN_dice_in");

				diceOBJ.mesh_diceIn.removeFromParent()
				diceOBJ.mesh_diceIn = diceOBJ.mesh_dice.clone()
				obj.add(diceOBJ.mesh_diceIn)
				//____________________
				// diceOBJ.mesh_diceIn = obj.getObjectByName("DICE_dice");
				// diceOBJ.mesh_dice = obj.getObjectByName("DICE_IN_dice_in");
				//____________________

				diceOBJ.group.add(obj)
				scene.add(diceOBJ.group);

				diceOBJ.init()

				for (let i = 1; i <= 20; ++i) {
					let ni = (i < 10 ? '0' : '') + i
					let obj_number = obj.getObjectByName(`n${ni}`)

					diceOBJ.addNumber(obj_number)
				}
				diceOBJ.initLight(options.anim.raduis)

				setupGUIConfigs()
			},
			// called when loading is in progresses
			function (xhr) {
				console.log((xhr.loaded / xhr.total * 100) + '% loaded');
			},
			// called when loading has errors
			function (error) {
				console.log('An error happened', error);
			});
	};


	function setupGUIConfigs() {
		//global
		if (true) {
			let global_gp = gui.addFolder("Global");
			global_gp.addColor(options.global, "background").onChange((value) => {

				scene.background = new THREE.Color(CSet("backColor", value));
				// renderer.setClearColor(options.global.background);

			});
		}
		//dice include
		if (true) {
			let dice_in_gp = gui.addFolder("dice in");

			dice_in_gp.addColor(options.diceIn, "color").onChange((value) => {
				diceOBJ.mesh_diceIn.material.color.set(CSet("'diceIn-color", value))
			});

			dice_in_gp.add(options.diceIn, "roughness", 0, 1, 0.01).onChange((value) => {
				diceOBJ.mesh_diceIn.material.roughness = CSet("diceIn-roughness", value)
			});
			dice_in_gp.add(options.diceIn, "metalness", 0, 1, 0.01).onChange((value) => {
				diceOBJ.mesh_diceIn.material.metalness = CSet("diceIn-metalness", value)
			});
			dice_in_gp.add(options.diceIn, "bumpScale", 0, 3, 0.01).onChange((value) => {
				diceOBJ.mesh_diceIn.material.bumpScale = CSet("diceIn-bumpScale", value)
			});

			dice_in_gp.add(options.diceIn, "scale", 0, 1, 0.01).onChange((value) => {
				let scale = CSet("diceIn-scale", value)
				diceOBJ.mesh_diceIn.scale.set(scale, scale, scale)
			});
			// dice_in_gp.open();
		}
		//dice 
		if (true) {
			let dice_gp = gui.addFolder("Dice");

			dice_gp.add(options.dice, "reflectivity", 0, 1, 0.01).onChange((value) => {
				diceOBJ.mesh_dice.material.reflectivity = CSet("dice-reflectivity", value)
			});
			dice_gp.add(options.dice, "roughness", 0, 1, 0.01).onChange((value) => {
				diceOBJ.mesh_dice.material.roughness = CSet("dice-roughness", value)
			});
			dice_gp.add(options.dice, "transmission", 0, 1, 0.01).onChange((value) => {
				diceOBJ.mesh_dice.material.transmission = CSet("dice-transmission", value)
			});
			dice_gp.add(options.dice, "thickness", 0, 4, 0.01).onChange((value) => {
				diceOBJ.mesh_dice.material.thickness = CSet("dice-thickness", value)
			});



			dice_gp.add(options.dice, "typeBump", ["none", "type_1", "type_2"]).onChange((value) => {
				CSet("dice-typeBump", value)

				switch (value) {
					case "none":
						diceOBJ.mesh_dice.material.bumpMap = null
						break;
					case "type_1":
						diceOBJ.mesh_dice.material.bumpMap = dice_bump
						break;
					case "type_2":
						diceOBJ.mesh_dice.material.bumpMap = dice_bump_in
						break;
				}

				diceOBJ.mesh_dice.material.needsUpdate = true;
			});
			dice_gp.add(options.dice, "bumpScale", 0, 3, 0.01).onChange((value) => {
				diceOBJ.mesh_dice.material.bumpScale = CSet("dice-bumpScale", value)
			});

		}

		//Lights
		if (true) {
			let golor_gp = gui.addFolder("Light");

			golor_gp.add(options.light, "dir", 0, 10, 0.01).onChange(function (value) {
				CSet("dir", value)

				dirLights.forEach((obj) => {
					obj.intensity = value;
				})
			});

			golor_gp.addColor(options.light, "dirColor").onChange(function (color) {
				CNum("dirColor", color)
				dirLights.forEach((obj) => {
					obj.color.set(color);
				})
			});

			golor_gp.add(options.light, "spot", 0, 20, 0.01).onChange(function (value) {
				CSet("spot", value)

				spotLights.forEach((obj) => {
					obj.intensity = value;
				})
			});

			golor_gp.addColor(options.light, "spotColor").onChange(function (color) {
				CSet("spotColor", color)

				spotLights.forEach((obj) => {
					obj.color.set(color);
				})
			});


		}

		//godrays
		if (true) {
			let rays_gp = gui.addFolder("Rays");

			rays_gp.add(grPass.uniforms.fExposure, 'value', 0, 1, 0.01).name("Exposure");
			rays_gp.add(grPass.uniforms.fDecay, 'value', 0, 1, 0.01).name("Decay");
			rays_gp.add(grPass.uniforms.fDensity, 'value', 0, 1, 0.01).name("Density");
			rays_gp.add(grPass.uniforms.fWeight, 'value', 0, 1, 0.01).name("Weight");
			rays_gp.add(grPass.uniforms.fClamp, 'value', 0, 1, 0.01).name("Clamp")

			// rays_gp.open();

		}
		//_______________
		//bloom
		if (true) {
			const folder = gui.addFolder('Bloom Parameters');

			renderer.toneMappingExposure = Math.pow(options_bloom.exposure, 4.0)
			folder.add(options_bloom, 'exposure', 0.1, 2, 0.01).onChange(function (value) {
				renderer.toneMappingExposure = Math.pow(CSet("bloom-exposure", value), 4.0);
			});


			folder.add(options_bloom, 'strength', 0.0, 50.0).onChange(function (value) {
				bloomPass.strength = CSet("bloom-strength", value);
			});

			folder.add(options_bloom, 'radius', 0.0, 5.0, 0.01).onChange(function (value) {
				bloomPass.radius = CSet("bloom-radius", value);
			});

			folder.add(options_bloom, 'radius_end', 0.0, 2.0, 0.01).onChange(function (value) {
				CSet("bloom-radius_end", value);
			});
			folder.add(options_bloom, 'anim_speed', 1.0, 10.0, 0.1).onChange(function (value) {
				CSet("bloom-anim_speed", value);
			});
			// folder.open();
		}
		//_______________
		//Anim
		if (true) {
			const anim_c_hls_gp = gui.addFolder('Anim_color_hls');

			var save_anim_json = (value) => { CSet("anim-color", options.anim.color) }

			anim_c_hls_gp.add(options.anim.color, "h", 0, 1, 0.01).onChange(save_anim_json)
			anim_c_hls_gp.add(options.anim.color, "h_end", 0, 1, 0.01).onChange(save_anim_json)

			anim_c_hls_gp.add(options.anim.color, "l", 0, 1, 0.01).onChange(save_anim_json)
			anim_c_hls_gp.add(options.anim.color, "s", 0, 1, 0.01).onChange(save_anim_json)
			anim_c_hls_gp.add(options.anim.color, "s_end", 0, 1, 0.01).onChange(save_anim_json)
			// anim_c_hls_gp.open()

			const anim_gp = gui.addFolder('Anim');
			anim_gp.add(options.anim, "enableRotation").onChange(() => {
				diceOBJ.resetAngle()
			});

			anim_gp.add(options.anim, "enableTranslateNumber").onChange((value) => {
				CSet("anim-enableTranslateNumber", value)
			});
			anim_gp.add(options.anim, "show_all").onChange(() => {
			});

			anim_gp.add(options.anim, "position_number", -1, 1, 0.01).onChange((value) => {
				CSet("anim-position_number", value)
			})
			anim_gp.add(options.anim, "speed", 0, 3, 0.01).onChange((value) => {
				CSet("anim-speed", value)
			})
			anim_gp.add(options.anim, "delay", 0, 1, 0.01).onChange((value) => {
				CSet("anim-delay", value)
			})


			anim_gp.add(options.anim, "raduis_main", 0, 5, 0.01).onChange((value) => {
				CSet("anim-raduis_main", value)
				diceOBJ.initLight(value)
			})

			anim_gp.add(options.anim, "radius_small_light", 0, 4, 0.01).onChange((value) => {
				CSet("anim-radius_small_light", value)

			})
			anim_gp.add(options.anim, "position_light", -0.5, 5, 0.01).onChange((value) => {
				CSet("anim-position_light", value)
			})

			anim_gp.open()
		}

		startDraw();

	}

	function startDraw() {
		window.addEventListener('resize', onWindowResize);
		onWindowResize();
		draw();
	}

	var once = true
	function draw() {
		const delta = clock.getDelta();

		let all_time = options.anim.delay + options.anim.speed
		let curr_time = mod(clock.elapsedTime, all_time)

		//resort number
		if (true) {
			if (curr_time <= 1) { once = true }
			if (curr_time >= all_time - 0.1 && once) {
				once = false
				shuffle(diceOBJ.numbers)
			}
		}

		let pos_t;
		diceOBJ.numbers.forEach((objNum, i) => {

			//sinft(0, 1, options.anim.color.h + clock.elapsedTime * options.anim.speed)
			// if (i == 6 && once) {
			const start = options.anim.delay / 20 * i
			const end = start + options.anim.speed

			// let t = curr_time <= start ? start : curr_time >= end ? end : curr_time
			// t = (t - start) / options.anim.speed

			let tp = (clamp(curr_time, start, end) - start) / options.anim.speed
			// console.log(start, end, t)

			let t = -Math.PI / 2 + tp * Math.PI * 2
			const curr_h = sinft(options.anim.color.h, options.anim.color.h_end, t)
			const curr_s = sinft(options.anim.color.s, options.anim.color.s_end, t)

			objNum.obj.material.color.setHSL(
				curr_h,
				options.anim.color.l,
				curr_s,
			)

			// }
			const sub = new Vector3().subVectors(diceOBJ.center, objNum.center);
			const length = sub.length();
			const normal = sub.normalize();
			const normal_fl = normal.clone();
			// const pl = sinft(0., 1, clock.elapsedTime * 3.0) * length
			// const pl = sinft(0.8, 1, clock.elapsedTime * 3.0 + options.anim.position * i) * length;


			let t2 = sinft(0, 1, t)
			if (options.anim.show_all) t2 = 1
			if (!options.anim.enableTranslateNumber) t2 = 0
			
			const pl = length * (options.anim.position_number + (t2 * 0.1));
			const new_pos = new Vector3().copy(diceOBJ.center).add(normal.multiplyScalar(-pl));


			objNum.obj.position.copy(new_pos)


			if (!objNum.light) return


			const pl_light = length * options.anim.position_light;
			const new_pos_light = new Vector3().copy(diceOBJ.center).add(normal_fl.multiplyScalar(-pl_light));

			objNum.light.scale.set(options.anim.radius_small_light, options.anim.radius_small_light, options.anim.radius_small_light)
			objNum.light.position.copy(new_pos_light);
			objNum.light.updateMatrixWorld();
		})

		//_________________________
		bloomPass.radius = sinft(
			options_bloom.radius,
			options_bloom.radius_end,
			clock.elapsedTime * options_bloom.anim_speed
		)

		//_________________________


		if (options.anim.enableRotation && diceOBJ.group) {
			diceOBJ.rotate(delta, clock.elapsedTime)
		}

		// renderer.render(scene, camera);
		// renderer.render(oclscene, camera);


		// camera.updateMatrixWorld();
		if (enable_rays) {
			var lPos = projectOnScreen(diceOBJ.vlight, camera);
			grPass.uniforms["fX"].value = lPos.x;
			grPass.uniforms["fY"].value = lPos.y;

			scene.traverse(darkenNonBloomed);
			bloomComposer.render();
			scene.traverse(restoreMaterial);

			oclcomposer.render();
			finalcomposer.render();
		} else {

			// renderer.render(scene, camera);
			scene.traverse(darkenNonBloomed);
			bloomComposer.render();
			scene.traverse(restoreMaterial);


			finalcomposer.render();
		}


		stats.update();


		requestAnimationFrame(draw);
	}


	function disposeMaterial(obj) {
		if (obj.material) {
			obj.material.dispose();
		}
	}

	function darkenNonBloomed(obj) {
		if (
			obj.isMesh && bloomLayer.test(obj.layers) === false
		) {
			// console.log(obj.name)
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

function getCenter(mesh) {
	mesh.geometry.computeBoundingSphere();
	return new THREE.Vector3().copy(mesh.geometry.boundingSphere.center);
}


function sinft(from, to, grad) {
	return from + (to - from) * ((1.0 + Math.sin(grad)) * 0.5);
}

function cosft(from, to, grad) {
	return from + (to - from) * ((1 + Math.cos(grad)) * 0.5);
}

function group_rotate(group, rotateX, rotateY, rotateZ) {
	group.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), rotateX);
	group.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), rotateY);
	group.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), rotateZ);
}


function cloneGeometry(mesh, gmat) {

	var geometryClone = mesh.geometry.clone();
	var gmesh = new THREE.Mesh(geometryClone, gmat);
	gmesh.position.clone(mesh.position);
	gmesh.rotation.clone(mesh.rotation);
	gmesh.scale.clone(mesh.scale);
	return gmesh;
}


function disposeMaterial(obj) {
	if (obj.material) {
		// console.log(obj.material);
		obj.material.dispose();
	}
}
//####################

function projectOnScreen(object, camera) {
	var mat = new THREE.Matrix4();
	mat.multiplyMatrices(camera.matrixWorldInverse, object.matrixWorld);
	mat.multiplyMatrices(camera.projectionMatrix, mat);

	var c = mat.elements[15]// .n44;
	// var lPos = new THREE.Vector3(mat.n14 / c, mat.n24 / c, mat.n34 / c);
	var lPos = new THREE.Vector3(mat.elements[12] / c, mat.elements[13] / c, mat.elements[14] / c);
	lPos.multiplyScalar(0.5);
	lPos.addScalar(0.5);
	return lPos;
}

//####################
function shuffle(array) {
	for (let i = array.length - 1; i > 0; i--) {
		let j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

function mod(f, m = 1) {
	return f % m;
}
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
//####################

const options_bloom = {
	exposure: CNum("bloom-exposure", 1),
	strength: CNum("bloom-strength", 6.3),

	radius: CNum("bloom-radius", 0.40),
	radius_end: CNum("bloom-radius_end", 0.60),
	anim_speed: CNum("bloom-anim_speed", 3.8)
};
const ENTIRE_SCENE = 0, BLOOM_SCENE = 1;

const bloomLayer = new THREE.Layers();
bloomLayer.set(BLOOM_SCENE);
const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
const materials = {};





let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

var canvas_container_size = { width: 0, height: 0 }
const clock = new THREE.Clock();


const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const renderTargetParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, stencilBufer: false };

var raysParam = {
	rtFinal: null,
	rtOcl: null,
	uniforms: {},
};


function CJson(key, defVal = {}) {
	try {
		return JSON.parse(Cookies.get(key)) || defVal
	} catch (ex) {
		return defVal
	}
}
function CStr(key, defVal = null) {
	return Cookies.get(key) || defVal
}
function CGet(key, defVal = null) {
	return CNum(key, defVal)
}

function CNum(key, defVal = null) {
	let type = typeof defVal


	if (type == 'boolean') {
		let t = Cookies.get(key)
		if (t) return t == 1 ? true : false
		return defVal
	}
	// if (type == 'undefined' ||
	// 	type == 'number'
	// )
	return Number(Cookies.get(key) || defVal)


}
function CSet(key, val) {
	if (typeof val == 'object') {
		Cookies.set(key, JSON.stringify(val))
		return val
	} else {
		Cookies.set(key, val.toString())
		return Number(val)
	}

}
window.onload = () => {
	window.create_anim();
}
