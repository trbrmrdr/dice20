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
		transmission: S.Get("dice-transmission", 1.0),
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
		exposure: S.Get("bloom-exposure", 1.05),

		// strength: S.Get("bloom-strength", 6.3),
		strength: S.Get("bloom-strength", 4.2),

		// radius: S.Get("bloom-radius", 0.40),
		radius: S.Get("bloom-radius", 0.52),
		radius_end: S.Get("bloom-radius_end", 1.31),
		// anim_speed: S.Get("bloom-anim_speed", 3.8)
		anim_speed: S.Get("bloom-anim_speed", 4)
	},

	anim: {
		gp: null,
		color: {
			h: S.Get("anim-color-h", 0.7),
			h2: S.Get("anim-color-h2", 0.92),
			h_end: S.Get("anim-color-h_end", 0.18),

			l: S.Get("anim-color-l", 0.68),

			s: S.Get("anim-color-s", 0.04),
			s2: S.Get("anim-color-s2", 0.25),
			s_end: S.Get("anim-color-s_end", 0.62),
		},

		debugAnim: S.Get("anim-enableColor", false),
		translateNumber: S.Get("anim-translateNumber", true),
		rotateLight: S.Get("anim-rotateLight", true),
		position_number: S.Get("anim-position_number", -0.09),

		speed: S.Get("anim-speed", 1.57),
		delay: S.Get("anim-delay", 0.21),


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



		posRotate: S.Get('pos_rot', new Vector3(0.034, 1.950, 1.950)),
		posTRotate: S.Get('pos_t_rot', new Vector3(0.060, 0.012, 0.012)),

		posPresent: S.Get('pos_p_rot', new Vector3(-0.124, 1.591, 1.251)),
		posTPresent: S.Get('pos_t_p_rot', new Vector3(-0.107, 0.305, -0.035)),

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
		durationIn: S.Get("rotating-durationIn", 2.5),

		processed: () => { },
		durationPrc: S.Get("rotating-durationPrc", 2.5),

		out: () => { },
		durationOut: S.Get("rotating-durationOut", 4),
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
	},


	drawData: () => {
		console.log("________")
		let retStr = "["
		for (let i = 0; i <= 20; ++i) {
			retStr += JSON.stringify(S.Get(`pos-dn_${i}`, new Vector3()))
			if (i != 20) retStr += ","
			retStr += "\n"
		}
		retStr += "]"
		console.log(retStr)
		console.log("________")
		console.log(logVector("pos_rot"))
		console.log(logVector("pos_t_rot"))
		console.log(logVector("pos_p_rot"))
		console.log(logVector("pos_t_p_rot"))
	}
};

function logVector(key) {
	let t = S.Get(key)
	return `S.Get('${key}',  new Vector3(${t.x.toFixed(3)}, ${t.y.toFixed(3)}, ${t.z.toFixed(3)}))`
}

if (!Cookies.get('pos-dn_0')) {
	console.log("-----resaved")
	let points = [{ "x": 0, "y": 0, "z": 0 },
	{ "x": -3.5835937499999932, "y": 2.7702343750000002, "z": 0.48074218749999953 },
	{ "x": 0.396367187500032, "y": 24.9042187499994, "z": -3.0496874999999886 },
	{ "x": -2.251601562499981, "y": 2.2597265625000396, "z": 0.30867187500000376 },
	{ "x": 0.876679687500002, "y": 14.517929687499912, "z": -2.4198046874999855 },
	{ "x": -0.7894140624999822, "y": 13.095312499999924, "z": -1.1363671874999997 },
	{ "x": -0.9809765624999811, "y": 0.252379385640705, "z": 0.09367187499999963 },
	{ "x": 6.227929687499979, "y": -0.2867968749999628, "z": -0.6564453124999977 },
	{ "x": 0.5669921875000125, "y": 5.888476562500073, "z": -0.9128515624999972 },
	{ "x": -1.995312499999996, "y": 2.9778125000000215, "z": 2.1815234375000045 },
	{ "x": -1.8595703124999805, "y": 9.429882812499766, "z": 1.1045312499999982 },
	{ "x": -1.658242187499989, "y": 3.332890625000011, "z": 6.065742187500001 },
	{ "x": -5.645781249999941, "y": 13.233828124999748, "z": 2.481757812500004 },
	{ "x": -2.5535937499999783, "y": 0.618828124999998, "z": -1.4946484375000002 },
	{ "x": -0.8255078125000018, "y": -0.5905078124999996, "z": 1.496171875000001 },
	{ "x": -0.9367187500000006, "y": 0.2528125000000014, "z": 1.4468359375000013 },
	{ "x": -0.36195312500000065, "y": 2.6743359375000018, "z": 0.1378906249999995 },
	{ "x": -0.7257421874999992, "y": 3.3907421874999923, "z": 0.5038671874999986 },
	{ "x": 0.9863281249999993, "y": -1.3751953124999832, "z": 2.016953125000005 },
	{ "x": 0.02230468750000125, "y": -0.2764843750000024, "z": 0.5840234374999989 },
	{ "x": -6.0895312499999985, "y": 6.885898437499928, "z": 0.2303515625000223 }
	]

	points.forEach((el, i) => {
		S.Set(`pos-dn_${i}`, el)
	})
}
export { options }