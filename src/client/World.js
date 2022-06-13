import * as THREE from './libs/three.js/build/three.module.js';
import * as S from './saves.js'
import { OrbitControls } from './libs/three.js/examples/jsm/controls/OrbitControls.js'

var CANVAS_SIZE = {
    width: 1024,
    height: 1024,
}
// const raycaster = new THREE.Raycaster();

export class World {

    constructor() {
    }

    createRenderer(div) {

        this.div_canvas = div;
        this.div_canvas.style.touchAction = 'none';
        this.div_canvas.addEventListener('pointermove', (evt) => { this.onPointerMove(evt) });
        this.div_canvas.addEventListener('pointerdown', (evt) => { this.onPointerDown(evt) });
        this.div_canvas.addEventListener('pointerup', (evt) => { this.onPointerUp(evt) });
        window.addEventListener('keydown', (evt) => { this.onKey(evt, true) });
        window.addEventListener('keyup', (evt) => { this.onKey(evt, false) });

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


        // console.log(new_width, new_height)

        this.renderer.setSize(new_width, new_height);

        this.camera.aspect = new_width / new_height;
        this.camera.updateProjectionMatrix();


        this.windowResizeCb(new_width, new_height)
        // raysParam.rtOcl.setSize(new_width, new_height)
        // raysParam.rtFinal.setSize(new_width, new_height)
    }


    mouseDown = -1
    hasShift = false
    mouseX = 0
    mouseY = 0
    mouse = new THREE.Vector2()

    onKey(evt, down) {
        if (evt.key == 'Shift') {
            this.hasShift = down
        }
    }

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

        if (evt.button == 0) {
            this.mouseDown = 1;
        }
        this.mouseX = evt.clientX;
        this.mouseY = evt.clientY;
    }

    dragMouse = (dx, dy, dz) => { }
    onPointerMove(evt) {
        if (this.mouseDown <= 0) return

        evt.preventDefault();

        var deltaX = evt.clientX - this.mouseX,
            deltaY = evt.clientY - this.mouseY;
        this.mouseX = evt.clientX;
        this.mouseY = evt.clientY;
        if (this.hasShift && this.mouseDown == 1) {
            this.dragMouse(0, 0, deltaX);
        }
        else if (this.mouseDown == 1) {
            this.dragMouse(deltaX, deltaY, 0);
        }
    }

    onPointerUp(evt) {
        evt.preventDefault();
        this.mouseDown = -1;
    }

    controls = null
    controllChange = (camera) => { }
    setPosCamera(op) {

        // const grid = new THREE.GridHelper(100, 100, 0x000000, 0x000000);
        // scene.add(grid);

        this.camera.position.set(op.px, op.py, op.pz);
        // camera.position.set(-0.06, 3.721, 4.16);

        //____________________________
        if (this.controls) return
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableRotate = false;
        this.controls.update();

        this.controls.addEventListener('change', () => {
            this.controllChange(this.camera)
        });
    }
}
