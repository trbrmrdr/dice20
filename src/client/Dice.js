
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
        // this.dice_bump = textureLoader.load("data/barhat_bump.jpg");
    }

    initDice(mesh_diceIn, optionsDiceIn, objs_sector) {
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

        this.center = H.getCenter(mesh_diceIn);
        this.radius = mesh_diceIn.geometry.boundingSphere.radius

        this.mesh_diceIn = mesh_diceIn

        this.group.add(mesh_diceIn)

        objs_sector.forEach(sector => {
            const numberObj = new NumberObj(sector, this.center)
            numberObj.setActive(this.activeLayerI /* =-1 */)
            this._numbers.push(numberObj);

            this.groupOcl.add(numberObj.light);
            this.groupOcl.add(sector);

        })

        for (let i = 0; i < 5; ++i) {
            this.cut_dice.push(null);
        }
    }

    _numbers = []//1-20 - по слоям до 1,21,31,41,51,61,71,81,91
    setNumbers(target, layer, meshNumber) {
        const numberObj = this._numbers[target];

        numberObj.addMeshsNumbers(layer, meshNumber)
        // numberObj.setActive(this.activeLayerI)

        this.group.add(meshNumber);

        // this.group.add(obj_n_sector)
        // obj_n_sector.material = this.dice_Material
    }


    cut_dice = []
    active_mesh_dice = null
    gmat = new THREE.MeshBasicMaterial({ color: 0x000000, map: null });
    dice_Material// = new THREE.MeshPhysicalMaterial()

    setCutDice(layer, optionsDice, mesh_dice) {
        //material mesh_dice
        if (!this.dice_Material) {
            this.dice_Material = new THREE.MeshPhysicalMaterial()
            const mat = this.dice_Material;
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
        mesh_dice.material = this.dice_Material;
        this.group.add(mesh_dice)
        this.groupOcl.add(H.cloneGeometry(mesh_dice, this.gmat));

        this.cut_dice[layer] = mesh_dice;
        mesh_dice.visible = false
    }

    activeLayerI = -1
    setActiveMesh(layerI) {
        if (layerI == null) return
        if (this.activeLayerI == layerI) return;
        this.activeLayerI = layerI;
        // console.log("setActiveMesh", layerI);
        if (this.active_mesh_dice) this.active_mesh_dice.visible = false;
        this.active_mesh_dice = this.cut_dice[layerI];
        this.active_mesh_dice.visible = true;

        this._numbers.forEach((number, i) => {
            // console.log(i);
            number.setActive(layerI);
        })
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


    layerToNum(toNum = options.rotating.toNum) {
        let tmp = toNum % 20
        return tmp == 0 ? 20 : tmp
    }

    selectLayer(targetNum = this._sel_num) {
        let ret = Math.max(0, Math.ceil(targetNum / 20) - 1)
        // console.log(`selectLayer ${targetNum} -> ${ret}`);
        return ret
    }
    start(gui = null) {
        this.dAngle_gp = gui
        this._sel_num = options.rotating.toNum
        this._targetLayerFromNum = this.selectLayer()
        this.setActiveMesh(this._targetLayerFromNum)
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

    getNameAngle(iNum = this.layerToNum()) {
        return `pos-dn_${iNum}`
    }

    update_number(read = false, fromAnim = false) {
        if (this.sel_num <= 0) {
            this.createDAngleFolder()
            this.changeRotate();
            return
        }

        let dAngle = options.position.dAngle
        let name = this.getNameAngle(this.layerToNum(this._sel_num) % 20)
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

    update(elapsed_time, updateAnimGoodRay_in = (pos_anim) => { }, updateAnimGoodRay_out = (percent) => { }) {
        let percent_anim_camera = 0;
        if (this._startIn > 0) {
            let pos_anim = this.updateAnimInProcess(elapsed_time)
            updateAnimGoodRay_in(pos_anim);
            percent_anim_camera = H.easeOutCirc(this._pc_anim)
        }
        else if (this._startProc > 0) {
            percent_anim_camera = 1
            let pos_anim = this.updateAnimInProcess(elapsed_time)
            updateAnimGoodRay_in(pos_anim);
        }
        else if (this._startOut > 0) {
            this.updateAnimOut(elapsed_time, updateAnimGoodRay_out)
            percent_anim_camera = 1 - H.easeOutCubic(this._pc_anim)
        }
        return percent_anim_camera;
    }


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
        this._startInAnimRec = -1
        this._endInOut = elapsedTime + options.rotating.durationIn
        this._startProc = -1
        this._startOut = -1
        // this._ftInAngle.f = S.GetV3(this.getNameAngle(this._sel_num))
        this._ftInAngle.f = H.Vecor3Copy(options.position.dAngle)
        this._ftInAngle.t = S.GetV3(this.getNameAngle())
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

        if (this._startIn == -1 && this._startProc == -1) {
            //небыли в процессе и после половины таймера
            //непоменяли слои
            //меняем тут!
            this.getSpiralLayer()
            this.setActiveMesh(this._targetLayerFromNum)
            this._targetLayerFromNum = null;
        }


        this.resetColor()
        this._startIn = -1
        this._endInOut = elapsedTime + options.rotating.durationOut
        this._startProc = -1
        this._startOut = elapsedTime

        this._ftInAngle.f = H.Vecor3Copy(options.position.dAngle, H.PI2)
        this._ftInAngle.t = S.GetV3(this.getNameAngle())
    }

    _stop(force = false) {
        this._startIn = -1
        // this._endInOut = -1
        this._startProc = -1
        if (force) {
            this._startOut = -1
        }
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
                z: H.ft(0, 1, prc, this._prc.fz),
                prc: prc
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

        this.getLayersFrom().forEach((layer, iL) => {
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

    _pc_anim = 0
    updateRotation(elapsedTime) {

        this.pc_anim = 0;
        //Выход
        if (this._startOut != -1) {
            this.setActiveMesh(this._targetLayerFromNum)
            if (this._targetLayerFromNum != null) this._targetLayerFromNum = null;

            this._pc_anim = H.mod(elapsedTime - this._startOut, options.rotating.durationOut) / options.rotating.durationOut

            let hasEnd = false
            if (elapsedTime >= this._endInOut) {
                this._pc_anim = 1.0
                hasEnd = true
            }

            let r_pc_anim = H.ft(0, 1, this._pc_anim, H.easeOutCubic)
            this.animRotate(r_pc_anim, 0, this._ftInAngle.f, this._ftInAngle.t, false)

            if (hasEnd) {
                this._stop()
            }
        }
        //Старт
        if (this._startIn != -1) {
            this._pc_anim = H.mod(elapsedTime - this._startIn, options.rotating.durationIn) / options.rotating.durationIn

            let hasEnd = false
            if (elapsedTime >= this._endInOut) {
                this._pc_anim = 1.0
                hasEnd = true
            }
            // this._pc_anim = H.ft(0, 1, this._pc_anim, H.easeInCubic)
            this._pc_anim = H.ft(0, 1, this._pc_anim, H.easeInSine)
            this.animRotate(this._pc_anim, 0, this._ftInAngle.f, this._ftInAngle.t, false)

            if (this._pc_anim >= 1.0 || hasEnd) {
                this.processed(elapsedTime)
            }
        }

        //Процесс
        if (this._startProc != -1) {
            if (elapsedTime >= this._startProc + options.rotating.durationPrc) {
                this.processed(elapsedTime)
            }

            // let this._pc_anim = H.mod(elapsedTime - this._startProc, options.rotating.durationPrc) / options.rotating.durationPrc
            // this.animRotate(this._pc_anim, H.PI2, this._ftInAngle.f, this._ftInAngle.t, true)

            this._pc_anim = this._prc.update(elapsedTime)
            this.animRotate2(this._pc_anim, H.PI2, this._ftInAngle.f, this._ftInAngle.t, false)
            if (this._pc_anim.prc >= 0.5) {
                this._startInAnimRec = -1
                this.setActiveMesh(this._targetLayerFromNum)
                this._targetLayerFromNum = null;
            }
        }
        return this._pc_anim
    }

    _startOut2 = -1
    updateAnimOut(elapsedTime, outAnim = (percent) => { }) {
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

    _startInAnimRec = -1
    updateAnimInProcess(elapsedTime) {

        if (this._startInAnimRec == -1 && this._startIn > 0) {
            this._startInAnimRec = this._startIn
        }
        const duration = options.rotating.durationIn * 0.25
        let pos_out_anim = Math.min(1, (elapsedTime - this._startInAnimRec) / duration)
        pos_out_anim = H.easeOutCubic(pos_out_anim)

        let rLayer = this.getSpiralLayer()
        rLayer.forEach((objNum, i) => {
            objNum.setStartColor(i, pos_out_anim, elapsedTime)
        })
        return pos_out_anim;
    }

    //#####################################################################################################################
    //#####################################################################################################################
    _spiralLayer = []
    _sLayerI = 0
    _targetLayerFromNum = null
    getSpiralLayer(targetNum = options.rotating.toNum) {

        let iNum = this.layerToNum(targetNum)
        this._targetLayerFromNum = this.selectLayer(targetNum)
        // console.log(`--getSpiralLayer(${targetNum}) ${this._sLayerI} ${iNum}     `)
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
    getLayersFrom(layerToNum = this.layerToNum()) {
        if (this._layerI == layerToNum) return this._currLayes
        this._layerI = layerToNum
        let _tmpMap = []
        this._currLayes = []
        _tmpMap = this.layer_anim[layerToNum]
        _tmpMap.forEach((layer, il) => {
            var newObjs = []
            if (il == 0) {
                this._currLayes.push([this._numbers[layerToNum - 1]])
            }
            layer.forEach((idN, i) => {
                newObjs.push(this._numbers[idN - 1])
            })
            this._currLayes.push(newObjs)
        })
        return this._currLayes
    }
}