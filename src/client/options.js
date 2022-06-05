import * as S from './saves.js'


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
		reflectivity: S.Get("dice-reflectivity", 0.15),
		roughness: S.Get("dice-roughness", 0.93),
		transmission: S.Get("dice-transmission", 0.96),
		thickness: S.Get("dice-thickness", 0.15),

		typeBump: S.Get("dice-typeBump", "type_1"),
		bumpScale: S.Get("dice-bumpScale", 0.01),
	},
	light: {
		dir: S.Get("dir", 0.49),
		dirColor: S.Get("dirColor", 0xE4E186),
		spot: S.Get("spot", 0.75),
		spotColor: S.Get("spotColor", 0xE2DBAB),
	},

	bloom: {
		exposure: S.Get("bloom-exposure", 1),
		strength: S.Get("bloom-strength", 6.3),

		radius: S.Get("bloom-radius", 0.40),
		radius_end: S.Get("bloom-radius_end", 0.60),
		anim_speed: S.Get("bloom-anim_speed", 3.8)
	},

	anim: {
		color: {
			h: Math.random(),
			h_end: Math.random(),

			l: 0.7,

			s: 0.03,
			s_end: 0.5
		},

		enableColor: S.Get("anim-enableColor", true),
		enableRotation: S.Get("anim-enableRotation", true),
		enableTranslateNumber: S.Get("anim-enableTranslateNumber", true),
		show_all: false,
		position_number: S.Get("anim-position_number", -0.09),

		speed: S.Get("anim-speed", 2.74),
		delay: S.Get("anim-delay", 0.27),


		grPass: null,
		setAnimPos: null,

		rays_gp: null,//rays group gui
		light_gp: null,//godlight group gui
		raduis_main: S.Get("anim-raduis_main", 1.5),

		radius_small_light: S.Get("anim-radius_small_light", 1.0),
		position_light: S.Get("anim-position_light", 1),


		position_anim: S.Get("anim-position_anim", 1),
	}
};

// Cookies.remove("anim-color")
options.anim.color = S.Get("anim-color", options.anim.color)

export{options}