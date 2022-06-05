import * as THREE from './libs/three.js/build/three.module.js';

export class GoodRay {

    renderTargetParameters = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        stencilBufer: false
    };
    constructor() { }

    init(width, height) {

        this.rtFinal = new THREE.WebGLRenderTarget(width, height, this.renderTargetParameters)
        this.rtOcl = new THREE.WebGLRenderTarget(width, height, this.renderTargetParameters)

    }
}