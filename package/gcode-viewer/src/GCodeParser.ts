import { ArcSegment, LineSegment } from "./types"

type Coordinates = 'Absolute' | 'Relative'
type CommandType = 'Travel' | 'Tool' | 'Modal'
type MovementType = 'Straight' | 'ArcCW' | 'ArcCC' | 'None'

interface gcodeLine {
    g: number[],
    type: CommandType,
    movement: MovementType,
    m: number,
    s: number,
    f: number,
    x: number,
    y: number,
    z: number,
    i: number,
    j: number
}

interface ParseState {
    currentLine: number
    coordinates: Coordinates,
    movementType: CommandType,
    x: number,
    y: number,
    z: number
}

class GCodeParser {
    state: ParseState

    constructor() {
        this.state = { currentLine: 1, coordinates: 'Absolute', movementType: 'Travel', x: 0, y: 0, z: 0 }
    }

    clear(): void {
        this.state = { currentLine: 1, coordinates: 'Absolute', movementType: 'Travel', x: 0, y: 0, z: 0 }
    }

    parse(gcode: string[]): { lines: LineSegment[], arcs: ArcSegment[], parsed: number } {
        var currentSegment: LineSegment | undefined;
        const thisPassLines: LineSegment[] = [];
        const thisPassArcs: ArcSegment[] = [];

        for (var index in gcode) {
            const currentLine = gcode[index];

            const lineIndex = this.state.currentLine;

            var parsedLine = this.parseLine(currentLine);

            if (parsedLine.movement === 'Straight') {

                if (!currentSegment) {
                    currentSegment = { index: lineIndex, lineType: parsedLine.type, indecies: [] } as LineSegment;
                    currentSegment.indecies.push({ x: this.state.x, y: this.state.y, z: this.state.z });
                    thisPassLines.push(currentSegment);
                    this.state.currentLine++;
                } else {
                    if (this.state.movementType !== parsedLine.type
                        && parsedLine.type !== 'Modal') {
                        currentSegment = { index: lineIndex, lineType: parsedLine.type, indecies: [] } as LineSegment;
                        currentSegment.indecies.push({ x: this.state.x, y: this.state.y, z: this.state.z });
                        thisPassLines.push(currentSegment);
                        this.state.currentLine++;
                    }
                }

                currentSegment.indecies.push({ x: parsedLine.x, y: parsedLine.y, z: parsedLine.z });
                this.state.movementType = parsedLine.type;
                this.state.x = parsedLine.x;
                this.state.y = parsedLine.y;
                this.state.z = parsedLine.z;
            }
            else if (parsedLine.movement === 'ArcCC'
                || parsedLine.movement === 'ArcCW') {
                currentSegment = undefined;

                const newArc = {} as ArcSegment;
                newArc.index = lineIndex;
                newArc.direction = parsedLine.movement === 'ArcCC' ? 'CC' : 'CW';
                newArc.start = { x: this.state.x, y: this.state.y, z: this.state.z }
                newArc.center = { x: parsedLine.i, y: parsedLine.j, z: 0 }
                newArc.end = { x: parsedLine.x, y: parsedLine.y, z: 0 }

                this.state.movementType = parsedLine.type;
                this.state.x = parsedLine.x;
                this.state.y = parsedLine.y;
                
                this.calculateArcCenter(newArc);
                thisPassArcs.push(newArc);
                this.state.currentLine++;
            }

        }

        const parsedLines = this.state.currentLine - 1;
        return { lines: thisPassLines, arcs: thisPassArcs, parsed: parsedLines};
    }

    private parseLine(line: string): gcodeLine {
        const result: gcodeLine = {
            g: [],
            type: "Modal",
            movement: "None",
            m: -1,
            s: -1,
            f: -1,
            x: this.state.x,
            y: this.state.y,
            z: this.state.z,
            i: -1,
            j: -1
        }

        var readable = this.makeLineReadable(line);
        const lineParts = readable.split(';')

        for (var lidx in lineParts) {
            const part = lineParts[lidx];
            const letter = part[0];
            const value = part.substring(1)
            const numValue = Number.parseFloat(value);

            if (letter === 'G') { result.g.push(numValue) }
            if (letter === 'M') { result.m = numValue; }
            if (letter === 'X') { result.x = numValue; }
            if (letter === 'Y') { result.y = numValue; }
            if (letter === 'Z') { result.z = numValue; }
            if (letter === 'I') { result.i = numValue; }
            if (letter === 'J') { result.j = numValue; }
            if (letter === 'F') { result.f = numValue; }
            if (letter === 'S') { result.s = numValue; }
        }

        for (var index in result.g) {
            const g = result.g[index];
            if (g === 0) {
                result.type = 'Travel';
                result.movement = 'Straight'
            }
            if (g === 1) {
                result.type = 'Tool';
                result.movement = 'Straight'
            }
            if (g === 2) {
                result.type = 'Tool';
                result.movement = 'ArcCW'
            }
            if (g === 3) {
                result.type = 'Tool';
                result.movement = 'ArcCC'
            }
        }

        if (result.m !== -1 || result.f !== -1 || result.s !== -1) { result.type = 'Tool' }
        if (result.m === 5) { result.type = 'Travel' }

        return result;
    }

    private makeLineReadable(line: string): string {
        const input = line.trim();
        let inputCleaned = input.replace(/g/gi, ";G")
        inputCleaned = inputCleaned.replace(/x/gi, ";X")
        inputCleaned = inputCleaned.replace(/y/gi, ";Y")
        inputCleaned = inputCleaned.replace(/m/gi, ";M")
        inputCleaned = inputCleaned.replace(/f/gi, ";F")
        inputCleaned = inputCleaned.replace(/s/gi, ";S")
        inputCleaned = inputCleaned.replace(/i/gi, ";I")
        inputCleaned = inputCleaned.replace(/j/gi, ";J")
        inputCleaned = inputCleaned.replace(/r/gi, ";R")

        if (inputCleaned.startsWith(';'))
            inputCleaned = inputCleaned.substring(1);

        return inputCleaned;
    }

    private calculateArcCenter(arc:ArcSegment){
        arc.center.x = arc.start.x + arc.center.x;
        arc.center.y = arc.start.y + arc.center.y;
    }

}

export { GCodeParser }