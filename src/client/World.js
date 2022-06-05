import * as THREE from './libs/three.js/build/three.module.js';
import * as S from './saves.js'
import { OrbitControls } from './libs/three.js/examples/jsm/controls/OrbitControls.js'

var CANVAS_SIZE = {
    width: 1024,
    height: 1024,
}
// const raycaster = new THREE.Raycaster();

export class World {

    constructor(cs) {
        CANVAS_SIZE = cs
    }

    createRenderer(div) {

        this.div_canvas = div;
        this.div_canvas.style.touchAction = 'none';
        this.div_canvas.addEventListener('pointermove', (evt) => { this.onPointerMove(evt) });
        this.div_canvas.addEventListener('pointerdown', (evt) => { this.onPointerDown(evt) });
        this.div_canvas.addEventListener('pointerup', (evt) => { this.onPointerUp(evt) });

        //____________________________
        this.renderer = new THREE.WebGLRenderer({
            antialias: true, alpha: true
        });
        // renderer.setClearColor(options.global.background);
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(CANVAS_SIZE.width, CANVAS_SIZE.height);
        this.renderer.autoClear = false;
        this.renderer.sortObjects = true;
        // renderer.shadowMap.enabled = true;

        this.div_canvas.appendChild(this.renderer.domElement)

        this.camera = new THREE.PerspectiveCamera(45, CANVAS_SIZE.width / CANVAS_SIZE.height, 1, 200);

        //узнаём реальные размеры canvas
        this.onWindowResize()
        return { renderer: this.renderer, camera: this.camera };
    }

    windowResizeCb = (width, height) => {

    }

    attachWindowResizer() {
        window.addEventListener('resize', () => { this.onWindowResize() });
        this.onWindowResize();
    }

    canvasSize = { width: 0, height: 0 };
    onWindowResize() {
        let new_width = this.div_canvas.clientWidth
        let new_height = new_width / CANVAS_SIZE.width * CANVAS_SIZE.height;

        if (this.div_canvas.clientWidth < this.div_canvas.clientHeight) {
        }
        if (this.canvasSize.width == new_width && this.canvasSize.height == new_height) return;
        this.canvasSize = { width: new_width, height: new_height };


        console.log(new_width, new_height)

        this.renderer.setSize(new_width, new_height);

        this.camera.aspect = new_width / new_height;
        this.camera.updateProjectionMatrix();


        this.windowResizeCb(new_width, new_height)
        // raysParam.rtOcl.setSize(new_width, new_height)
        // raysParam.rtFinal.setSize(new_width, new_height)
    }


    mouseDown = false
    mouseX = 0
    mouseY = 0
    mouse = new THREE.Vector2()
    onPointerDown(evt) {
        evt.preventDefault();

        this.mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = - (evt.clientY / window.innerHeight) * 2 + 1;

        // raycaster.setFromCamera(mouse, camera);
        // const intersects = raycaster.intersectObjects(scene.children, false);
        // if (intersects.length > 0) {
        // 	const object = intersects[0].object;
        // 	mBloomObj.enable(object)
        // }

        this.mouseDown = evt.button == 0;
        this.mouseX = evt.clientX;
        this.mouseY = evt.clientY;
    }

    rotateScene = (x, y) => { }
    onPointerMove(evt) {
        if (!this.mouseDown) return
        evt.preventDefault();

        var deltaX = evt.clientX - this.mouseX,
            deltaY = evt.clientY - this.mouseY;
        this.mouseX = evt.clientX;
        this.mouseY = evt.clientY;
        this.rotateScene(deltaX, deltaY);
    }

    onPointerUp(evt) {
        evt.preventDefault();
        this.mouseDown = false;
    }

    createControl() {

        // const grid = new THREE.GridHelper(100, 100, 0x000000, 0x000000);
        // scene.add(grid);

        this.camera.position.set(
            S.Get('px', -0.027),
            S.Get('py', 1.723),
            S.Get('pz', 1.927));
        // camera.position.set(-0.06, 3.721, 4.16);

        //____________________________
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        controls.enableRotate = false;
        controls.update();

        controls.addEventListener('change', () => {
            S.Set('px', this.camera.position.x);
            S.Set('py', this.camera.position.y);
            S.Set('pz', this.camera.position.z);
        });
    }
}
