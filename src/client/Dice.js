
import * as THREE from './libs/three.js/build/three.module.js';
import * as H from './helper.js'
// import { Number } from "./Number.js"
import { options } from './options.js'
import * as S from './saves.js'


export class Dice {

    groupLight = new THREE.Group()
    groupOcl = new THREE.Group()
    group = new THREE.Group()

    constructor() {

        /* Object.entries(obj).forEach(entry => {
            const [key, value] = entry;
            console.log(key, value);
          }); */


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


    numbers = []
    setColorNumber() {

    }

    addNumber(meshNumber, options_anim, obj_n_sector) {
        meshNumber.material = new THREE.MeshBasicMaterial();

        // obj_n_sector.material = new THREE.MeshBasicMaterial({ color: 0x000000, map: null });
        // this.groupOcl.add(H.cloneGeometry(mesh_dice, gmat));

        const numberObj = {
            obj: meshNumber,
            sector: obj_n_sector,
            center: H.getCenter(meshNumber),
            color: {
                h: options_anim.color.h,
                l: options_anim.color.l,
                s: options_anim.color.s
            },

            light: new THREE.Mesh(
                new THREE.IcosahedronGeometry(0.35, 20),
                new THREE.MeshBasicMaterial({ color: 0xe486d3 })
            )
        }
        this.numbers.push(numberObj);

        meshNumber.material.color.setHSL(numberObj.color.h, numberObj.color.l, numberObj.color.s);
        this.group.add(meshNumber);

        const light = numberObj.light
        light.position.copy(numberObj.center);

        this.groupOcl.add(light);
        this.groupOcl.add(obj_n_sector);


        if (this.numbers.length > 1) {
            light.visible = false

        }
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

            if (this.subF) {
                options.position.dAngle.x += dx
                options.position.dAngle.y += dy
                options.position.dAngle.z += dz
                this.update_number()
                return
            }
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

    initGui(gui) {
        this.dAngle_gp = gui
        this.dAngle_gp.open()
        this._sel_num = 1
        this.update_number(true, true)
    }

    createDAngleFolder() {
        if (this.subF) {
            this.dAngle_gp.removeFolder(this.subF)
            this.subF = null
        }
        if (this._sel_num <= 0) return

        this.subF = this.dAngle_gp.addFolder("angle")

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
    _startOut = -1

    _ftInAngle = { f: null, t: null }
    startIn(elapsedTime) {
        this._startIn = elapsedTime
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
            this._ftInAngle.f = H.Vecor3Copy(options.position.dAngle, H.PI2)
            this._ftInAngle.t = S.GetV3(this.getNameAngle(1 + Math.ceil(Math.random() * 19)))
        }

        this._startProc = elapsedTime
        this._prc.processed()
    }

    startOut(elapsedTime) {
        this._startIn = -1
        this._endInOut = elapsedTime + options.rotating.durationOut
        this._startProc = -1
        this._startOut = elapsedTime

        this._ftInAngle.f = H.Vecor3Copy(options.position.dAngle, H.PI2)
        this._ftInAngle.t = S.GetV3(this.getNameAngle(options.rotating.toNum))
    }

    _stop() {
        this._startIn = -1
        this._endInOut = -1
        this._startProc = -1
        this._startOut = -1
    }

    _prc = {
        processed: () => {

            let randf = [
                // H.line,
                // H.line,
                // H.line,
                H.easeInOutSine,
                H.easeOutSine,
                H.easeInQuart
            ]
            let getF = () => {
                let i = Math.ceil(Math.random() * (randf.length - 1))
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

    updateRotation(elapsedTime) {

        //Выход
        if (this._startOut != -1) {
            let pc_anim = H.mod(elapsedTime - this._startOut, options.rotating.durationOut) / options.rotating.durationOut

            let hasEnd = false
            if (elapsedTime >= this._endInOut) {
                pc_anim = 1.0
                hasEnd = true
            }
            // let r_pc_anim = H.ft(0, 1, pc_anim, H.easeOutBack)
            // let r_pc_anim = H.ft(0, 1, pc_anim, H.easeOutElastic)
            let r_pc_anim = H.ft(0, 1, pc_anim, H.easeOutCirc)
            // let r_pc_anim = H.ft(0, 1, pc_anim, H.easeOutBounce)
            this.animRotate(r_pc_anim, 0, this._ftInAngle.f, this._ftInAngle.t, false)

            if (hasEnd) {
                this._stop()
            }
        }
        //Старт
        if (this._startIn != -1) {
            let pc_anim = H.mod(elapsedTime - this._startIn, options.rotating.durationIn) / options.rotating.durationIn

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

            let prc = this._prc.update(elapsedTime)
            this.animRotate2(prc, H.PI2, this._ftInAngle.f, this._ftInAngle.t, false)

        }

    }

    layer_anim = {
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
            [1, 2, 6, 7, 8, 9],
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
}