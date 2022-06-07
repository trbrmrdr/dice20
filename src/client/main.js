// 
// import * as THREE from 'three';
import * as THREE from './libs/three.js/build/three.module.js';

import { GUI } from 'dat.gui';
import Stats from 'three/examples/jsm/libs/stats.module'


import { AmbientLight, EventDispatcher, Light, Material, MeshStandardMaterial, ObjectLoader, Texture, Vector3 } from './libs/three.js/build/three.module.js';

import { OBJLoader } from './libs/three.js/examples/jsm/loaders/OBJLoader.js';

import { RenderPass } from './libs/three.js/examples/jsm/postprocessing/RenderPass.js';

import * as H from './helper.js'
import * as S from './saves.js'

import { options } from './options.js'
import { Bloom } from './Bloom.js'
import { GoodRay } from './GoodRay.js'
import { World } from './World.js'
import { Dice } from './Dice.js'

// import "./styles.scss"

const enable_rays = true;

const stats = Stats()
stats.dom.style.left = '480px';
document.body.appendChild(stats.dom)
const gui = new GUI();
// const gui = null;

//_______________________________________________________________
const CANVAS_SIZE = {
	width: 1024,
	height: 1024,
}


const mBloomObj = new Bloom();
const mGoodRay = new GoodRay();

const mWorld = new World(CANVAS_SIZE);
const mDiceObj = new Dice();

const clock = new THREE.Clock();

const _rotate_pos = (save = false, dx = null, dy = null, dz = null) => {

	if (dx != null || dy != null) {

		if (_subF) {
			options.position.dAngle.x += dx
			options.position.dAngle.y += dy
			options.position.dAngle.z += dz
			_update_number()
			return
		} else {
			options.position.angle.x += dx
			options.position.angle.y += dy
			options.position.angle.z += dz
		}
	}

	mDiceObj.rotate(
		options.position.angle.x,
		options.position.angle.y,
		options.position.angle.z)
	options.position.gp?.updateDisplay()
	if (save) {
		S.Set("position-angle", options.position.angle)
	}
}

const _camera_pos = (save = false) => {
	mWorld.setPosCamera(options.position);
	options.position.gp?.updateDisplay()
	if (save) {
		S.Set("px", options.position.px)
		S.Set("py", options.position.py)
		S.Set("py", options.position.pz)
	}
}

var _subF = null
var _dAngle_gp //not null
var _sel_num = 0

const _createDAngleF = () => {
	if (_subF) {
		_dAngle_gp.removeFolder(_subF)
		_subF = null
	}
	if (_sel_num <= 1) return

	_subF = _dAngle_gp.addFolder("angle")

	_subF.add(options.position.dAngle, "x", -Math.PI, Math.PI, 0.01).onChange((value) => {
		_update_number()
	})
	_subF.add(options.position.dAngle, "y", -Math.PI, Math.PI, 0.01).onChange((value) => {
		_update_number()
	})
	_subF.add(options.position.dAngle, "z", -Math.PI, Math.PI, 0.01).onChange((value) => {
		_update_number()
	})

	_subF.open()
}


var _from_ange, _to_angle
const _update_number = (read = false) => {
	if (_sel_num <= 1) {
		_createDAngleF()
		_rotate_pos();
		return
	}

	let dAngle = options.position.dAngle
	let name = `pos-dn_${_sel_num}`
	if (read) {
		dAngle = S.Get(name, new Vector3())
		options.position.dAngle = dAngle
		_createDAngleF()
		if (options.position.anim_number) {
			_to_angle = new THREE.Euler(dAngle.x, dAngle.y, dAngle.z)
			_from_ange = mDiceObj.oldEuler
			return
		}
	} else {
		dAngle = S.Set(name, dAngle)
	}

	mDiceObj.rotate(
		dAngle.x,
		dAngle.y,
		dAngle.z)
	_subF?.updateDisplay()
}

