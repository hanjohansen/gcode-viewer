import * as THREE from "three";

class PreviewCursor extends THREE.Group{
    target: THREE.Object3D
    initDist: number

    constructor(target: THREE.Object3D){
        super();
        this.target = target;
        this.initDist = this.position.distanceTo(target.position); 

        const red = 0xff0000;
        const green = 0x20da00;
        const blue = 0x2348ff;

        const innerGroup = new THREE.Group();
        
        const redDonut = this.initTorus(red);
        redDonut.rotateY(1.5708);

        const greenDonut = this.initTorus(green);
        greenDonut.rotateX(1.5708);

        const blueDonut = this.initTorus(blue);
        blueDonut.rotateZ(1.5708);

        innerGroup.add(redDonut);
        innerGroup.add(greenDonut);
        innerGroup.add(blueDonut);

        innerGroup.rotateX(1.5708)

        this.add(innerGroup);
    }

    private initTorus(color: number): THREE.Mesh{
        const geometry = new THREE.TorusGeometry( 7, .3, 20, 100 );
        const material = new THREE.MeshBasicMaterial( { color: color} );
        return new THREE.Mesh( geometry, material );
    }

    updateCursor(x: number, y: number, z: number): void {
        this.position.set(x, 0, z);

        const nowDist = this.position.distanceTo(this.target.position); 
        var distFactor = nowDist / this.initDist;

        this.scale.set(distFactor, distFactor, distFactor);
    }
}

export {PreviewCursor}