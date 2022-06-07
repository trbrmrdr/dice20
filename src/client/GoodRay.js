import * as THREE from './libs/three.js/build/three.module.js';
import { ShaderPass } from './libs/three.js/examples/jsm/postprocessing/ShaderPass.js';
import * as Shaders from './libs/shaders.js'
import { EffectComposer } from './libs/three.js/examples/jsm/postprocessing/EffectComposer.js';

import { GodRaysFakeSunShader, GodRaysDepthMaskShader, GodRaysCombineShader, GodRaysGenerateShader } from './libs/three.js/examples/jsm/shaders/GodRaysShader.js';
import { BokehShader, BokehDepthShader } from './libs/three.js/examples/jsm/shaders/BokehShader2.js';

export class GoodRay {

    renderTargetParameters = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        stencilBufer: false
    };

    constructor() { }

    init(width, height, renderer, renderModel, renderModelOcl) {
        this.renderer = renderer
        this.renderModel = renderModel
        this.renderModelOcl = renderModelOcl

        this.rtFinal = new THREE.WebGLRenderTarget(width, height, this.renderTargetParameters)
        this.rtOcl = new THREE.WebGLRenderTarget(width, height, this.renderTargetParameters)


        this.effectFXAA = new ShaderPass(Shaders.ShaderExtras.fxaa);
        this.effectFXAA.uniforms['tDiffuse'].value = 0.5
        this.effectFXAA.uniforms['resolution'].value.set(1 / width, 1 / height);

        this.hblur = new ShaderPass(Shaders.ShaderExtras["horizontalBlur"]);
        this.vblur = new ShaderPass(Shaders.ShaderExtras["verticalBlur"]);
        // hblur.renderToScreen= true;
        // vblur.renderToScreen = true;

        const bluriness = 2;

        this.hblur.uniforms['h'].value = bluriness / width * 2;
        this.vblur.uniforms['v'].value = bluriness / height * 2;


        this.grPass = new ShaderPass(Shaders.ShaderExtras.Godrays);
        this.grPass.uniforms.fExposure.value = 0.58;
        this.grPass.uniforms.fDecay.value = 0.98;
        this.grPass.uniforms.fDensity.value = 0.59;
        this.grPass.uniforms.fWeight.value = 0.21;
        this.grPass.uniforms.fClamp.value = 1.0;
        // grPass.needsSwap = true;
        // grPass.renderToScreen = true;

        this.oclcomposer = new EffectComposer(renderer, this.rtOcl);

        this.oclcomposer.addPass(renderModelOcl);
        this.oclcomposer.addPass(this.hblur);
        this.oclcomposer.addPass(this.vblur);

        this.oclcomposer.addPass(this.grPass);
        this.oclcomposer.addPass(this.hblur);
        this.oclcomposer.addPass(this.vblur);


        //test fCoeff 
        this.additivePass = new ShaderPass(Shaders.ShaderExtras.Additive);
        this.additivePass.uniforms.tAdd.value = this.rtOcl.texture;
        // additivePass.needsSwap = true;
        // additivePass.renderToScreen = true;


        this.finalcomposer = new EffectComposer(renderer, this.rtFinal);

        this.finalcomposer.addPass(renderModel);
        this.finalcomposer.addPass(this.effectFXAA);
        this.finalcomposer.addPass(this.additivePass);

        // finalcomposer.renderToScreen = false;

    }

    setBloomTexture(texture) {
        this.additivePass.uniforms.tAddBloom.value = texture;
    }

    resize(width, height) {
        this.rtFinal.setSize(width, height)
        this.rtOcl.setSize(width, height)
        this.effectFXAA.uniforms['resolution'].value.set(1 / width, 1 / height);
    }

    render(enableGodRay) {
        if (enableGodRay) {
            this.oclcomposer.render();
        }
        this.finalcomposer.render();
    }
}