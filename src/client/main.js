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

const options = {
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
		enableRotation: false,
		position: CNum("anim-position", 0.5),
	}

};

//_______________________________________________________________
const CANVAS_SIZE = {
	width: 1024,
	height: 1024,
}

var enable_rays = false;
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
	let material_dice;//Material
	let dice_obj = {
		group: null,

		center: null,

		mesh_dice: null,
		mesh_diceIn: null,
		number: []
	}; //:THREE.Group
	let mesh_number//: THREE.Object3D | undefined;

	const textureLoader = new THREE.TextureLoader();
	const dice_map = textureLoader.load("data/barhat.jpeg");
	const dice_bump_in = textureLoader.load("data/noise_bump_in_1.png");
	const dice_bump = textureLoader.load("data/barhat_bump.jpg");

	let dirLights = [];
	let spotLights = [];

	let group_ocl;
	let vlight;

	var oclcamera = new THREE.PerspectiveCamera(45, CANVAS_SIZE.width / CANVAS_SIZE.height, 1, 200);
	// oclcamera.position.copy(camera.position);

	var oclscene = new THREE.Scene();
	// oclscene.add(new THREE.AmbientLight(0xffffff));
	// oclscene.background = new THREE.Color(0x000000);

	// oclscene.add(new THREE.GridHelper(100, 100, 0x000000, 0x000000));

	vlight = new THREE.Mesh(
		new THREE.IcosahedronGeometry(0.35, 20),
		new THREE.MeshBasicMaterial({
			color: 0x77bbff
		})
	);
	group_ocl = new THREE.Group();
	group_ocl.add(vlight);
	oclscene.add(group_ocl);

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
			if (dice_obj.group) return;

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

			dice_obj.group = obj.getObjectByName("dice.obj");

			dice_obj.mesh_dice = obj.getObjectByName("DICE");
			dice_obj.mesh_diceIn = obj.getObjectByName("DICE_in");

			dice_obj.mesh_dice.removeFromParent();
			dice_obj.mesh_diceIn.removeFromParent();
			scene.add(obj);
			load_two();
		}
	);


	function load_two() {
		new OBJLoader().load("data/dice.obj",
			function (obj) {

				console.log(obj)

				dice_obj.group.add(obj)
				scene.add(dice_obj.group);

				dice_obj.mesh_dice = obj.getObjectByName("DICE_dice");
				dice_obj.mesh_diceIn = obj.getObjectByName("DICE_IN_dice_in");

				if (true) {
					dice_obj.mesh_dice.material = new THREE.MeshPhysicalMaterial()
					const mat = dice_obj.mesh_dice.material;
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

				if (true) {
					dice_obj.mesh_diceIn.scale.set(options.diceIn.scale, options.diceIn.scale, options.diceIn.scale)

					dice_obj.mesh_diceIn.material = new THREE.MeshStandardMaterial()
					const mat = dice_obj.mesh_diceIn.material
					mat.roughness = options.diceIn.roughness
					mat.metalness = options.diceIn.metalness

					mat.bumpScale = options.diceIn.bumpScale
					mat.bumpMap = dice_bump_in
				}


				dice_obj.center = getCenter(dice_obj.mesh_dice);
				for (let i = 1; i <= 20; ++i) {
					let ni = (i < 10 ? '0' : '') + i

					let obj_number = obj.getObjectByName(`n${ni}`)

					dice_obj.number.push(
						{
							obj: obj_number,
							center: getCenter(obj_number)
						}
					);
				}




				// dice_obj.mesh_dice.removeFromParent();dice_obj.mesh_dice = null;


				// mesh_number.removeFromParent(); mesh_number = null;

				// vlight.position.copy(center_mesh);


				// var gmat = new THREE.MeshBasicMaterial({ color: 0x000000, map: null });
				// group_ocl.add(cloneGeometry(dice_obj.mesh_dice, gmat));
				// group_ocl.add(cloneGeometry(mesh_number, gmat));

				setupConfigs()
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

	var map = null
	function setupConfigs() {
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
				dice_obj.mesh_diceIn.material.color.set(CSet("'diceIn-color", value))
			});

			dice_in_gp.add(options.diceIn, "roughness", 0, 1, 0.01).onChange((value) => {
				dice_obj.mesh_diceIn.material.roughness = CSet("diceIn-roughness", value)
			});
			dice_in_gp.add(options.diceIn, "metalness", 0, 1, 0.01).onChange((value) => {
				dice_obj.mesh_diceIn.material.metalness = CSet("diceIn-metalness", value)
			});
			dice_in_gp.add(options.diceIn, "bumpScale", 0, 3, 0.01).onChange((value) => {
				dice_obj.mesh_diceIn.material.bumpScale = CSet("diceIn-bumpScale", value)
			});

			dice_in_gp.add(options.diceIn, "scale", 0, 1, 0.01).onChange((value) => {
				let scale = CSet("diceIn-scale", value)
				dice_obj.mesh_diceIn.scale.set(scale, scale, scale)
			});
			dice_in_gp.open();
		}
		//dice 
		if (true) {
			let dice_gp = gui.addFolder("Dice");

			dice_gp.add(options.dice, "reflectivity", 0, 1, 0.01).onChange((value) => {
				dice_obj.mesh_dice.material.reflectivity = CSet("dice-reflectivity", value)
			});
			dice_gp.add(options.dice, "roughness", 0, 1, 0.01).onChange((value) => {
				dice_obj.mesh_dice.material.roughness = CSet("dice-roughness", value)
			});
			dice_gp.add(options.dice, "transmission", 0, 1, 0.01).onChange((value) => {
				dice_obj.mesh_dice.material.transmission = CSet("dice-transmission", value)
			});
			dice_gp.add(options.dice, "thickness", 0, 4, 0.01).onChange((value) => {
				dice_obj.mesh_dice.material.thickness = CSet("dice-thickness", value)
			});



			dice_gp.add(options.dice, "typeBump", ["none", "type_1", "type_2"]).onChange((value) => {
				CSet("dice-typeBump", value)

				switch (value) {
					case "none":
						dice_obj.mesh_dice.material.bumpMap = null
						break;
					case "type_1":
						dice_obj.mesh_dice.material.bumpMap = dice_bump
						break;
					case "type_2":
						dice_obj.mesh_dice.material.bumpMap = dice_bump_in
						break;
				}

				dice_obj.mesh_dice.material.needsUpdate = true;
			});
			dice_gp.add(options.dice, "bumpScale", 0, 3, 0.01).onChange((value) => {
				dice_obj.mesh_dice.material.bumpScale = CSet("dice-bumpScale", value)
			});

			// material_gp.add(options, "typeBump").onChange((value) => {
			// 	if (value) {
			// 		material_dice.bumpMap = bumpTexture_0;
			// 	} else {
			// 		material_dice.bumpMap = bumpTexture_1;
			// 	}
			// 	material_dice.needsUpdate = true;
			// });
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

		//____________
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

			folder.add(options_bloom, 'anim_d_r', 0.0, 2.0, 0.01).onChange(function (value) {
				CSet("bloom-anim_d_r", value);
			});
			folder.add(options_bloom, 'anim_speed', 1.0, 10.0, 0.1).onChange(function (value) {
				CSet("bloom-anim_speed", value);
			});
			folder.open();
		}
		scene.traverse(disposeMaterial);
		if (dice_obj.number.length > 0) {
			// scene.children.length = 0;

			dice_obj.number.forEach((number) => {

				const color = new THREE.Color();
				color.setHSL(Math.random(), 0.7, Math.random() * 0.2 + 0.05);

				const material = new THREE.MeshBasicMaterial({ color: color });

				number.obj.layers.enable(BLOOM_SCENE);
				number.obj.material = material;
			})

		}
		//_______________
		//Anim
		if (true) {
			const anim_gp = gui.addFolder('Anim');
			anim_gp.add(options.anim, "position", 0, 1, 0.01).onChange((value) => {
				CSet("anim-position", value)
			})

			anim_gp.add(options.anim, "enableRotation").onChange(() => {
				if (dice_obj.group) {
					dice_obj.group.rotation.set(0, 0, 0);
					group_ocl.rotation.set(0, 0, 0);
				}
			});


			anim_gp.open()
		}

		startDraw();

	}

	function startDraw() {
		window.addEventListener('resize', onWindowResize);
		onWindowResize();
		draw();
	}

	function draw() {
		const delta = clock.getDelta();


		dice_obj.number.forEach((obj_num, i) => {
			// obj.material.opacity = i * clock.elapsedTime

			const sub = new Vector3().subVectors(dice_obj.center, obj_num.center);
			const length = sub.length();
			const normal = sub.normalize();
			// const pl = sinft(0., 1, clock.elapsedTime * 3.0) * length
			const pl = sinft(0.8, 1, clock.elapsedTime * 3.0 + options.anim.position * i) * length;
			const new_pos = new Vector3().copy(dice_obj.center).add(normal.multiplyScalar(-pl));



			obj_num.obj.position.copy(new_pos)

			// vlight.position.copy(new_pos);
			// vlight.updateMatrixWorld();

		})
		const rotateX = delta / sinft(5, 10, clock.elapsedTime) * Math.PI * 2;
		const rotateY = delta / sinft(5, 7, clock.elapsedTime) * Math.PI * 2;
		const rotateZ = (delta / 7) * Math.PI * 2;


		//_________________________

		let start_radius = options_bloom.radius
		let b_st = options_bloom.anim_speed
		let b_adr = options_bloom.anim_d_r * 0.5

		bloomPass.radius = sinft(
			start_radius - b_adr,
			start_radius + b_adr,
			clock.elapsedTime * b_st
		)

		//_________________________


		if (options.anim.enableRotation && dice_obj.group) {
			group_rotate(dice_obj.group, rotateX, rotateY, rotateZ);
			group_rotate(group_ocl, rotateX, rotateY, rotateZ)
		}

		// renderer.render(scene, camera);
		// renderer.render(oclscene, camera);

		// camera.updateMatrixWorld();
		if (enable_rays) {
			var lPos = projectOnScreen(vlight, camera);
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
	var center = new THREE.Vector3();
	mesh.geometry.computeBoundingBox();
	mesh.geometry.boundingBox.getCenter(center);
	mesh.geometry.center();
	mesh.position.copy(center);
	return center;
}


function sinft(from, to, grad) {
	//10 - 5 + (1 + Math.sin(clock.elapsedTime) * 2))
	return from + (to - from) * ((1 + Math.sin(grad)) / 2);
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

const options_bloom = {
	exposure: CNum("bloom-exposure", 1),
	strength: CNum("bloom-strength", 6.3),
	radius: CNum("bloom-radius", 0.52),

	anim_d_r: CNum("bloom-anim_d_r", 0.34),
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


function CStr(key, defVal = null) {
	return Cookies.get(key) || defVal
}
function CNum(key, defVal = null) {
	return Number(Cookies.get(key) || defVal)
}
function CSet(key, val) {
	Cookies.set(key, val.toString())
	return Number(val)
}
window.onload = () => {
	window.create_anim();
}
