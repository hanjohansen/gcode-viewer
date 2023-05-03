import * as THREE from "three";

class PreviewHelpers extends THREE.Group{
    constructor(){
        super()

        const axesHelper = new THREE.AxesHelper(500);
        this.add(axesHelper);

        const gridHelper = new THREE.GridHelper(500, 50, 0xAAAAAA, 0xAAAAAA);
        this.add(gridHelper);
        gridHelper.rotateX(1.5708)
        gridHelper.position.setX(250);
        gridHelper.position.setY(250);
        gridHelper.position.setZ(-.1);
    }
}

export {PreviewHelpers}