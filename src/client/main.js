// 
// import * as THREE from 'three';
import * as THREE from './libs/three.js/build/three.module.js';

import { GUI } from 'dat.gui';
import Stats from 'three/examples/jsm/libs/stats.module'


import { AmbientLight, EventDispatcher, Light, Material, MeshStandardMaterial, ObjectLoader, Texture, Vector3 } from './libs/three.js/build/three.module.js';
import { BokehShader, BokehDepthShader } from './libs/three.js/examples/jsm/shaders/BokehShader2.js';

import { OBJLoader } from './libs/three.js/examples/jsm/loaders/OBJLoader.js';
import { EffectComposer } from './libs/three.js/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './libs/three.js/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from './libs/three.js/examples/jsm/postprocessing/ShaderPass.js';
import * as Shaders from './libs/shaders.js'
import * as H from './helper.js'
import * as S from './saves.js'

import { options } from './options.js'
import { Bloom } from './Bloom.js'
import { GoodRay } from './GoodRay.js'
import { World } from './World.js'
import { Dice } from './Dice.js'
import { GodRaysFakeSunShader, GodRaysDepthMaskShader, GodRaysCombineShader, GodRaysGenerateShader } from './libs/three.js/examples/jsm/shaders/GodRaysShader.js';

// import "./styles.scss"

var enable_rays = true;


const stats = Stats()
stats.dom.style.left = '480px';
document.body.appendChild(stats.dom)

const gui = new GUI();


//_______________________________________________________________
//все размеры - непересоздаются
// также перед созданием все размеры больше - нет смысла!!!!
const CANVAS_SIZE = {
	width: 1024,
	height: 1024,
}


const mBloomObj = new Bloom();
const mGoodRay = new GoodRay();

const clock = new THREE.Clock();

