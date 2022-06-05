import Cookies from 'js-cookie'

export function Get(key, defVal = null) {
	let type = typeof defVal

	let t = Cookies.get(key)
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
			return JSON.parse(Cookies.get(key)) || defVal
		} catch (ex) {
			return defVal
		}
	}
	// if (type == 'undefined' ||
	// 	type == 'number'
	// )
	return Number(Cookies.get(key) || defVal)
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