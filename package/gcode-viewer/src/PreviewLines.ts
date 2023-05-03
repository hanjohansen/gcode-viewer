import * as THREE from "three";
import { ArcSegment, ColorOptions, LineSegment, Point } from "./types";

class PreviewLines extends THREE.Group{
    lines: Map<THREE.Line, number>;
    showTravel: boolean = true;
    travelGroup: THREE.Group
    defaultBackgroundColor = 0xe0e0e0;
    defaultTravelColor = 0x0000ff;
    defaultToolColor = 0xff5722;
    travelColor: THREE.LineBasicMaterial;
    toolColor: THREE.LineBasicMaterial;
    private disposables: { dispose(): void }[] = [];

    constructor(travelColor?: number, toolColor?: number, showTravel?: boolean){
        super();

        this.lines = new Map<THREE.Line, number>();

        if(showTravel !== undefined)
            this.showTravel = showTravel;

        this.travelGroup = new THREE.Group();
        this.travelGroup.visible = this.showTravel;
        this.add(this.travelGroup);

        this.travelColor = 
            new THREE.LineBasicMaterial({color: travelColor ?? this.defaultTravelColor});
        this.toolColor = 
            new THREE.LineBasicMaterial({color: toolColor ?? this.defaultToolColor});
    }

    clearElements(){
        this.lines = new Map<THREE.Line, number>();

        while(this.children.length > 0){
            this.remove(this.children[0])
        }
        while(this.disposables.length > 0){
            const element = this.disposables[this.disposables.length -1];
            this.disposables.pop();
            element.dispose()
        }

        this.travelGroup = new THREE.Group();
        this.travelGroup.visible = this.showTravel;
        this.add(this.travelGroup);
    }

    changeColors(colors: ColorOptions){
        if(colors.toolColor)
            this.toolColor.color.setHex(colors.toolColor);

        if(colors.travelColor)
            this.travelColor.color.setHex(colors.travelColor);
    }

    toggleTravelVisibility(show: boolean){
        this.showTravel = show;
        this.travelGroup.visible = this.showTravel;
    }

    updateVisibleLines(currentLine?: number){
        if(currentLine === undefined){
            currentLine = this.lines.size;
        }

        for(var line of this.lines.keys()){
            const idx = this.lines.get(line);

            if(!idx)
                continue;

            if(idx <= currentLine){
                line.visible = true;
            }else{
                line.visible = false;
            }
        }
    }

    update(lines: LineSegment[], arcs: ArcSegment[]){
        
        for(var index in lines){
            const lineSegement = lines[index];

            const isToolLine = lineSegement.lineType === 'Tool';
            const material = isToolLine ? this.toolColor : this.travelColor;

            const points = lineSegement.indecies.map((x) => new THREE.Vector3(x.x, x.y, x.z));
            const geometry = new THREE.BufferGeometry().setFromPoints(points);

            const line = new THREE.Line(geometry, material);

            this.lines.set(line, lineSegement.index);
            this.disposables.push(geometry);

            if(isToolLine)
                this.add(line);
            else
                this.travelGroup.add(line);
        }

        for(var index in arcs){
            const arcSegemnt = arcs[index];

            const s = arcSegemnt.start;
            const c = arcSegemnt.center;
            const e = arcSegemnt.end;

            const {radius, start, end} = this.getStartAndEndAngles(s,c,e);
            const curve = new THREE.EllipseCurve(
                c.x,  c.y,          // ax, aY
                radius, radius,     // xRadius, yRadius
                start, end,         // aStartAngle, aEndAngle
                arcSegemnt.direction === 'CW',            // aClockwise
                0                   // aRotation
            );

            const curvePts = curve.getPoints( 50 );
            const curveGeo = new THREE.BufferGeometry().setFromPoints( curvePts );
            const curveArc = new THREE.Line( curveGeo, this.toolColor );

            this.lines.set(curveArc, arcSegemnt.index);
            this.disposables.push(curveGeo);
            this.add(curveArc);
        }

        this.updateVisibleLines();
    }

    private getStartAndEndAngles(s:Point, c:Point, e:Point): {radius:number, start:number, end:number}{
        const s_norm: Point = {
            x: s.x - c.x,
            y: s.y - c.y,
            z: s.z - c.z
        }
        const e_norm: Point = {
            x: e.x - c.x,
            y: e.y - c.y,
            z: e.z - c.z
        }

        let x = s_norm.x;
        let y = s_norm.y;
        
        const radius = Math.sqrt(x * x + y * y);

        const start = Math.atan2(s_norm.y, s_norm.x);
        const end = Math.atan2(e_norm.y, e_norm.x);

        return {radius, start, end};
    }

}

export{PreviewLines}