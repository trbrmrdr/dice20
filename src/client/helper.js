
import * as THREE from './libs/three.js/build/three.module.js';

export const easeOutQuart = (x) => {
	// x = x + 0.1
	return 1 - Math.pow(1 - x, 4);
}
export function linftEOQ(from, to, t) {
	return from + (to - from) * easeOutQuart(t);
}


export function easeOutCubic(x) {
	return 1 - Math.pow(1 - x, 3);
}

export function linftEOC(from, to, t) {
	return from + (to - from) * easeOutCubic(t);
}

export const easeOutSine = (x) => {
	return Math.sin((x * Math.PI) / 2);
}
export const easeInSine = (x) => {
	if (x == Infinity || x == -Infinity) return 0;
	return 1 - Math.cos((x * Math.PI) / 2);
}

export function easeInQuart(x) {
	return x * x * x * x;
}

export function linftHalfEOC(from, to, t) {
	let tv = t * 2
	if (tv > 1) tv = 2 - tv
	tv = easeOutCubic(tv);
	return from + (to - from) * tv;
}

export function linftHalf_EIS_EIQ(from, to, t) {
	let tv = t * 2
	if (tv > 1) {
		tv = 2 - tv
		tv = easeInSine(tv);
	}else{
		tv = easeInSine(tv);
	}
	
	return from + (to - from) * tv;
}

export function linftHalf(from, to, t) {
	let tv = t * 2
	if (tv > 1) tv = 2 - tv
	return from + (to - from) * tv;
}

export function bordft(from, to, t) {
	if (t <= from) t = 0
	else if (t >= to) t = 1
	else t = (t - from) / (to - from)
	// console.log(t)
	return t;
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
