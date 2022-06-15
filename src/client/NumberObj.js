import * as THREE from './libs/three.js/build/three.module.js';
import * as H from './helper.js'
import { Vector3 } from './libs/three.js/build/three.module.js';
import { options } from './options.js'

export class NumberObj {

    i = -1
    constructor(i, meshNumber, obj_n_sector, diceCentr) {
        this.i = i
        this.diceCentr = diceCentr.clone()
        this.mesh = meshNumber
        //____________________
        this.light = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.35, 20),
            new THREE.MeshBasicMaterial({ color: 0xe486d3 })
        )
        this.light.position.copy(diceCentr);
        //____________________
        this.sector = obj_n_sector
        this.center = H.getCenter(meshNumber)

        const t_sub = new Vector3().subVectors(diceCentr, this.center);
        this.lenghtToPos = t_sub.length();//длинна от центра до цифры
        this.normalToPos = t_sub.normalize();//нормаль в сторону положения числа

        //____________________
        meshNumber.material = new THREE.MeshBasicMaterial();
        this.setColor(
            options.anim.color.h,
            options.anim.color.l,
            options.anim.color.s
        )
        //____________________
        // obj_n_sector.material = new THREE.MeshBasicMaterial({ color: 0x000000, map: null });
        // this.groupOcl.add(H.cloneGeometry(mesh_dice, gmat));

        //____________________

        const pl = this.lenghtToPos * options.anim.position_number;
        const normal = this.normalToPos.clone()
        const new_pos = new Vector3().copy(diceCentr).add(normal.multiplyScalar(-pl));
        meshNumber.position.copy(new_pos)
        //_____________
    }

    _color_s2 = false
    _color_s3 = false

    resetColor() {
        this._color_s2 = false
        this._color_s3 = false
    }

    speedF = {
        0: (t) => H.bord2(0.5, 0.8, 1.0, t),
        1: (t) => H.bord2(0.3, 0.55, 0.8, t),
        2: (t) => H.bord2(0.2, 0.3, 0.55, t),

        3: (t) => H.bord2(0.5, 0.6, 0.85, t),
        4: (t) => H.bord2(0.3, 0.55, 0.8, t),
        5: (t) => H.bord2(0, 0.3, 0.6, t),
    }


    clock = new THREE.Clock();
    _recreate = false


    setStartColor(i, anim_pos, elapsedTime = -1) {
        if (elapsedTime == -1) {
            this.clock.getDelta()
            elapsedTime = this.clock.elapsedTime
        }

        const curr_pc = H.mod(elapsedTime + options.anim.delay * i, options.anim.speed) / options.anim.speed

        const tp = H.bord2(0.25, 0.5, 0.75, curr_pc)

        this.setAnimColor(0, 0, false, tp)
        // if (tp >= 0.5) {
        //     this.resetColor()
        // }

        // const radl = options.anim.radius_small_light
        const radl = H.ftHalf(0, 1, anim_pos, H.easeInSine, H.easeOutBack) * 0.64


        // const posl = options.anim.position_light
        const posl = H.ftHalf(0, 1, anim_pos, H.easeInSine, H.easeOutBack) * 0.73


        this.setLightParam(posl, radl)

        if (i % 2 == 0) { this.light.material.color.set(0x77bbff) }
        if (posl <= 0.1) {
            this.sector.visible = true
        }
        // this.setColor(Math.floor(this._dstart * 4), anim_pos, true)
    }

    dE = 0.1
    setAnimColor(iL, anim_pos, disD3 = false, _tp = undefined) {

        const tp = _tp != undefined ? _tp : this.speedF[iL](anim_pos)

        if (!disD3) {

            if (this._color_s3 == false) {
                if (this._color_s2 == false && tp >= 1.0 - this.dE) {
                    this._color_s2 = true
                }
                if (this._color_s2 == true && tp <= 0 + this.dE) {
                    this._color_s3 = true
                }
            }
        }

        let cS = {
            s: options.anim.color.s,
            e: options.anim.color.s_end
        }
        let cH = {
            s: options.anim.color.h,
            e: options.anim.color.h_end
        }
        if (this._color_s2) {
            cS.s = options.anim.color.s2 + options.anim.color.s
            // if (h2) cH.s = options.anim.color.h2

        }
        if (this._color_s3) {
            cS.e = options.anim.color.s2 + options.anim.color.s_end
        }


        const curr_h = H.ft(cH.s, cH.e, tp, cH.easeInOutSine)
        const curr_s = H.ft(cS.s, cS.e, tp, cH.easeInOutSine)

        let color = this.setColor(curr_h, options.anim.color.l, curr_s)

        this.light.material.color.set(color)
    }

    setColor(h, l, s) {
        this.color = { h: h, l: l, s: s }
        return this.mesh.material.color.setHSL(this.color.h, this.color.l, this.color.s);
    }

    setPreparation(pc_anim) {
        const curr_h = H.ft(
            this.color.h,
            options.anim.color.h,
            pc_anim, H.easeOutSine)
        const curr_s = H.ft(
            this.color.s,
            options.anim.color.s,
            pc_anim, H.easeOutSine)

        this.mesh.material.color.setHSL(curr_h, this.color.l, curr_s);
    }

    setLightParam(pos, radius) {
        this.light.visible = true
        this.sector.visible = false
        // this.light.material.color.set(0x77bbff)

        const pl_light = this.lenghtToPos * pos;

        let normal = this.normalToPos.clone()
        const new_pos_light = this.diceCentr.clone().add(normal.multiplyScalar(-pl_light));

        this.light.scale.set(radius, radius, radius)
        this.light.position.copy(new_pos_light);
        this.light.updateMatrixWorld();

    }
}