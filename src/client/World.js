import * as THREE from './libs/three.js/build/three.module.js';
import * as S from './saves.js'
import { OrbitControls } from './libs/three.js/examples/jsm/controls/OrbitControls.js'
import { options } from './options.js'
import { Vector3 } from './libs/three.js/build/three.module.js';

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
        //______________________________
        // const grid = new THREE.GridHelper(100, 100, 0x000000, 0x000000);
        // scene.add(grid);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableRotate = false;
        this.controls.update();

        this.controls.addEventListener('change', () => {
            this.controllChange()
        });
        //______________________________
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

    _hasRotate = options.position.typePos == "Rotate"
    _hasSaveEdit = true

    controllChange = () => {

        if (!this._hasSaveEdit) return

        if (this._hasRotate) {
            options.position.posRotate.x = this.camera.position.x
            options.position.posRotate.y = this.camera.position.y
            options.position.posRotate.z = this.camera.position.z


            options.position.posTRotate.x = this.controls.target.x
            options.position.posTRotate.y = this.controls.target.y
            options.position.posTRotate.z = this.controls.target.z

            // scope.zoom0 = scope.object.zoom;
        } else {
            options.position.posPresent.x = this.camera.position.x
            options.position.posPresent.y = this.camera.position.y
            options.position.posPresent.z = this.camera.position.z

            options.position.posTPresent.x = this.controls.target.x
            options.position.posTPresent.y = this.controls.target.y
            options.position.posTPresent.z = this.controls.target.z
        }


        this.setPosCamera(true)

        // options.position.gp?.updateDisplay()


        //this.controls.update() - только при установке не из каллбека
    }

    updateCamera() {
        this._hasSaveEdit = false
        this.controls.update()
        this._hasSaveEdit = true
    }

    setUpCamera() {
        this.setPosCamera(true)
        this.updateCamera()
    }

    changePosCamera() {
        this.setPosCamera(true)
        this.updateCamera()
    }

    setPosCamera(save) {

        if (this._hasRotate) {
            this.camera.position.copy(options.position.posRotate)
            this.controls.target.copy(options.position.posTRotate)
        } else {
            this.camera.position.copy(options.position.posPresent)
            this.controls.target.copy(options.position.posTPresent)
        }


        options.position.gp?.updateDisplay()
        if (save) {
            // console.log(this.posRotate, this.posPresent)
            S.Set("pos_rot", options.position.posRotate)
            S.Set("pos_t_rot", options.position.posTRotate)

            S.Set("pos_p_rot", options.position.posPresent)
            S.Set("pos_t_p_rot", options.position.posTPresent)
        }
    }

    setAnimCamera(percent) {
        const t_sub = new Vector3().subVectors(options.position.posRotate, options.position.posPresent);
        let length = t_sub.length();
        let normal = t_sub.normalize();

        const new_pos = options.position.posPresent.clone().add(normal.multiplyScalar(length * percent));

        this.camera.position.copy(new_pos);
        //__________________-
        const t_sub_t = new Vector3().subVectors(options.position.posTRotate, options.position.posTPresent);
        let length_t = t_sub.length();
        let normal_t = t_sub.normalize();

        const new_pos_target = options.position.posTPresent.clone().add(normal_t.multiplyScalar(length_t * percent));
        this.controls.target.copy(new_pos_target)

        this.updateCamera()
    }
}
