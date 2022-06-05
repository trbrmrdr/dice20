
import * as THREE from './libs/three.js/build/three.module.js';
import { UnrealBloomPass } from './libs/three.js/examples/jsm/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from './libs/three.js/examples/jsm/postprocessing/EffectComposer.js';

const ENTIRE_SCENE = 0, BLOOM_SCENE = 1;


export class Bloom {


    constructor(cs) {
        this.bloomLayer = new THREE.Layers();
        this.bloomLayer.set(BLOOM_SCENE);
        this.darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
        this.materials = {};
    }


    //todo установить занчение как на экране - и пересоздать после изменения размера экрана
    initEffect(width, height, renderModel, renderer, strength, radius) {
        this.strength = strength
        this.radius = radius
        this.renderModel = renderModel
        this.renderer = renderer

        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), strength, radius, 0);
        // bloomPass.clearColor = new THREE.Color(0x123FA3)

        this.bloomComposer = new EffectComposer(renderer);
        this.bloomComposer.renderToScreen = false;
        this.bloomComposer.addPass(renderModel);
        this.bloomComposer.addPass(this.bloomPass);

        this.texture = this.bloomComposer.renderTarget2.texture
    }

    setOptions(strength, radius) {
        this.strength = strength
        this.radius = radius
        this.bloomPass.strength = strength;
        this.bloomPass.radius = radius;
    }

    resize(width, height) {
        this.bloomPass.dispose()

        this.initEffect(width, height, this.renderModel, this.renderer, this.strength, this.radius)
    }


    render(scene) {
        scene.traverse((obj) => { this.darkenNonBloomed(obj) });
        this.bloomComposer.render();
        scene.traverse((obj) => { this.restoreMaterial(obj) });
    }

    enable(mesh) {
        //перед установкой материала всем цифрами - из примера
        // scene.traverse(disposeMaterial);
        mesh.layers.enable(BLOOM_SCENE);
    };

    darkenNonBloomed(obj) {
        if (obj.isMesh && this.bloomLayer.test(obj.layers) === false) {
            // console.log(obj.name)
            this.materials[obj.uuid] = obj.material;
            obj.material = this.darkMaterial;
        }
    }

    disposeMaterial(obj) {
        if (obj.material) {
            obj.material.dispose();
        }
    }

    restoreMaterial(obj) {
        if (this.materials[obj.uuid]) {
            obj.material = this.materials[obj.uuid];
            delete this.materials[obj.uuid];
        }
    }
}