window.create_anim = function (id_block = "canvas-container") {

	const { renderer, camera } = mWorld.createRenderer(document.getElementById(id_block));

	mWorld.dragMouse = (dx, dy, dz) => {

		dx /= 100
		dy /= 100
		dz /= 100

		_rotate_pos(true, -dy, dx, dz)
	}
	_rotate_pos();

	mWorld.controllChange = (camera) => {
		options.position.px = S.Set('px', camera.position.x);
		options.position.py = S.Set('py', camera.position.y);
		options.position.pz = S.Set('pz', camera.position.z);
		_camera_pos(true)
	}
	_camera_pos()

	//____________________________
	const scene = new THREE.Scene();
	// scene.background = new THREE.Color(0x414168);
	scene.background = new THREE.Color(options.global.background);
	// scene.background = null;

	scene.add(mDiceObj.groupLight)
	scene.add(mDiceObj.group);

	//____________________________
	mDiceObj.loadTexture()

	const sceneOCL = new THREE.Scene();
	sceneOCL.add(mDiceObj.groupOcl);

	//______________________________________________________________
	const renderModel = new RenderPass(scene, camera);
	const renderModelOcl = new RenderPass(sceneOCL, camera);

	mBloomObj.initEffect(mWorld.canvasSize.width, mWorld.canvasSize.height,
		renderModel, renderer, options.bloom.strength, options.bloom.radius)

	mGoodRay.init(
		mWorld.canvasSize.width, mWorld.canvasSize.height,
		renderer, renderModel, renderModelOcl)

	mGoodRay.setBloomTexture(mBloomObj.texture)


	mWorld.windowResizeCb = (w, h) => {
		console.log("resize callback")

		mBloomObj.resize(w, h)

		mGoodRay.resize(w, h)
		mGoodRay.setBloomTexture(mBloomObj.texture)
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

				var mesh_diceIn = obj.getObjectByName("DICE_clear");
				var mesh_dice = obj.getObjectByName("DICE_cut");

				// mesh_diceIn.removeFromParent()
				// mesh_diceIn = mesh_dice.clone()

				//____________________
				// var mesh_diceIn = obj.getObjectByName("DICE_dice");
				// var mesh_dice = obj.getObjectByName("DICE_IN_dice_in");
				//____________________

				mDiceObj.initDice(mesh_dice, options.dice, mesh_diceIn, options.diceIn)

				for (let i = 1; i <= 20; ++i) {
					let ni = (i < 10 ? '0' : '') + i

					let obj_number = obj.getObjectByName(`n${ni}`)
					let obj_n_sector = obj.getObjectByName(`DICE_IN_${ni}`)
					mBloomObj.enable(obj_number)

					mDiceObj.addNumber(obj_number, options.anim, obj_n_sector)
				}

				mDiceObj.initGodLight()

				setupGUIConfigs()
			},
			function (xhr) {
				// console.log((xhr.loaded / xhr.total * 100) + '% loaded');
			},
			function (error) {
				console.log('An error happened', error);
			});
	};

	var once = true
	var start_time_rot = -1;
	var end_time_rot = -1;
	function draw() {
		const delta = clock.getDelta();
		//_____________________
		if (start_time_rot == -1 && _from_ange != null) {
			start_time_rot = clock.elapsedTime
			end_time_rot = start_time_rot + options.position.dur
		}

		if (clock.elapsedTime <= end_time_rot) {
			let percent = (clock.elapsedTime - start_time_rot) / options.position.dur

			let euler = new THREE.Euler(
				_to_angle.x - _from_ange.x,
				_to_angle.y - _from_ange.y,
				_to_angle.z - _from_ange.z)


			mDiceObj.rotate(
				_to_angle.x - euler.x * (percent * options.position.dur_c),
				_to_angle.y - euler.y * (percent * options.position.dur_c),
				_to_angle.z - euler.z * (percent * options.position.dur_c),
			)
		} else {
			start_time_rot = -1
			_from_ange = null
			_to_angle = null
		}
		//______________________

		let all_time = options.anim.delay + options.anim.speed
		let curr_time = H.mod(clock.elapsedTime, all_time)
		let anim_pos = curr_time / all_time

		if (options.anim.enableColor) {
			setAnimPos(anim_pos)
		} else {
			curr_time = options.anim.position_anim * all_time
		}
		// setRadiusMainGLight(linftHalf(1.76, 2.31, curr_time / all_time), true)

		//resort number
		// if (true) {
		// 	if (curr_time <= 1) { once = true }
		// 	if (curr_time >= all_time - 0.1 && once) {
		// 		once = false
		// 		H.shuffle(mDiceObj.numbers)
		// 	}
		// }


		mDiceObj.numbers.forEach((objNum, i) => {
			const start = options.anim.delay / 20 * i
			const end = start + options.anim.speed
			let tp = (H.clamp(curr_time, start, end) - start) / options.anim.speed
			// let t = -Math.PI / 2 + tp * Math.PI * 2



			mDiceObj.setColorNumber(objNum, tp)
			const curr_h = H.ftH_easeInOutSine(options.anim.color.h, options.anim.color.h_end, tp)
			const curr_s = H.ftH_easeInOutSine(options.anim.color.s, options.anim.color.s_end, tp)
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


			// let t2 = H.sinft(0, 1, t)
			let t2 = H.ftH_easeInOutSine(0, 1, tp)
			if (options.anim.show_all) t2 = 1
			if (!options.anim.enableTranslateNumber) t2 = 0

			const pl = length * (options.anim.position_number + (t2 * 0.1));
			const new_pos = new Vector3().copy(mDiceObj.center).add(normal.multiplyScalar(-pl));

			objNum.obj.position.copy(new_pos)

			objNum.sector.visible = i != 0


			if (i != 0) return
			const pl_light = length * options.anim.position_light;

			// const pl_light = length * linft(0.6, 1.42, options.anim.position_anim);

			const new_pos_light = new Vector3().copy(mDiceObj.center).add(normal_fl.multiplyScalar(-pl_light));

			objNum.light.scale.set(options.anim.radius_small_light, options.anim.radius_small_light, options.anim.radius_small_light)
			objNum.light.position.copy(new_pos_light);
			objNum.light.updateMatrixWorld();


		})

		//__________infinity 
		// //TODO remove
		// let scale = H.sinft(
		// 	options.diceIn.scale - 0.01,
		// 	options.diceIn.scale + 0.01,
		// 	clock.elapsedTime * (options.bloom.anim_speed*0.15 - H.sinft(-0.15, 0.15, clock.elapsedTime)))
		// mDiceObj.mesh_diceIn.scale.set(scale, scale, scale)
		//________bloom anim
		mBloomObj.bloomPass.radius = H.sinft(
			options.bloom.radius,
			options.bloom.radius_end,
			clock.elapsedTime * options.bloom.anim_speed
		)
		//_________________________


		if (options.anim.enableRotation && mDiceObj.group) {
			mDiceObj.rotateLight(delta * 0.25, clock.elapsedTime)
		}

		// renderer.render(scene, camera);
		// renderer.render(sceneOCL, camera);


		camera.updateMatrixWorld();
		if (enable_rays) {
			var lPos = H.projectOnScreen(mDiceObj.vlight, camera);
			mGoodRay.grPass.uniforms["fX"].value = lPos.x;
			mGoodRay.grPass.uniforms["fY"].value = lPos.y;

			mBloomObj.render(scene)
			mGoodRay.render(true)
		} else {

			// renderer.render(scene, camera);
			mBloomObj.render(scene)
			mGoodRay.render(false)
		}


		stats.update();

		requestAnimationFrame(draw);
	}

	//########################################################


	function setAnimPos(value) {
		mGoodRay.grPass.uniforms.fExposure.value = H.ftHalf(0.63, 0.8, H.bordft(0.6, 1, value))
		mGoodRay.grPass.uniforms.fClamp.value = H.ftHalf(0, 1, value, (x) => 1, H.easeInOutSine)
		setRadiusMainGLight(H.ftH_easeOutCubic(0.5, 2.26, value))

		options.anim.radius_small_light = H.ftHalf(0.0, 1.5, value, H.easeInQuint, H.easeInQuart)
		options.anim.position_light = H.ft_easeInOutSine(0.6, 1.82, value)
		// options.anim.radius_small_light = H.linftEOC(0.0, 0.93, value)
		// options.anim.position_light = H.linftHalf_EIS_EIQ(0.6, 1.12, value)

		options.anim.rays_gp.updateDisplay()


		options.anim.position_anim = value
		options.anim.light_gp.updateDisplay()

	}

	function setRadiusMainGLight(scaleR) {
		options.anim.raduis_main = scaleR
		mDiceObj.initGodLight(scaleR)
	}

	function setupGUIConfigs() {
		if (!gui) {
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

			rays_gp.add(mGoodRay.grPass.uniforms.fExposure, 'value', 0, 1, 0.01).name("Exposure");
			rays_gp.add(mGoodRay.grPass.uniforms.fDecay, 'value', 0, 1, 0.01).name("Decay");
			rays_gp.add(mGoodRay.grPass.uniforms.fDensity, 'value', 0, 1, 0.01).name("Density");
			rays_gp.add(mGoodRay.grPass.uniforms.fWeight, 'value', 0, 1, 0.01).name("Weight");
			rays_gp.add(mGoodRay.grPass.uniforms.fClamp, 'value', 0, 1, 0.01).name("Clamp")

			// rays_gp.open();

		}
		//_______________
		//bloom
		if (true) {
			const folder = gui.addFolder('Bloom Parameters');

			folder.add(options.bloom, 'strength', 0.0, 50.0).onChange(function (value) {
				S.Set("bloom-strength", value);
				mBloomObj.updateOptions()
			});

			folder.add(options.bloom, 'radius', 0.0, 5.0, 0.01).onChange(function (value) {
				S.Set("bloom-radius", value);
				mBloomObj.updateOptions()
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

			anim_gp.add(options.anim, "position_number", -1, 1, 0.001).onChange((value) => {
				S.Set("anim-position_number", value)
			})
			anim_gp.add(options.anim, "speed", 0, 3, 0.01).onChange((value) => {
				S.Set("anim-speed", value)
			})
			anim_gp.add(options.anim, "delay", 0, 1, 0.01).onChange((value) => {
				S.Set("anim-delay", value)
			})

			options.anim.light_gp = gui.addFolder("GodLight")
			const light_gp = options.anim.light_gp

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

			setAnimPos(options.anim.position_anim)

			light_gp.add(options.anim, "position_anim", 0, 1, 0.01).onChange((value) => {
				S.Set("anim-position_anim", value)
				setAnimPos(value)
			})

			light_gp.open()
		}
		//_________________
		//position
		if (true) {
			const position_gp = gui.addFolder("Position")
			options.position.gp = position_gp

			position_gp.add(options.position.angle, "x", -Math.PI, Math.PI, 0.01).onChange((value) => {
				_rotate_pos(true)
			})
			position_gp.add(options.position.angle, "y", -Math.PI, Math.PI, 0.01).onChange((value) => {
				_rotate_pos(true)
			})
			position_gp.add(options.position.angle, "z", -Math.PI, Math.PI, 0.01).onChange((value) => {
				_rotate_pos(true)
			})

			position_gp.add(options.position, "px", -5, 5, 0.01).onChange((value) => {
				_camera_pos(true)
			})
			position_gp.add(options.position, "py", -5, 5, 0.01).onChange((value) => {
				_camera_pos(true)
			})
			position_gp.add(options.position, "pz", -5, 5, 0.01).onChange((value) => {
				_camera_pos(true)
			})


			_dAngle_gp = gui.addFolder("d angle")
			_dAngle_gp.open()


			options.position.set_number = () => { }

			position_gp.add(options.position, "sel_num", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]).onChange((value) => {
				_sel_num = Number(value)
				_update_number(true)
			});

			position_gp.add(options.position, "anim_number").onChange((value) => {
				_update_number(true)
			})


			position_gp.add(options.position, "dur_c", 0, 5, 0.01).onChange((value) => {
				S.Get("tmp-dur_c", value)
			})

			position_gp.add(options.position, "dur", 0, 5, 0.01).onChange((value) => {
				S.Get("tmp-dur", value)
			})


			position_gp.open()
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
