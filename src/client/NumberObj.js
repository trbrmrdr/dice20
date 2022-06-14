import * as THREE from './libs/three.js/build/three.module.js';
import * as H from './helper.js'
import { Vector3 } from './libs/three.js/build/three.module.js';
import { options } from './options.js'

export class NumberObj {

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

        this.color = {
            h: options.anim.color.h,
            l: options.anim.color.l,
            s: options.anim.color.s
        }

        //____________________
        meshNumber.material = new THREE.MeshBasicMaterial();
        meshNumber.material.color.setHSL(this.color.h, this.color.l, this.color.s);
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

    dE = 0.1
    setColor(iL, anim_pos) {

        let tp = this.speedF[iL](anim_pos)

        if (this._color_s3 == false) {
            if (this._color_s2 == false && tp >= 1.0 - this.dE) {
                this._color_s2 = true
            }
            if (this._color_s2 == true && tp <= 0 + this.dE) {
                this._color_s3 = true
            }
        }

        let sS = options.anim.color.s
        let sE = options.anim.color.s_end
        if (this._color_s2) {
            sS = options.anim.color.s2 + options.anim.color.s
        }
        if (this._color_s3) {
            sE = options.anim.color.s2 + options.anim.color.s_end
        }


        const curr_h = H.ft(options.anim.color.h, options.anim.color.h_end, tp, H.easeInOutSine)
        const curr_s = H.ft(sS, sE, tp, H.easeInOutSine)

        const color = this.mesh.material.color.setHSL(
            curr_h,
            options.anim.color.l,
            curr_s,
        )

        this.light.material.color.set(color)
    }

    setLightParam(pos, radius) {
        const pl_light = this.lenghtToPos * pos;

        let normal = this.normalToPos.clone()
        const new_pos_light = this.diceCentr.clone().add(normal.multiplyScalar(-pl_light));

        this.light.scale.set(radius, radius, radius)
        this.light.position.copy(new_pos_light);
        this.light.updateMatrixWorld();

    }
}