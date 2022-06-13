
import * as THREE from './libs/three.js/build/three.module.js';

export const line = (x) => {
	return x
}
export const easeOutQuart = (x) => {
	// x = x + 0.1
	return 1 - Math.pow(1 - x, 4);
}

export function easeOutCubic(x) {
	return 1 - Math.pow(1 - x, 3);
}

export function easeInCubic(x) {
	return x * x * x;
}

export const easeOutSine = (x) => {
	return Math.sin((x * Math.PI) / 2);
}

export function easeOutQuad(x) {
	return 1 - (1 - x) * (1 - x);
}

export const easeInSine = (x) => {
	if (x == Infinity || x == -Infinity) return 0;
	return 1 - Math.cos((x * Math.PI) / 2);
}

export function easeInQuart(x) {
	return x * x * x * x;
}

export function easeInQuint(x) {
	return x * x * x * x * x;
}

export function easeInOutSine(x) {
	return -(Math.cos(Math.PI * x) - 1) / 2;
}

export function easeOutCirc(x) {
	return Math.sqrt(1 - Math.pow(x - 1, 2));
}

export function easeOutElastic(x) {
	const c4 = (2 * Math.PI) / 3;

	return x === 0
		? 0
		: x === 1
			? 1
			: Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}


export function easeOutBounce(x) {
	const n1 = 7.5625;
	const d1 = 2.75;

	if (x < 1 / d1) {
		return n1 * x * x;
	} else if (x < 2 / d1) {
		return n1 * (x -= 1.5 / d1) * x + 0.75;
	} else if (x < 2.5 / d1) {
		return n1 * (x -= 2.25 / d1) * x + 0.9375;
	} else {
		return n1 * (x -= 2.625 / d1) * x + 0.984375;
	}
}

export function easeOutBack(x) {
	const c1 = 1.70158;
	const c3 = c1 + 1;

	return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}


export function ftH_easeInOutSine(from, to, t) {
	let tv = t * 2
	if (tv > 1) tv = 2 - tv
	tv = easeInOutSine(tv);
	return from + (to - from) * tv;
}

export function ftHalf(from, to, t, f1 = line, f2 = line) {
	let tv = t * 2
	if (tv <= 1)
		tv = f1(tv)
	else
		tv = f2(2 - tv)
	return from + (to - from) * tv;
}

export function bordft(from, to, t) {
	if (t <= from) t = 0
	else if (t >= to) t = 1
	else t = (t - from) / (to - from)
	// console.log(t)
	return t;
}

export function ft(from, to, t, func = line) {
	return from + (to - from) * func(t);
}

export function linft(from, to, t) {
	return from + (to - from) * t;
}

export function sinft(from, to, grad) {
	return from + (to - from) * ((1.0 + Math.sin(grad)) * 0.5);
}

export function cosft(from, to, grad) {
	return from + (to - from) * ((1 + Math.cos(grad)) * 0.5);
}

//####################

export function getCenter(mesh) {
	mesh.geometry.computeBoundingSphere();
	return new THREE.Vector3().copy(mesh.geometry.boundingSphere.center);
}

export function group_rotate(group, rotateX, rotateY, rotateZ) {
	group.rotateOnAxis(new THREE.Vector3(1, 0, 0), rotateX);
	group.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotateY);
	group.rotateOnAxis(new THREE.Vector3(0, 0, 1), rotateZ);
}

export function cloneGeometry(mesh, gmat) {

	var geometryClone = mesh.geometry.clone();
	var gmesh = new THREE.Mesh(geometryClone, gmat);
	gmesh.position.clone(mesh.position);
	gmesh.rotation.clone(mesh.rotation);
	gmesh.scale.clone(mesh.scale);
	return gmesh;
}

//####################

export function projectOnScreen(object, camera) {
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
export function shuffle(array) {
	for (let i = array.length - 1; i > 0; i--) {
		let j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

export function mod(f, m = 1) {
	return f % m;
}

export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);



export function Vecor3Copy(vector3, modV = null) {
	let ret = new THREE.Vector3(vector3.x, vector3.y, vector3.z)
	if (modV) {
		ret.x = mod(ret.x, modV)
		ret.y = mod(ret.y, modV)
		ret.z = mod(ret.z, modV)
	}
	return ret
}

export const PI2 = Math.PI * 2
export const dE = 0.01
export function rotateFTP(from, to, pc, dRadCicle = PI2) {
	from += Math.PI
	to += Math.PI

	if (from >= to - dE) {
		from = mod(from, PI2)
		to = to + PI2
	}

	/* if (to <= from && to + Math.PI / 2 >= from) {
		let tmp = to
		to = from
		from = tmp
		console.log(`${from} ${to}`)
	} */

	// if (to - from < Math.PI) {
	// 	dRadCicle = PI2
	// }

	let ret = ft(from, to + dRadCicle, pc)
	ret = mod(ret, PI2)
	return ret - Math.PI
}