const mWorld = new World(CANVAS_SIZE);
const mDiceObj = new Dice();
const hasShowGUI = true;
window.create_anim = function (id_block = "canvas-container") {

	const { renderer, camera } = mWorld.createRenderer(document.getElementById(id_block));

	mWorld.createControl();
	mWorld.rotateScene = (x, y) => { mDiceObj.rotate(x, y) }
	//____________________________
	const scene = new THREE.Scene();
	// scene.background = new THREE.Color(0x414168);
	scene.background = new THREE.Color(options.global.background);
	// scene.background = null;

	scene.add(mDiceObj.groupLight)
	scene.add(mDiceObj.group);


	//____________________________
	mDiceObj.loadTexture()

	const oclscene = new THREE.Scene();
	oclscene.add(mDiceObj.groupOcl);

	//______________________________________________________________
	const renderModel = new RenderPass(scene, camera);
	const renderModelOcl = new RenderPass(oclscene, camera);

	mGoodRay.init(mWorld.canvasSize.width, mWorld.canvasSize.height)

	// const raysParam = {
	// 	rtFinal: new THREE.WebGLRenderTarget(mWorld.canvasSize.width, mWorld.canvasSize.height, mGoodRay.renderTargetParameters),
	// 	rtOcl: new THREE.WebGLRenderTarget(mWorld.canvasSize.width, mWorld.canvasSize.height, mGoodRay.renderTargetParameters),
	// };

	const effectFXAA = new ShaderPass(Shaders.ShaderExtras.fxaa);
	effectFXAA.uniforms['resolution'].value.set(1 / mWorld.canvasSize.width, 1 / mWorld.canvasSize.height);

	const hblur = new ShaderPass(Shaders.ShaderExtras["horizontalBlur"]);
	const vblur = new ShaderPass(Shaders.ShaderExtras["verticalBlur"]);
	// hblur.renderToScreen= true;
	// vblur.renderToScreen = true;

	const bluriness = 2;

	hblur.uniforms['h'].value = bluriness / mWorld.canvasSize.width * 2;
	vblur.uniforms['v'].value = bluriness / mWorld.canvasSize.height * 2;



	const grPass = new ShaderPass(Shaders.ShaderExtras.Godrays);
	options.anim.grPass = grPass
	grPass.uniforms.fExposure.value = 0.58;
	grPass.uniforms.fDecay.value = 0.98;
	grPass.uniforms.fDensity.value = 0.59;
	grPass.uniforms.fWeight.value = 0.21;
	grPass.uniforms.fClamp.value = 1.0;

	// grPass.needsSwap = true;
	// grPass.renderToScreen = true;

	const oclcomposer = new EffectComposer(renderer, mGoodRay.rtOcl);

	oclcomposer.addPass(renderModelOcl);
	oclcomposer.addPass(hblur);
	oclcomposer.addPass(vblur);

	oclcomposer.addPass(grPass);
	oclcomposer.addPass(hblur);
	oclcomposer.addPass(vblur);

	//test fCoeff 
	const additivePass = new ShaderPass(Shaders.ShaderExtras.Additive);
	additivePass.uniforms.tAdd.value = mGoodRay.rtOcl.texture;
	// additivePass.needsSwap = true;
	// additivePass.renderToScreen = true;

	const finalcomposer = new EffectComposer(renderer, mGoodRay.rtFinal);

	finalcomposer.addPass(renderModel);
	finalcomposer.addPass(effectFXAA);
	finalcomposer.addPass(additivePass);

	// finalcomposer.renderToScreen = false;
	//______________________________________________________________

	mBloomObj.initEffect(mWorld.canvasSize.width, mWorld.canvasSize.height,
		renderModel, renderer, options.bloom.strength, options.bloom.radius)

	additivePass.uniforms.tAddBloom.value = mBloomObj.texture;


	mWorld.windowResizeCb = (w, h) => {
		console.log("resize callback")
		mBloomObj.resize(w, h)
		additivePass.uniforms.tAddBloom.value = mBloomObj.texture;
	}
	//______________________________________________________________

	new ObjectLoader().load("data/light_scene.json",
		function (obj) {
			if (obj.parent) return
			mDiceObj.initLight(obj.children, options.light)
			load_two();
		}
	);


	function load_two() {
		new OBJLoader().load("data/dice.obj",
			function (obj) {

				console.log(obj)

				var mesh_dice = obj.getObjectByName("DICE_dice");
				var mesh_diceIn = obj.getObjectByName("DICE_IN_dice_in");

				mesh_diceIn.removeFromParent()
				mesh_diceIn = mesh_dice.clone()

				//____________________
				// var mesh_diceIn = obj.getObjectByName("DICE_dice");
				// var mesh_dice = obj.getObjectByName("DICE_IN_dice_in");
				//____________________

				mDiceObj.initDice(mesh_dice, options.dice, mesh_diceIn, options.diceIn)

				for (let i = 1; i <= 20; ++i) {
					let ni = (i < 10 ? '0' : '') + i
					let obj_number = obj.getObjectByName(`n${ni}`)

					mBloomObj.enable(obj_number)

					mDiceObj.addNumber(obj_number, options.anim)
				}

				mDiceObj.initGodLight()

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

	var once = true
	function draw() {
		const delta = clock.getDelta();

		let all_time = options.anim.delay + options.anim.speed
		let curr_time = H.mod(clock.elapsedTime, all_time)

		if (options.anim.enableColor) {
			let anim_pos = curr_time / all_time
			options.anim.setAnimPos(anim_pos)
		} else {
			curr_time = options.anim.position_anim * all_time
		}
		// setRadiusMainGLight(linftHalf(1.76, 2.31, curr_time / all_time), true)

		//resort number
		if (true) {
			if (curr_time <= 1) { once = true }
			if (curr_time >= all_time - 0.1 && once) {
				once = false
				H.shuffle(mDiceObj.numbers)
			}
		}


		mDiceObj.numbers.forEach((objNum, i) => {

			//sinft(0, 1, options.anim.color.h + clock.elapsedTime * options.anim.speed)
			// if (i == 6 && once) {
			const start = options.anim.delay / 20 * i
			const end = start + options.anim.speed

			// let t = curr_time <= start ? start : curr_time >= end ? end : curr_time
			// t = (t - start) / options.anim.speed

			let tp = (H.clamp(curr_time, start, end) - start) / options.anim.speed
			// console.log(start, end, t)

			let t = -Math.PI / 2 + tp * Math.PI * 2

			// if (!options.anim.enableColor) {
			// 	t = -Math.PI / 2
			// }
			const curr_h = H.sinft(options.anim.color.h, options.anim.color.h_end, t)
			const curr_s = H.sinft(options.anim.color.s, options.anim.color.s_end, t)

			objNum.obj.material.color.setHSL(
				curr_h,
				options.anim.color.l,
				curr_s,
			)

			// }
			const sub = new Vector3().subVectors(mDiceObj.center, objNum.center);
			const length = sub.length();
			const normal = sub.normalize();
			const normal_fl = normal.clone();
			// const pl = sinft(0., 1, clock.elapsedTime * 3.0) * length
			// const pl = sinft(0.8, 1, clock.elapsedTime * 3.0 + options.anim.position * i) * length;


			let t2 = H.sinft(0, 1, t)
			if (options.anim.show_all) t2 = 1
			if (!options.anim.enableTranslateNumber) t2 = 0

			const pl = length * (options.anim.position_number + (t2 * 0.1));
			const new_pos = new Vector3().copy(mDiceObj.center).add(normal.multiplyScalar(-pl));


			objNum.obj.position.copy(new_pos)


			if (!objNum.light) return


			const pl_light = length * options.anim.position_light;

			// const pl_light = length * linft(0.6, 1.42, options.anim.position_anim);

			const new_pos_light = new Vector3().copy(mDiceObj.center).add(normal_fl.multiplyScalar(-pl_light));

			objNum.light.scale.set(options.anim.radius_small_light, options.anim.radius_small_light, options.anim.radius_small_light)
			objNum.light.position.copy(new_pos_light);
			objNum.light.updateMatrixWorld();


		})

		//_________________________
		mBloomObj.bloomPass.radius = H.sinft(
			options.bloom.radius,
			options.bloom.radius_end,
			clock.elapsedTime * options.bloom.anim_speed
		)

		//_________________________


		if (options.anim.enableRotation && mDiceObj.group) {
			mDiceObj.rotateLight(delta, clock.elapsedTime)
		}

		// renderer.render(scene, camera);
		// renderer.render(oclscene, camera);


		// camera.updateMatrixWorld();
		if (enable_rays) {
			var lPos = H.projectOnScreen(mDiceObj.vlight, camera);
			grPass.uniforms["fX"].value = lPos.x;
			grPass.uniforms["fY"].value = lPos.y;

			mBloomObj.render(scene)


			oclcomposer.render();
			finalcomposer.render();
		} else {

			// renderer.render(scene, camera);
			mBloomObj.render(scene)


			finalcomposer.render();
		}


		stats.update();

		requestAnimationFrame(draw);
	}

	//########################################################

	function setRadiusMainGLight(scaleR, updategp = false) {
		options.anim.raduis_main = scaleR
		mDiceObj.initGodLight(scaleR)
		if (updategp) {
			options.anim.light_gp.updateDisplay()
		}
	}

	function setupGUIConfigs() {
		if (!hasShowGUI) {
			renderer.toneMappingExposure = Math.pow(options.bloom.exposure, 4.0)
			startDraw();
			return
		}
		//global
		if (true) {
			let global_gp = gui.addFolder("Global");
			global_gp.addColor(options.global, "background").onChange((value) => {
				scene.background = new THREE.Color(S.Set("backColor", value));
				// renderer.setClearColor(options.global.background);
			});

			renderer.toneMappingExposure = Math.pow(options.bloom.exposure, 4.0)
			global_gp.add(options.bloom, 'exposure', 0.1, 2, 0.01).onChange(function (value) {
				renderer.toneMappingExposure = Math.pow(S.Set("bloom-exposure", value), 4.0);
			});
		}
		//light
		if (true) {
			let golor_gp = gui.addFolder("Light");

			golor_gp.add(options.light, "dir", 0, 10, 0.01).onChange(function (value) {
				S.Set("dir", value)

				mDiceObj.dirLights.forEach((obj) => {
					obj.intensity = value;
				})
			});

			golor_gp.addColor(options.light, "dirColor").onChange(function (color) {
				S.Get("dirColor", color)
				mDiceObj.dirLights.forEach((obj) => {
					obj.color.set(color);
				})
			});

			golor_gp.add(options.light, "spot", 0, 20, 0.01).onChange(function (value) {
				S.Set("spot", value)

				mDiceObj.spotLights.forEach((obj) => {
					obj.intensity = value;
				})
			});

			golor_gp.addColor(options.light, "spotColor").onChange(function (color) {
				S.Set("spotColor", color)

				mDiceObj.spotLights.forEach((obj) => {
					obj.color.set(color);
				})
			});

		}
		//dice include
		if (true) {
			let dice_in_gp = gui.addFolder("dice in");

			dice_in_gp.addColor(options.diceIn, "color").onChange((value) => {
				mDiceObj.mesh_diceIn.material.color.set(S.Set("'diceIn-color", value))
			});

			dice_in_gp.add(options.diceIn, "roughness", 0, 1, 0.01).onChange((value) => {
				mDiceObj.mesh_diceIn.material.roughness = S.Set("diceIn-roughness", value)
			});
			dice_in_gp.add(options.diceIn, "metalness", 0, 1, 0.01).onChange((value) => {
				mDiceObj.mesh_diceIn.material.metalness = S.Set("diceIn-metalness", value)
			});
			dice_in_gp.add(options.diceIn, "bumpScale", 0, 3, 0.01).onChange((value) => {
				mDiceObj.mesh_diceIn.material.bumpScale = S.Set("diceIn-bumpScale", value)
			});

			dice_in_gp.add(options.diceIn, "scale", 0, 2, 0.01).onChange((value) => {
				let scale = S.Set("diceIn-scale", value)
				mDiceObj.mesh_diceIn.scale.set(scale, scale, scale)
			});
			// dice_in_gp.open();
		}
		//dice 
		if (true) {
			let dice_gp = gui.addFolder("Dice");

			dice_gp.add(options.dice, "reflectivity", 0, 1, 0.01).onChange((value) => {
				mDiceObj.mesh_dice.material.reflectivity = S.Set("dice-reflectivity", value)
			});
			dice_gp.add(options.dice, "roughness", 0, 1, 0.01).onChange((value) => {
				mDiceObj.mesh_dice.material.roughness = S.Set("dice-roughness", value)
			});
			dice_gp.add(options.dice, "transmission", 0, 1, 0.01).onChange((value) => {
				mDiceObj.mesh_dice.material.transmission = S.Set("dice-transmission", value)
			});
			dice_gp.add(options.dice, "thickness", 0, 4, 0.01).onChange((value) => {
				mDiceObj.mesh_dice.material.thickness = S.Set("dice-thickness", value)
			});



			dice_gp.add(options.dice, "typeBump", ["none", "type_1", "type_2"]).onChange((value) => {
				S.Set("dice-typeBump", value)

				switch (value) {
					case "none":
						mDiceObj.mesh_dice.material.bumpMap = null
						break;
					case "type_1":
						mDiceObj.mesh_dice.material.bumpMap = mDiceObj.dice_bump
						break;
					case "type_2":
						mDiceObj.mesh_dice.material.bumpMap = mDiceObj.dice_bump_in
						break;
				}

				mDiceObj.mesh_dice.material.needsUpdate = true;
			});
			dice_gp.add(options.dice, "bumpScale", 0, 3, 0.01).onChange((value) => {
				mDiceObj.mesh_dice.material.bumpScale = S.Set("dice-bumpScale", value)
			});

		}
		//godrays
		if (true) {
			options.anim.rays_gp = gui.addFolder("Rays");
			let rays_gp = options.anim.rays_gp

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

			folder.add(options.bloom, 'strength', 0.0, 50.0).onChange(function (value) {
				S.Set("bloom-strength", value);
				mBloomObj.setOptions(options.bloom.strength, options.bloom.radius)
			});

			folder.add(options.bloom, 'radius', 0.0, 5.0, 0.01).onChange(function (value) {
				S.Set("bloom-radius", value);
				mBloomObj.setOptions(options.bloom.strength, options.bloom.radius)
			});

			folder.add(options.bloom, 'radius_end', 0.0, 2.0, 0.01).onChange(function (value) {
				S.Set("bloom-radius_end", value);
			});
			folder.add(options.bloom, 'anim_speed', 1.0, 10.0, 0.1).onChange(function (value) {
				S.Set("bloom-anim_speed", value);
			});
			// folder.open();
		}
		//_______________
		//Anim
		if (true) {
			const anim_c_hls_gp = gui.addFolder('Anim_color_hls');

			var save_anim_json = (value) => { S.Set("anim-color", options.anim.color) }

			anim_c_hls_gp.add(options.anim.color, "h", 0, 1, 0.01).onChange(save_anim_json)
			anim_c_hls_gp.add(options.anim.color, "h_end", 0, 1, 0.01).onChange(save_anim_json)

			anim_c_hls_gp.add(options.anim.color, "l", 0, 1, 0.01).onChange(save_anim_json)
			anim_c_hls_gp.add(options.anim.color, "s", 0, 1, 0.01).onChange(save_anim_json)
			anim_c_hls_gp.add(options.anim.color, "s_end", 0, 1, 0.01).onChange(save_anim_json)
			// anim_c_hls_gp.open()

			const anim_gp = gui.addFolder('Anim');
			anim_gp.add(options.anim, "enableColor").onChange((value) => {
				S.Set("anim-enableColor", value)
			})
			anim_gp.add(options.anim, "enableRotation").onChange((value) => {
				mDiceObj.resetAngle()
				S.Set("anim-enableColor", value)
			});

			anim_gp.add(options.anim, "enableTranslateNumber").onChange((value) => {
				S.Set("anim-enableTranslateNumber", value)
			});
			anim_gp.add(options.anim, "show_all").onChange(() => {
			});

			anim_gp.add(options.anim, "position_number", -1, 1, 0.01).onChange((value) => {
				S.Set("anim-position_number", value)
			})
			anim_gp.add(options.anim, "speed", 0, 3, 0.01).onChange((value) => {
				S.Set("anim-speed", value)
			})
			anim_gp.add(options.anim, "delay", 0, 1, 0.01).onChange((value) => {
				S.Set("anim-delay", value)
			})


			options.anim.light_gp = gui.addFolder("GodLight")
			let light_gp = options.anim.light_gp
			light_gp.add(options.anim, "raduis_main", 0, 4, 0.01).onChange((value) => {
				S.Set("anim-raduis_main", value)
				setRadiusMainGLight(value)
			})

			light_gp.add(options.anim, "radius_small_light", 0, 1.5, 0.01).onChange((value) => {
				S.Set("anim-radius_small_light", value)

			})

			light_gp.add(options.anim, "position_light", 0.5, 3, 0.01).onChange((value) => {
				S.Set("anim-position_light", value)
			})


			options.anim.setAnimPos = (value) => {
				options.anim.grPass.uniforms.fExposure.value = H.linftHalf(0.63, 0.8, H.bordft(0.6, 1, value))

				setRadiusMainGLight(H.linftHalfEOC(1.66, 2.26, value))


				// options.anim.radius_small_light = H.linftHalf(0.0, 0.9, value)
				// options.anim.position_light = H.linft(0.6, 1.82, value)
				options.anim.radius_small_light = H.linftEOC(0.0, 0.93, value)
				options.anim.position_light = H.linftHalf_EIS_EIQ(0.6, 1.12, value)

				options.anim.light_gp.updateDisplay()
				options.anim.rays_gp.updateDisplay()

			}
			options.anim.setAnimPos(options.anim.position_anim)

			light_gp.add(options.anim, "position_anim", 0, 1, 0.01).onChange((value) => {
				S.Set("anim-position_anim", value)
				options.anim.setAnimPos(value)
			})

			light_gp.open()
		}

		startDraw();

	}


	function startDraw() {
		mWorld.attachWindowResizer()
		draw();
	}
};



window.onload = () => {
	window.create_anim();
}
