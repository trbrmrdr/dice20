import { Vector2, Vector3 } from './libs/three.js/build/three.module.js';
import * as S from './saves.js'
import Cookies from 'js-cookie'

var options = {
	global: {
		background: S.Get("backColor", 0x20000),
	},
	diceIn: {
		color: S.Get("diceIn-color", 0x1243d9),
		roughness: S.Get("diceIn-roughness", 0.27),
		metalness: S.Get("diceIn-metalness", 0.84),
		bumpScale: S.Get("diceIn-bumpScale", 0.71),
		scale: S.Get("diceIn-scale", 0.95)
	},
	dice: {
		// reflectivity: S.Get("dice-reflectivity", 0.15),
		reflectivity: S.Get("dice-reflectivity", 0.26),
		// roughness: S.Get("dice-roughness", 0.93),
		roughness: S.Get("dice-roughness", 0.73),
		transmission: S.Get("dice-transmission", 0.96),
		// thickness: S.Get("dice-thickness", 0.15),
		thickness: S.Get("dice-thickness", 0.11),

		// typeBump: S.Get("dice-typeBump", "type_1"),
		typeBump: S.Get("dice-typeBump", "type_2"),
		bumpScale: S.Get("dice-bumpScale", 0.01),
	},
	light: {
		// dir: S.Get("dir", 0.49),
		dir: S.Get("dir", 0.84),
		dirColor: S.Get("dirColor", 0xE4E186),
		// spot: S.Get("spot", 0.75),
		spot: S.Get("spot", 3.02),
		spotColor: S.Get("spotColor", 0xE2DBAB),
	},

	bloom: {
		// exposure: S.Get("bloom-exposure", 1),
		exposure: S.Get("bloom-exposure", 0.99),

		// strength: S.Get("bloom-strength", 6.3),
		strength: S.Get("bloom-strength", 4.6),

		// radius: S.Get("bloom-radius", 0.40),
		radius: S.Get("bloom-radius", 0.52),
		radius_end: S.Get("bloom-radius_end", 0.60),
		// anim_speed: S.Get("bloom-anim_speed", 3.8)
		anim_speed: S.Get("bloom-anim_speed", 1.6)
	},

	anim: {
		color: {
			h: S.Get("anim-color-h", 0.69),
			h2: S.Get("anim-color-h2", 0.19),
			h_end: S.Get("anim-color-h_end", 0.19),

			l: S.Get("anim-color-l", 0.69),

			s: S.Get("anim-color-s", 0.04),
			s2: S.Get("anim-color-s2", 0.19),
			s_end: S.Get("anim-color-s_end", 0.62),
		},

		debugAnim: S.Get("anim-enableColor", true),
		translateNumber: S.Get("anim-translateNumber", true),
		rotateLight: S.Get("anim-rotateLight", true),
		position_number: S.Get("anim-position_number", -0.09),

		speed: S.Get("anim-speed", 2.74),
		delay: S.Get("anim-delay", 0.27),


		setAnimPos: null,

		rays_gp: null,//rays group gui
		light_gp: null,//godlight group gui
		raduis_main: S.Get("anim-raduis_main", 1.5),

		radius_small_light: S.Get("anim-radius_small_light", 1.0),
		position_light: S.Get("anim-position_light", 1),


		position_anim: S.Get("anim-position_anim", 1),
	},

	position: {
		gp: null,

		typePos: "Present",

		posRotate: S.Get('pos_rot', new Vector3(-0.027, 1.723, 1.927)),
		posTRotate: S.Get('pos_t_rot', new Vector3(0, 0, 0)),

		posPresent: S.Get('pos_p_rot', new Vector3(-0.027, 1.723, 1.927)),
		posTPresent: S.Get('pos_t_p_rot', new Vector3(0, 0, 0)),

		sel_num: 1,

		anim_number: false,
		anim_percent: 0.5,
		dur_c: S.Get("tmp-dur_c", 3.0),
		dur: S.Get("tmp-dur", 3.0),

		dAngle: S.Get("pos-dn_1", new Vector3(-1.09, 3.84, -2.15)),
		tmp: 0
	},

	rotating: {
		gp: null,
		toNum: S.Get("rotating-toNum", 20),

		in: () => { },
		durationIn: S.Get("rotating-durationIn", 1),

		processed: () => { },
		durationPrc: S.Get("rotating-durationPrc", 2.5),

		out: () => { },
		durationOut: S.Get("rotating-durationOut", 2),
	},

	diceLayers: {
		1: [
			[2, 5, 14],
			[3, 4, 6, 15, 13, 12],
			[7, 8, 10, 11, 18, 19],
			[9, 17, 20],
			[16]
		],
		2: [
			[1, 3, 12],
			[4, 5, 10, 11, 13, 14],
			[6, 8, 9, 15, 17, 18],
			[19, 16, 7],
			[20]
		],
		3: [
			[10, 4, 2],
			[1, 5, 8, 9, 11, 12],
			[6, 7, 13, 14, 16, 17],
			[18, 15, 20,],
			[19]
		],
		4: [
			[3, 5, 8],
			[1, 2, 6, 7, 9, 10],
			[11, 12, 14, 15, 16, 20],
			[19, 17, 13],
			[18]
		],
		5: [
			[1, 4, 6],
			[2, 3, 7, 8, 14, 15],
			[9, 10, 12, 13, 19, 20],
			[18, 16, 11],
			[17]
		],
		6: [
			[7, 15, 5],
			[1, 4, 8, 14, 19, 20],
			[2, 3, 9, 13, 16, 18],
			[10, 12, 17],
			[11]
		],
		7: [
			[6, 8, 20],
			[4, 5, 9, 15, 16, 19],
			[1, 3, 10, 14, 17, 18],
			[2, 11, 13],
			[12]
		],
		8: [
			[4, 7, 9],
			[3, 5, 6, 10, 16, 20],
			[1, 2, 11, 15, 17, 19],
			[12, 14, 18],
			[13]
		],
		9: [
			[8, 10, 16],
			[3, 4, 7, 11, 17, 20],
			[2, 5, 6, 12, 18, 19],
			[1, 13, 15],
			[14]
		],
		10: [
			[3, 9, 11],
			[2, 4, 8, 12, 16, 17],
			[1, 5, 7, 13, 18, 20],
			[6, 14, 19],
			[15]
		]
	}
};

