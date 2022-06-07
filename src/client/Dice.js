
import * as THREE from './libs/three.js/build/three.module.js';
import * as H from './helper.js'
import { Number } from "./Number.js"
export class Dice {

    groupLight = new THREE.Group()
    groupOcl = new THREE.Group()
    groupNOcl = new THREE.Group()
    group = new THREE.Group()

    constructor() {
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

        this.groupOcl.add(light, obj_n_sector);


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


    old_angle = null
    rotate(x, y, z) {
        this.oldEuler = new THREE.Euler(x, y, z)

        // this.group.rotateOnAxis
        this.group.setRotationFromEuler(this.oldEuler)
        this.groupOcl.setRotationFromEuler(this.oldEuler)
    }

    resetAngle() {
        // this.group.rotation.set(0, 0, 0);
        // this.groupOcl.rotation.set(0, 0, 0);
    }

    rotateLight(delta, elapsed) {
        const rotateX = delta / H.sinft(5, 10, elapsed) * Math.PI * 2;
        const rotateY = delta / H.sinft(5, 7, elapsed) * Math.PI * 2;
        const rotateZ = (delta / 3) * Math.PI * 2;
        // group_rotate(diceOBJ.group, rotateX, rotateY, rotateZ);
        // group_rotate(diceOBJ.groupOcl, rotateX, rotateY, rotateZ)
        H.group_rotate(this.groupLight, rotateX, rotateY, rotateZ)
    }

}