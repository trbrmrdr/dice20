
import * as THREE from './libs/three.js/build/three.module.js';
import { Vector3 } from './libs/three.js/build/three.module.js';
import * as H from './helper.js'
import { NumberObj } from "./NumberObj.js"
import { options } from './options.js'
import * as S from './saves.js'


export class Dice {

    groupLight = new THREE.Group()
    groupOcl = new THREE.Group()
    group = new THREE.Group()

    layer_anim = {}
    constructor() {

        /* Object.entries(obj).forEach(entry => {
            const [key, value] = entry;
            console.log(key, value);
          }); */

        Object.assign(this.layer_anim, options.diceLayers)
        for (const [key, value] of Object.entries(this.layer_anim)) {
            let arr = []
            value.forEach((el, i) => {
                if (i == 4) {
                    arr.push([Number(key)])
                    return
                }
                if (i >= 4) return
                arr.splice(0, 0, el)
            })
            this.layer_anim[value[4][0]] = arr
        }
    }


    loadTexture() {
        const textureLoader = new THREE.TextureLoader();
        this.dice_map = textureLoader.load("data/barhat.jpeg");
        this.dice_bump_in = textureLoader.load("data/noise_bump_in_1.png");
        this.dice_bump = textureLoader.load("data/barhat_bump.jpg");
    }

    initDice(mesh_dice, optionsDice,
        mesh_diceIn, optionsDiceIn
    ) {
        //material mesh_dice
        if (true) {
            mesh_dice.material = new THREE.MeshPhysicalMaterial()

            const mat = mesh_dice.material;
            mat.reflectivity = optionsDice.reflectivity
            mat.roughness = optionsDice.roughness
            mat.transmission = optionsDice.transmission
            mat.thickness = optionsDice.thickness

            mat.map = this.dice_map


            // mat.bumpMap = dice_bump
            switch (optionsDice.typeBump) {
                case "none":
                    mat.bumpMap = null
                    break;
                case "type_1":
                    mat.bumpMap = this.dice_bump
                    break;
                case "type_2":
                    mat.bumpMap = this.dice_bump_in
                    break;
            }

            mat.bumpScale = optionsDice.bumpScale
        }
        //material diceIn
        if (true) {
            mesh_diceIn.scale.set(optionsDiceIn.scale, optionsDiceIn.scale, optionsDiceIn.scale)

            mesh_diceIn.material = new THREE.MeshStandardMaterial()
            const mat = mesh_diceIn.material
            mat.roughness = optionsDiceIn.roughness
            mat.metalness = optionsDiceIn.metalness

            mat.bumpScale = optionsDiceIn.bumpScale
            mat.bumpMap = this.dice_bump_in
        }

        this.center = H.getCenter(mesh_dice);
        this.radius = mesh_dice.geometry.boundingSphere.radius

        this.mesh_dice = mesh_dice
        this.mesh_diceIn = mesh_diceIn

        this.group.add(mesh_dice, mesh_diceIn)

        const gmat = new THREE.MeshBasicMaterial({ color: 0x000000, map: null });
        this.groupOcl.add(H.cloneGeometry(mesh_dice, gmat));
    }

    _numbers = []
    addNumber(i, meshNumber, obj_n_sector) {
        const numberObj = new NumberObj(i, meshNumber, obj_n_sector, this.center)

        this._numbers.push(numberObj);

        this.group.add(meshNumber);

        this.groupOcl.add(numberObj.light);
        this.groupOcl.add(obj_n_sector);
    }

    resetColor() {
        this._numbers.forEach(el => el.resetColor())
    }


    dirLights = [];
    spotLights = [];

