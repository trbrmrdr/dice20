import Cookies from 'js-cookie'
import * as THREE from './libs/three.js/build/three.module.js';

export function GetV3(key, defVal = new THREE.Vector3()) {
	return Get(key, defVal)
}
export function Get(key, defVal = null) {
	let type = typeof defVal

	let t = Cookies.get(key)

	if (defVal?.isVector3 == true) {
		try {
			t = JSON.parse(Cookies.get(key))
			return new THREE.Vector3(t.x, t.y, t.z)
		} catch (ex) {
			return defVal
		}
	}


	if (type == 'boolean') {
		if (t == "true") return true
		if (t == "false") return false
		if (t) return t == 1 ? true : false
		return defVal
	} else if (type == 'string') {
		if (t) return t
		return defVal
	} else if (type == 'object') {
		try {
			return JSON.parse(t) || defVal
		} catch (ex) {
			return defVal
		}
	}
	// if (type == 'undefined' ||
	// 	type == 'number'
	// )
	if (t) return Number(Cookies.get(key))
	return defVal
}

export function Set(key, val) {
	let type = typeof val

	if (type == 'object') {
		Cookies.set(key, JSON.stringify(val))
		return val
	} else if (type == 'string') {
		Cookies.set(key, val.toString())
		return val
	} else {
		Cookies.set(key, val.toString())
		return Number(val)
	}
}

export { Cookies }