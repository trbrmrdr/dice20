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
import { NumberObj } from './NumberObj.js';

// import "./styles.scss"

const enable_rays = true;
const _preRelease = true
const stats = Stats()
stats.dom.style.left = '480px';
document.body.appendChild(stats.dom)
const gui = new GUI();
// const gui = null;

//_______________________________________________________________
const mBloomObj = new Bloom();
const mGoodRay = new GoodRay();

const mWorld = new World();
const mDice = new Dice();

const clock = new THREE.Clock();

window.create_anim = function (id_block = "canvas-container", start_num = options.rotating.toNum) {
	options.rotating.toNum = start_num || 1

	const { renderer, camera } = mWorld.createRenderer(document.getElementById(id_block));

	mWorld.dragMouse = (dx, dy, dz) => {
		dx /= 100
		dy /= 100
		dz /= 100
		mDice.changeRotate(dy, dx, dz)
	}
	mWorld.setUpCamera()

	//____________________________
	const scene = new THREE.Scene();
	// scene.background = new THREE.Color(0x414168);
	scene.background = new THREE.Color(options.global.background);
	// scene.background = null;

	scene.add(mDice.groupLight)
	scene.add(mDice.group);

	//____________________________
	mDice.loadTexture()

	const sceneOCL = new THREE.Scene();
	sceneOCL.add(mDice.groupOcl);

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
		// console.log("resize callback")

		mBloomObj.resize(w, h)

		mGoodRay.resize(w, h)
		mGoodRay.setBloomTexture(mBloomObj.texture)
	}
	//______________________________________________________________

	new ObjectLoader().load("data/light_scene.json",
		function (obj) {
			if (obj.parent) return
			mDice.initLight(obj.children, options.light)
			load_dice();
		}
	);


	const _fi = function (i) { return (i < 10 ? '0' : '') + i };
	var _count_numbers = -1
	var _needed_load_layers = {
		0: 20,
		1: 40,
		2: 60,
		3: 80,
		4: 100,
	};
	function load_dice() {
		new OBJLoader().load("data/dice.obj",
			function (obj) {

				// console.log(obj)

				var mesh_diceIn = obj.getObjectByName("DICE_clear");

				var sectors = []
				for (let i = 1; i <= 20; ++i) {
					let ni = _fi(i)
					let obj_n_sector = obj.getObjectByName(`DICE_IN_${ni}`)
					sectors.push(obj_n_sector)
				}
				mDice.initDice(mesh_diceIn, options.diceIn, sectors)

				var first_layer = mDice.selectLayer(options.rotating.toNum)
				load_layers(first_layer)
			},
			function (xhr) {
				// console.log((xhr.loaded / xhr.total * 100) + '% loaded');
			},
			function (error) {
				console.log('An error happened', error);
			});
	};

	var _inited = false
	function load_layers(layserI) {
		var nameI = _needed_load_layers[layserI]
		delete _needed_load_layers[layserI];

		new OBJLoader().load(`data/dice_${nameI}.obj`,
			function (obj) {
				console.log(`loaded ${nameI}`);

				var cut_dice = obj.getObjectByName(`DICE_cut_${layserI + 1}`);
				if (!cut_dice) {
					console.log("AAAAA 222");
				}
				mDice.setCutDice(layserI, options.dice, cut_dice);


				for (let i = 1; i <= 20; ++i) {
					// console.log("_____")
					// for (let li = 0; li <= 4; ++li) {
					let li = layserI
					let ti = i + (li * 20)
					if (true) {
						let ni = _fi(ti)
						// console.log(i + (li * 20))
						let obj_number = obj.getObjectByName(`n${ni}`) || obj.getObjectByName(`${ni}`)
						if (!obj_number) {
							console.log("AAAAA");
						}

						mDice.setNumbers(i - 1, layserI, obj_number)

						mBloomObj.enable(obj_number)

						_count_numbers = Math.max(_count_numbers, ni)
					}
				}

				let keys = Object.keys(_needed_load_layers);
				if (!_inited) {
					_inited = true
					mDice.initGodLight()
					setupGUIConfigs()
				}
				if (keys.length <= 0) {
					allLoadedObjectsCallback()
				} else {
					load_layers(Number.parseInt(Object.keys(_needed_load_layers)[0]))
				}

			},
			function (xhr) {
				// console.log((xhr.loaded / xhr.total * 100) + '% loaded');
			},
			function (error) {
				console.log('An error happened', error);
			});
	};


	function _in() {
		mDice.startIn(clock.elapsedTime)
	}

	function _processed() {
		mDice.processed(clock.elapsedTime)
	}

	function _out() {
		mDice.startOut(clock.elapsedTime)
	}

	function draw() {
		const delta = clock.getDelta();
		//_____________________
		let pc_anim = mDice.updateRotation(clock.elapsedTime)
		//______________________

		// let all_time = options.anim.delay + 
		let curr_time = H.mod(clock.elapsedTime, options.anim.speed)
		let anim_pos = curr_time / options.anim.speed

		if (options.anim.debugAnim) {
			mDice._stop(true)
			anim_pos = options.anim.position_anim

			// setDebugAnimPos(anim_pos)

			mDice.updateAnimInProcess(anim_pos)

			mDice.getSpiralLayer().forEach((objNum, i) => {
				objNum.setStartColor(i, anim_pos)
			})

			/* 	mDice.getLayersFrom(options.rotating.toNum).forEach((layer, iL) => {
					layer.forEach((objNum, i) => {
		
						objNum.setColorIn(anim_pos)
		
						if (iL == 0) {
							objNum.light.visible = true
							objNum.sector.visible = false
							objNum.setLightParam(options.anim.position_light, options.anim.radius_small_light)
						} else {
							objNum.light.visible = false
							objNum.sector.visible = true
						}
		
						objNum.sector.visible = false
					})
				})
	 */
		} else {

			let percent_anim_camera = mDice.update(clock.elapsedTime, updateAnimGoodRay_in, updateAnimGoodRay_out);
			mWorld.setAnimCamera(percent_anim_camera);
		}

		//________bloom anim
		mBloomObj.bloomPass.radius = H.sinft(
			options.bloom.radius,
			options.bloom.radius_end,
			clock.elapsedTime * options.bloom.anim_speed
		)
		//_________________________

		if (options.anim.rotateLight) {
			mDice.rotateLight(delta * 0.25, clock.elapsedTime)
		}

		// renderer.render(scene, camera);
		// renderer.render(sceneOCL, camera);

		camera.updateMatrixWorld();
		if (enable_rays) {
			var lPos = H.projectOnScreen(mDice.vlight, camera);
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


	function updateAnimGoodRay_out(percent) {
		mGoodRay.grPass.uniforms.fExposure.value = H.ftHalf(0.63, 0.8, H.bordft(0.6, 1, percent))
		mGoodRay.grPass.uniforms.fDensity.value = 0.9
		mGoodRay.grPass.uniforms.fWeight.value = H.ft(0.15, 0.63, H.bordft(0.4, 1, percent), H.easeOutQuad)
		mGoodRay.grPass.uniforms.fClamp.value = H.ftHalf(0, 1, percent, (x) => 1, H.easeOutSine)

		setRadiusMainGLight(H.ftHalf(0.0, 2.26, percent, H.easeOutCubic, H.easeOutCubic))
	}
	function updateAnimGoodRay_in(percent) {
		setRadiusMainGLight(0)

		mGoodRay.grPass.uniforms.fExposure.value = 0.68//H.ftHalf(0.33, 0.5, value, H.easeInOutSine)
		mGoodRay.grPass.uniforms.fDensity.value = 0.78
		mGoodRay.grPass.uniforms.fWeight.value = 0.43//H.ft(0.23, 0.46, value, H.easeInOutSine)
		mGoodRay.grPass.uniforms.fClamp.value = 0.81
	}

	function setDebugAnimPos(value) {
		mGoodRay.grPass.uniforms.fExposure.value = H.ftHalf(0.63, 0.8, H.bordft(0.6, 1, value))
		mGoodRay.grPass.uniforms.fWeight.value = H.ft(0.15, 0.63, H.bordft(0.4, 1, value), H.easeOutQuad)
		mGoodRay.grPass.uniforms.fClamp.value = H.ftHalf(0, 1, value, (x) => 1, H.easeOutSine)

		setRadiusMainGLight(H.ftHalf(0.0, 2.26, value, H.easeOutCubic, H.easeOutCubic))

		// options.anim.radius_small_light = H.ftHalf(0.0, 1.14, value, H.easeInQuint, () => 1, 0.9)
		options.anim.radius_small_light = H.ft(0.0, 1.2, value, H.easeInQuint)
		options.anim.position_light = H.ft(0.6, 0.79, value, H.easeInOutSine)


		options.anim.rays_gp?.updateDisplay()

		options.anim.position_anim = value
		options.anim.light_gp?.updateDisplay()

	}

	function setRadiusMainGLight(scaleR) {
		options.anim.raduis_main = scaleR
		mDice.initGodLight(scaleR)
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

				mDice.dirLights.forEach((obj) => {
					obj.intensity = value;
				})
			});

			golor_gp.addColor(options.light, "dirColor").onChange(function (color) {
				S.Get("dirColor", color)
				mDice.dirLights.forEach((obj) => {
					obj.color.set(color);
				})
			});

			golor_gp.add(options.light, "spot", 0, 20, 0.01).onChange(function (value) {
				S.Set("spot", value)

				mDice.spotLights.forEach((obj) => {
					obj.intensity = value;
				})
			});

			golor_gp.addColor(options.light, "spotColor").onChange(function (color) {
				S.Set("spotColor", color)

				mDice.spotLights.forEach((obj) => {
					obj.color.set(color);
				})
			});

		}
		//dice include
		if (true) {
			let dice_in_gp = gui.addFolder("dice in");

			dice_in_gp.addColor(options.diceIn, "color").onChange((value) => {
				mDice.mesh_diceIn.material.color.set(S.Set("'diceIn-color", value))
			});

			dice_in_gp.add(options.diceIn, "roughness", 0, 1, 0.01).onChange((value) => {
				mDice.mesh_diceIn.material.roughness = S.Set("diceIn-roughness", value)
			});
			dice_in_gp.add(options.diceIn, "metalness", 0, 1, 0.01).onChange((value) => {
				mDice.mesh_diceIn.material.metalness = S.Set("diceIn-metalness", value)
			});
			dice_in_gp.add(options.diceIn, "bumpScale", 0, 3, 0.01).onChange((value) => {
				mDice.mesh_diceIn.material.bumpScale = S.Set("diceIn-bumpScale", value)
			});

			dice_in_gp.add(options.diceIn, "scale", 0, 2, 0.01).onChange((value) => {
				let scale = S.Set("diceIn-scale", value)
				mDice.mesh_diceIn.scale.set(scale, scale, scale)
			});
			// dice_in_gp.open();
		}
		//dice 
		if (true) {
			let dice_gp = gui.addFolder("Dice");

			dice_gp.add(options.dice, "reflectivity", 0, 1, 0.01).onChange((value) => {
				mDice.dice_Material.reflectivity = S.Set("dice-reflectivity", value)
			});
			dice_gp.add(options.dice, "roughness", 0, 1, 0.01).onChange((value) => {
				mDice.dice_Material.roughness = S.Set("dice-roughness", value)
			});
			dice_gp.add(options.dice, "transmission", 0, 1, 0.01).onChange((value) => {
				mDice.dice_Material.transmission = S.Set("dice-transmission", value)
			});
			dice_gp.add(options.dice, "thickness", 0, 4, 0.01).onChange((value) => {
				mDice.dice_Material.thickness = S.Set("dice-thickness", value)
			});



			dice_gp.add(options.dice, "typeBump", ["none", "type_1", "type_2"]).onChange((value) => {
				S.Set("dice-typeBump", value)

				switch (value) {
					case "none":
						mDice.dice_Material.bumpMap = null
						break;
					case "type_1":
						mDice.dice_Material.bumpMap = mDice.dice_bump
						break;
					case "type_2":
						mDice.dice_Material.bumpMap = mDice.dice_bump_in
						break;
				}

				mDice.dice_Material.needsUpdate = true;
			});
			dice_gp.add(options.dice, "bumpScale", 0, 3, 0.01).onChange((value) => {
				mDice.dice_Material.bumpScale = S.Set("dice-bumpScale", value)
			});

		}
		//godrays
		if (!_preRelease && true) {
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
		//Anim color HLS 
		if (!_preRelease && true) {
			const anim_c_hls_gp = gui.addFolder('Anim_color_hls');

			anim_c_hls_gp.add(options.anim.color, "h", 0, 1, 0.01).onChange((value) => {
				S.Set("anim-color-h", value)
			})
			anim_c_hls_gp.add(options.anim.color, "h2", 0, 1, 0.01).onChange((value) => {
				S.Set("anim-color-h2", value)
			})
			anim_c_hls_gp.add(options.anim.color, "h_end", 0, 1, 0.01).onChange((value) => {
				S.Set("anim-color-h_end", value)
			})

			anim_c_hls_gp.add(options.anim.color, "l", 0, 1, 0.01).onChange((value) => {
				S.Set("anim-color-l", value)
			})
			anim_c_hls_gp.add(options.anim.color, "s", 0, 1, 0.01).onChange((value) => {
				S.Set("anim-color-s", value)
			})
			anim_c_hls_gp.add(options.anim.color, "s2", 0, 1, 0.01).onChange((value) => {
				S.Set("anim-color-s2", value)
			})
			anim_c_hls_gp.add(options.anim.color, "s_end", 0, 1, 0.01).onChange((value) => {
				S.Set("anim-color-s_end", value)
			})
			// anim_c_hls_gp.open()
		}
		//Anim
		if (true) {
			options.anim.gp = gui.addFolder('Anim');
			const anim_gp = options.anim.gp
			anim_gp.add(options.anim, "debugAnim").onChange((value) => {
				S.Set("anim-enableColor", value)
				mDice.resetColor()
				mWorld.setUpCamera()
			})

			// anim_gp.add(options.anim, "rotateLight").onChange((value) => {
			// 	S.Set("anim-rotateLight", value)
			// });


			// anim_gp.add(options.anim, "position_number", -1, 1, 0.001).onChange((value) => {
			// 	S.Set("anim-position_number", value)
			// })
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

			setDebugAnimPos(options.anim.position_anim)

			light_gp.add(options.anim, "position_anim", 0, 1, 0.01).onChange((value) => {
				S.Set("anim-position_anim", value)
				setDebugAnimPos(value)
			})

			if (!_preRelease) {
				light_gp.open()
			}
		}
		//_________________
		//position
		if (true) {
			const position_gp = gui.addFolder("Position number + anim")
			options.position.gp = position_gp


			const changePos = () => mWorld.changePosCamera()

			position_gp.add(options.position, "typePos", ["Rotate", "Present"]).onChange((value) => {
				options.anim.debugAnim = true
				options.anim.gp.updateDisplay()
				options.anim.gp.open()

				mWorld._hasRotate = value == "Rotate"

				mWorld.setUpCamera()
			})

			_addGuiPoint(position_gp.addFolder("posRotate"), options.position.posRotate, changePos)
			_addGuiPoint(position_gp.addFolder("posTRotate"), options.position.posTRotate, changePos)
			_addGuiPoint(position_gp.addFolder("posPresent"), options.position.posPresent, changePos)
			_addGuiPoint(position_gp.addFolder("posTPresent"), options.position.posTPresent, changePos)



			options.position.sel_num = options.rotating.toNum
			position_gp.add(options.position, "sel_num", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]).onChange((value) => {
				mDice._sel_num = Number(value)
				mDice.update_number(true, true)
			});

			position_gp.add(options.position, "anim_number").onChange((value) => {
				mDice._stop(true)
				mDice.update_number(true)
			})
			position_gp.add(options.position, "anim_percent", 0, 1, 0.01).onChange((value) => {

				if (options.position.anim_number && mDice.to_angle) {
					// let percent = (clock.elapsedTime - start_time_rot) / options.position.dur
					let percent = options.position.anim_percent

					mDice.animRotate(percent)
				}
			})

			/* 	position_gp.add(options.position, "dur_c", 0, 5, 0.01).onChange((value) => {
					S.Get("tmp-dur_c", value)
				})
		
				position_gp.add(options.position, "dur", 0, 5, 0.01).onChange((value) => {
					S.Get("tmp-dur", value)
				}) */

			/* 
						position_gp.add(options.position, "tmp", 0, 1, 0.01).onChange((value) => {
							mWorld.setAnimCamera(value)
						}) */

			// position_gp.add(options.position, "tmp_grad", -360, 360, 0.01)

			if (_preRelease) {
				mDice.start()
			} else {
				const dAngle_gp = mDice.start(position_gp.addFolder("d angle"))
				// dAngle_gp.open()
				position_gp.open()
			}


		}

		// lastGuiAfterLoadedAllNumber()


		gui.add(options, "drawData")
		startDraw();

	}

	// function lastGuiAfterLoadedAllNumber() {
	function allLoadedObjectsCallback() {
		if (!gui) return;
		const _gp = gui.addFolder("Rotating")
		options.rotating.gp = _gp


		options.rotating.in = _in
		options.rotating.processed = _processed
		options.rotating.out = _out

		var foo = [...Array(_count_numbers + 1).keys()];
		foo.splice(0, 1);
		_gp.add(options.rotating, "toNum", foo).onChange((value) => {
			S.Set("rotating-toNum", value)
			options.rotating.toNum = Number(value)

			options.position.sel_num = options.rotating.toNum
			options.position.gp?.updateDisplay()

		});

		_gp.add(options.rotating, "in")
		_gp.add(options.rotating, "processed")
		_gp.add(options.rotating, "out")

		_gp.add(options.rotating, "durationIn", 0, 10, 0.01).onChange((value) => {
			S.Set("rotating-durationIn", value)
		})
		_gp.add(options.rotating, "durationPrc", 0, 10, 0.01).onChange((value) => {
			S.Set("rotating-durationPrc", value)
		})
		_gp.add(options.rotating, "durationOut", 0, 20, 0.01).onChange((value) => {
			S.Set("rotating-durationOut", value)
		})
		_gp.open()
	}


	function startDraw() {
		if (!gui) {
			mDice.start()
		}
		_out()
		mWorld.attachWindowResizer()
		draw();
	}
};

function _addGuiPoint(group, object, callback = (value) => { }) {
	group.add(object, "x", -5, 5, 0.01).onChange(callback)
	group.add(object, "y", -5, 5, 0.01).onChange(callback)
	group.add(object, "z", -5, 5, 0.01).onChange(callback)
}


window.onload = () => {
	window.create_anim();
}