    initLight(objs, options_light) {

        objs.forEach((obj) => {

            let tmpLight = null

            if (obj.type == "SpotLight") {
                tmpLight = obj.clone()

                this.spotLights.push(tmpLight);

                tmpLight.intensity = options_light.spot;
                tmpLight.color.set(options_light.spotColor)
            } else if (obj.type == "DirectionalLight") {
                tmpLight = obj.clone()


                this.dirLights.push(tmpLight);
                tmpLight.intensity = options_light.dir;
                tmpLight.color.set(options_light.dirColor)
            }

            if (tmpLight) this.groupLight.add(tmpLight)
        })

    }

    vlight = null
    initGodLight(scaleR) {
        if (this.vlight) {
            this.vlight.scale.set(scaleR, scaleR, scaleR)
            return
        }

        this.vlight = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.35, 20),
            new THREE.MeshBasicMaterial({ color: 0x77bbff })
        );
        this.groupOcl.add(this.vlight);

        this.vlight.position.copy(this.center);
        this.vlight.scale.set(scaleR, scaleR, scaleR)

    }

    rotate(x, y, z) {
        let euler = new THREE.Euler(x, y, z)

        // this.group.rotateOnAxis
        // this.group.setRotationFromEuler(euler)
        // this.groupOcl.setRotationFromEuler(euler)

        this.group.rotation.x = x
        this.group.rotation.y = y
        this.group.rotation.z = z

        this.groupOcl.rotation.x = x
        this.groupOcl.rotation.y = y
        this.groupOcl.rotation.z = z
        return euler
    }


    rotateLight(delta, elapsed) {
        const rotateX = delta / H.sinft(5, 10, elapsed) * Math.PI * 2;
        const rotateY = delta / H.sinft(5, 7, elapsed) * Math.PI * 2;
        const rotateZ = (delta / 3) * Math.PI * 2;

        H.group_rotate(this.groupLight, rotateX, rotateY, rotateZ)
    }

    //__________________________________________

    changeRotate(dx = null, dy = null, dz = null) {

        if (dx != null || dy != null) {

            // if (this.subF) {
            options.position.dAngle.x += dx
            options.position.dAngle.y += dy
            options.position.dAngle.z += dz
            this.update_number()
            return
            // }
        }

        this.rotate(
            options.position.dAngle.x,
            options.position.dAngle.y,
            options.position.dAngle.z)
        options.position.gp?.updateDisplay()
        // if (save) {
        //     S.Set("position-angle", options.position.angle)
        // }
    }

    subF = null
    dAngle_gp //not null
    _sel_num = 0

    initGui(gui = null) {
        this.dAngle_gp = gui
        this._sel_num = options.rotating.toNum
        this.update_number(true, true)
        this.to_angle = H.Vecor3Copy(this.from_angle)
        return this.dAngle_gp
    }

    createDAngleFolder() {
        if (this.subF) {
            this.dAngle_gp?.removeFolder(this.subF)
            this.subF = null
        }
        if (this._sel_num <= 0) return

        this.subF = this.dAngle_gp?.addFolder("angle")

        if (this.subF) {
            this.subF.add(options.position.dAngle, "x", -Math.PI, Math.PI, 0.01).onChange((value) => {
                this.update_number()
            })
            this.subF.add(options.position.dAngle, "y", -Math.PI, Math.PI, 0.01).onChange((value) => {
                this.update_number()
            })
            this.subF.add(options.position.dAngle, "z", -Math.PI, Math.PI, 0.01).onChange((value) => {
                this.update_number()
            })

            this.subF.open()
        }
    }


    from_angle;
    to_angle;

    getNameAngle(iNum) {
        return `pos-dn_${iNum}`
    }

    update_number(read = false, fromAnim = false) {
        if (this.sel_num <= 0) {
            this.createDAngleFolder()
            this.changeRotate();
            return
        }

        let dAngle = options.position.dAngle
        let name = this.getNameAngle(this._sel_num)
        if (read) {
            dAngle = S.Get(name, new THREE.Vector3())
            options.position.dAngle = dAngle
            this.createDAngleFolder()
        } else {
            dAngle = S.Set(name, dAngle)
        }

        this.rotate(
            dAngle.x,
            dAngle.y,
            dAngle.z)
        this.subF?.updateDisplay()


        if (fromAnim) {
            if (this.from_angle && this.to_angle) {
                this.from_angle = H.Vecor3Copy(this.to_angle)
                this.to_angle = H.Vecor3Copy(dAngle)
            } else if (!this.from_angle) {
                this.from_angle = H.Vecor3Copy(dAngle)
            } else if (!this.to_angle) {
                this.to_angle = H.Vecor3Copy(dAngle)
            }
        }
    }

    //____________________________________________

    _animRotate(euler) {
        this.rotate(euler.x, euler.y, euler.z)
        // this.group.setRotationFromEuler(euler)
        // this.groupOcl.setRotationFromEuler(euler)


        options.position.dAngle.x = euler.x
        options.position.dAngle.y = euler.y
        options.position.dAngle.z = euler.z
        this.subF?.updateDisplay()
    }

    animRotate(percent, dRadCicle = 0/* H.PI2 */,
        from = this.from_angle,
        to = this.to_angle,
        hasSkip = false) {

        let retEuler = this.rotate(
            H.rotateFTP(from.x, to.x, percent, dRadCicle),
            H.rotateFTP(from.y, to.y, percent, dRadCicle),
            H.rotateFTP(from.z, to.z, percent, dRadCicle),
        )
        if (hasSkip) {
            // retEuler.x = 0
            // retEuler.y = 0
            retEuler.z = to.z
        }

        this._animRotate(retEuler)
    }

    animRotate2(prcXYZ, dRadCicle = H.PI2,
        from = this.from_angle,
        to = this.to_angle,
        hasSkip = false) {

        let retEuler = this.rotate(
            H.rotateFTP(from.x, to.x, prcXYZ.x, dRadCicle),
            H.rotateFTP(from.y, to.y, prcXYZ.y, dRadCicle),
            H.rotateFTP(from.z, to.z, prcXYZ.z, dRadCicle),
        )
        if (hasSkip) {
            // retEuler.x = 0
            // retEuler.y = 0
            retEuler.z = to.z
        }

        this._animRotate(retEuler)
    }

    //_________________________________

    _startIn = -1
    _endInOut = -1
    _startProc = -1

    p_startOut = -1
    _out_step1 = false
    _out_step2 = false
    get _startOut() { return this.p_startOut }
    set _startOut(value) {
        this.p_startOut = value
        this._out_step1 = false
        this._out_step2 = false
    }

    _ftInAngle = { f: null, t: null }
    startIn(elapsedTime) {
        this._startIn = elapsedTime
        this._startInAnim = -1
        this._endInOut = elapsedTime + options.rotating.durationIn
        this._startProc = -1
        this._startOut = -1
        // this._ftInAngle.f = S.GetV3(this.getNameAngle(this._sel_num))
        this._ftInAngle.f = H.Vecor3Copy(options.position.dAngle)
        this._ftInAngle.t = S.GetV3(this.getNameAngle(options.rotating.toNum))
    }

    processed(elapsedTime) {
        this._startIn = -1
        this._startOut = -1
        if (this._startProc == -1) {
            this._ftInAngle.f = H.Vecor3Copy(options.position.dAngle, H.PI2)
            this._ftInAngle.t = H.Vecor3Copy(this._ftInAngle.f)
        } else {
            // this._ftInAngle.f = H.Vecor3Copy(options.position.dAngle, H.PI2)
            // this._ftInAngle.t = S.GetV3(this.getNameAngle(1 + Math.floor(Math.random() * 19)))
        }

        this._startProc = elapsedTime
        this._prc.processed()
    }

    startOut(elapsedTime) {
        this.resetColor()
        this._startIn = -1
        this._endInOut = elapsedTime + options.rotating.durationOut
        this._startProc = -1
        this._startOut = elapsedTime

        this._ftInAngle.f = H.Vecor3Copy(options.position.dAngle, H.PI2)
        this._ftInAngle.t = S.GetV3(this.getNameAngle(options.rotating.toNum))
    }

    _stop(force = false) {
        this._startIn = -1
        // this._endInOut = -1
        this._startProc = -1
        if (force) { this._startOut = -1 }
    }

    _prc = {
        processed: () => {

            this._prc.fx = H.line
            this._prc.fy = H.line
            this._prc.fz = () => 1
            return
            let randf = [
                // H.line,
                // H.line,
                // H.line,
                H.easeInOutSine,
                H.easeOutSine,
                H.easeInQuart
            ]
            let getF = () => {
                let i = Math.floor(Math.random() * (randf.length - 1))
                let ret = randf[i]
                randf.splice(i, 1)
                return ret
            }
            this._prc.fx = getF()
            this._prc.fy = getF()
            this._prc.fz = getF()
        },
        update: (elapsedTime) => {
            let prc = H.mod(elapsedTime - this._startProc, options.rotating.durationPrc) / options.rotating.durationPrc

            return {
                x: H.ft(0, 1, prc, this._prc.fx),
                y: H.ft(0, 1, prc, this._prc.fy),
                z: H.ft(0, 1, prc, this._prc.fz)
            }

        },
        fx: () => { },
        fy: () => { },
        fz: () => { },

    }

    lightOutAnimation(percent, first) {
        let posLight = H.ft(0.6, 1.25, percent, H.easeInOutSine)
        // let radiusLight = H.ftHalf(0.0, 1.14, percent, H.easeInQuint, () => 1, 0.9)
        let radiusLight = first ?
            H.ft(0.0, 1.14, percent, H.easeInQuint) :
            H.ft(0.0, 0.13, percent, H.easeInQuint)

        this.getLayersFrom(options.rotating.toNum).forEach((layer, iL) => {
            layer.forEach((objNum, i) => {

                if (first) {
                    objNum.setAnimColor(iL, percent)

                    if (iL == 0) {
                        objNum.setLightParam(posLight, radiusLight)
                    } else {
                        objNum.resetColor()
                        objNum.light.visible = false
                        objNum.sector.visible = true
                    }

                    objNum.sector.visible = false
                } else {

                    // objNum.setAnimColor(5 - iL, percent)
                    if (iL == 0) {
                        objNum.setAnimColor(iL, percent)
                        objNum.setLightParam(posLight, radiusLight)
                    } else {
                        objNum.resetColor()
                        objNum.light.visible = false
                        objNum.sector.visible = true
                    }
                }
            })
        })
    }

    updateRotation(elapsedTime) {

        let pc_anim = 0;
        //Выход
        if (this._startOut != -1) {
            pc_anim = H.mod(elapsedTime - this._startOut, options.rotating.durationOut) / options.rotating.durationOut

            let hasEnd = false
            if (elapsedTime >= this._endInOut) {
                pc_anim = 1.0
                hasEnd = true
            }

            let r_pc_anim = H.ft(0, 1, pc_anim, H.easeOutCubic)
            this.animRotate(r_pc_anim, 0, this._ftInAngle.f, this._ftInAngle.t, false)

            if (hasEnd) {
                this._stop()
            }
        }
        //Старт
        if (this._startIn != -1) {
            pc_anim = H.mod(elapsedTime - this._startIn, options.rotating.durationIn) / options.rotating.durationIn

            let hasEnd = false
            if (elapsedTime >= this._endInOut) {
                pc_anim = 1.0
                hasEnd = true
            }
            // pc_anim = H.ft(0, 1, pc_anim, H.easeInCubic)
            pc_anim = H.ft(0, 1, pc_anim, H.easeInSine)
            this.animRotate(pc_anim, 0, this._ftInAngle.f, this._ftInAngle.t, false)

            if (pc_anim >= 1.0 || hasEnd) {
                this.processed(elapsedTime)
            }
        }

        //Процесс
        if (this._startProc != -1) {
            if (elapsedTime >= this._startProc + options.rotating.durationPrc) {
                this.processed(elapsedTime)
            }

            // let pc_anim = H.mod(elapsedTime - this._startProc, options.rotating.durationPrc) / options.rotating.durationPrc
            // this.animRotate(pc_anim, H.PI2, this._ftInAngle.f, this._ftInAngle.t, true)

            pc_anim = this._prc.update(elapsedTime)
            this.animRotate2(pc_anim, H.PI2, this._ftInAngle.f, this._ftInAngle.t, false)
        }
        return pc_anim
    }

    _startOut2 = -1
    animOut(elapsedTime, outAnim = (x) => { }) {
        let pos_out_anim = -1
        let pos_preparation = 0
        if (this._startOut > 0) {

            const durationPreps = 0.5
            const startPreps = this._startOut
            pos_preparation = Math.min(1, (elapsedTime - startPreps) / durationPreps)

            //____________________
            const dStart = options.rotating.durationOut * 0.65

            const duration = this._out_step1 ?
                options.rotating.durationOut * 0.8 :
                options.rotating.durationOut

            const start_anim = !this._out_step1 ?
                this._startOut + dStart :
                this._startOut2 + dStart

            const end_first_anim = start_anim + duration

            pos_out_anim = H.mod(elapsedTime - start_anim, duration) / duration

            if (!this._out_step1 && end_first_anim <= elapsedTime) {
                this._out_step1 = true
                this._startOut2 = elapsedTime - dStart
            }
        }
        if (pos_out_anim >= 0) {
            pos_out_anim = H.bordft(0, 1, pos_out_anim, H.easeOutCubic)

            this.lightOutAnimation(pos_out_anim, !this._out_step1)
            if (!this._out_step1)
                //     outAnim(1 - pos_out_anim)
                // else
                outAnim(pos_out_anim)
        } else {
            this.getLayersFrom().forEach((layer, iL) => {
                layer.forEach((objNum, i) => {
                    objNum.setPreparation(pos_preparation)
                })
            })
        }
    }

    _startInAnim = -1
    animInP(elapsedTime, inAnim = (x) => { }) {

        if (this._startInAnim == -1 && this._startIn > 0) {
            this._startInAnim = this._startIn
        }
        const duration = options.rotating.durationIn * 0.25
        let pos_out_anim = Math.min(1, (elapsedTime - this._startInAnim) / duration)
        pos_out_anim = H.easeOutCubic(pos_out_anim)

        let rLayer = this.getSpiralLayer()
        rLayer.forEach((objNum, i) => {
            objNum.setStartColor(i, pos_out_anim, elapsedTime)
        })
        inAnim(pos_out_anim)
    }

    _spiralLayer = []
    _sLayerI = 0
    getSpiralLayer(iNum = options.rotating.toNum) {
        if (this._sLayerI == iNum) return this._spiralLayer
        this._sLayerI = iNum
        let _tmpMap = []
        this._spiralLayer = []

        _tmpMap = this.layer_anim[iNum]
        _tmpMap.forEach((layer, il) => {
            if (il == 0) {
                this._spiralLayer.push(this._numbers[iNum - 1])
            }
            layer.forEach((idN, i) => {
                this._spiralLayer.push(this._numbers[idN - 1])
            })
        })
        return this._spiralLayer
    }

    _layerI = 0
    _currLayes = null
    getLayersFrom(iNum = options.rotating.toNum) {
        if (this._layerI == iNum) return this._currLayes
        this._layerI = iNum
        let _tmpMap = []
        this._currLayes = []
        _tmpMap = this.layer_anim[iNum]
        _tmpMap.forEach((layer, il) => {
            var newObjs = []
            if (il == 0) {
                this._currLayes.push([this._numbers[iNum - 1]])
            }
            layer.forEach((idN, i) => {
                newObjs.push(this._numbers[idN - 1])
            })
            this._currLayes.push(newObjs)
        })
        return this._currLayes
    }
}