/* let retStr = "["
for (let i = 0; i < 20; ++i) {
	retStr += JSON.stringify(S.Get(`pos-dn_${i}`, new Vector3()))
	if (i != 19) retStr += ","
	retStr += "\n"
}
retStr += "]"
console.log(retStr) */


if (!Cookies.get('pos-dn_0')) {
	console.log("-----resaved")
	let points = [
		{ "x": 0, "y": 0, "z": 0 },
		{ "x": -0.3642968750000055, "y": 1.6049609375000031, "z": -2.0162890624999945 },
		{ "x": -1.8223828124999997, "y": 2.733398437500015, "z": -0.9463671874999957 },
		{ "x": -0.6484375000000013, "y": 2.714726562500025, "z": -1.0202343749999974 },
		{ "x": 0.6696484375000047, "y": 2.9372265625000176, "z": -1.0955859374999992 },
		{ "x": -1.6669140624999927, "y": 7.605039062500007, "z": 0.6621874999999998 },
		{ "x": -1.2581249999999946, "y": 1.2494921875000067, "z": 1.4214453125000015 },
		{ "x": 1.840859375000001, "y": 1.0911718749999992, "z": -1.9079687500000004 },
		{ "x": 1.4133593750000006, "y": 6.679960937500032, "z": -2.2320703125000008 },
		{ "x": -1.2505859374999964, "y": 3.287109375000017, "z": 0.9208984374999999 },
		{ "x": -1.1276953124999893, "y": 9.77835937499987, "z": -0.3068359375000002 },
		{ "x": -1.4159374999999959, "y": 3.701132812500009, "z": 4.629374999999998 },
		{ "x": -3.965234374999969, "y": 12.959218749999913, "z": 0.8712109374999999 },
		{ "x": -1.9178515624999957, "y": -0.15804687500000084, "z": -0.3940625000000002 },
		{ "x": 0.13699218749999945, "y": 0.5635937499999997, "z": 1.3491015625000016 },
		{ "x": -0.6754296875000017, "y": 1.3453906250000023, "z": 2.130117187500002 },
		{ "x": 0.5933203125000006, "y": 3.9926171874999996, "z": 0.6010546874999992 },
		{ "x": -0.3684765625000007, "y": 4.752382812499998, "z": 0 },
		{ "x": 0.3743359374999983, "y": -0.38554687500000323, "z": 0.3224609374999995 },
		{ "x": 0.891367187500003, "y": 0.6239062500000008, "z": -0.21003906250000026 }
	]

	points.forEach((el, i) => {
		S.Set(`pos-dn_${i}`, el)
	})
}
export { options }