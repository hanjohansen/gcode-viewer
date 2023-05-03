import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ArcSegment, ColorOptions, LineSegment } from "./types";
import { PreviewCursor } from "./PreviewCursor";
import { PreviewHelpers } from "./PreviewHelpers";
import { PreviewLines } from "./PreviewLines";

interface PreviewParams {
    canvas: HTMLCanvasElement,
    colorOptions?: ColorOptions,
    showTravel: boolean
}

class PreviewRenderer {
    canvas: HTMLCanvasElement;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls
    controlsCursor: PreviewCursor;
    scene: THREE.Scene;
    sceneGroup: THREE.Group;
    gcodeGroup: PreviewLines;
    camera: THREE.PerspectiveCamera;
    defaultBackgroundColor = 0xe0e0e0;

    constructor(params: PreviewParams) {
        console.info('Initializing gcode preview (THREE r' + THREE.REVISION + ')');
        this.canvas = params.canvas;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(params.colorOptions?.backgroundColor ?? this.defaultBackgroundColor);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            preserveDrawingBuffer: true
        });

        this.camera = new THREE.PerspectiveCamera(60, this.canvas.width / this.canvas.height, 10, 5000);
        this.camera.position.set(0, 450, 450);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.addEventListener('change', (e: any) => this.reportCameraChange(e));

        const fogFar = (this.camera as THREE.PerspectiveCamera).far;
        const fogNear = fogFar * 0.8;
        this.scene.fog = new THREE.Fog(this.scene.background, fogNear, fogFar);

        //visuals        
        this.sceneGroup = new THREE.Group();
        this.sceneGroup.add(new PreviewHelpers());
        this.scene.add(this.camera);

        this.gcodeGroup = new PreviewLines(params.colorOptions?.travelColor, params.colorOptions?.toolColor);
        this.sceneGroup.add(this.gcodeGroup);

        this.sceneGroup.rotateX(-1.5708)
        this.sceneGroup.position.setX(-250);
        this.sceneGroup.position.setZ(250);

        this.scene.add(this.sceneGroup)

        this.controlsCursor = new PreviewCursor(this.camera);
        this.scene.add(this.controlsCursor);

        console.info('init done');

        this.resize();
        this.animate();
    }

    clearElements(): void{
        this.gcodeGroup.clearElements();
        this.animate();
    }

    addElements(lines: LineSegment[], arcs: ArcSegment[]): void {
        this.gcodeGroup.update(lines, arcs);
        this.animate();
    }
    
    changeColors(colors: ColorOptions){
        this.scene.background = new THREE.Color(colors.backgroundColor ?? this.defaultBackgroundColor);
        this.gcodeGroup.changeColors(colors);
        this.animate();
    }

    toggleTravelVisibility(show: boolean){
        this.gcodeGroup.toggleTravelVisibility(show);
        this.animate();
    }

    setCurrentLine(currentLine?: number){
        this.gcodeGroup.updateVisibleLines(currentLine);
        this.animate();
    }

    private animate(): void {
        this.renderer.render(this.scene, this.camera);
    }

    resize(): void {
        const [w, h] = [this.canvas.width, this.canvas.height];
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(w, h, false);

        this.animate();
    }

    private reportCameraChange(e:any):void{
        
        if(e){
            this.controls.target.set(this.controls.target.x,0, this.controls.target.z);
            this.controlsCursor.updateCursor(this.controls.target.x,0, this.controls.target.z);
        }
        this.animate();
    }
}

export { PreviewRenderer }