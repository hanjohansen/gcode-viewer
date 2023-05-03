import { useEffect, useRef, useState } from "react";
import { PreviewRenderer } from "./PreviewRenderer";
import { GCodeParser } from "./GCodeParser";
import { ColorOptions } from "./types";

interface IProps {
    gcode: string[]
    currentLine?: number
    colorOptions?: ColorOptions
    showTravel: boolean
    codeParsed?: (lines: number) => void
}

export const GCodePreview = (props: IProps) => {
    const { gcode, colorOptions, showTravel, codeParsed, currentLine } = props;
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [renderer, setRenderer] = useState<PreviewRenderer | null>(null);
    const [parser, setParser] = useState<GCodeParser>(new GCodeParser());

    const resizePreview = () => {
        renderer?.resize();
    };

    const loadGcodeChunked = async (
        gcode: string[]
    ) => {
        const chunkSize = 1000;
        let c = 0;

        const loadProgressive = async () => {
            const start = c * chunkSize;
            const end = (c + 1) * chunkSize;
            const chunk = gcode.slice(start, end);

            const {lines, arcs, parsed} = parser.parse(chunk);

            if (codeParsed) {
                codeParsed(parsed);
            }
    
            renderer?.addElements(lines, arcs);

            c++;
            if (c * chunkSize < gcode.length) {
                await new Promise(_ => setTimeout(loadProgressive));
            }
        };

        await loadProgressive();
    };


    useEffect(() => {
        setParser(new GCodeParser());
        setRenderer(new PreviewRenderer({
            canvas: canvasRef.current as HTMLCanvasElement,
            colorOptions: colorOptions,
            showTravel: showTravel
        }
        ))
        window.addEventListener('resize', resizePreview);

        return () => {
            window.removeEventListener('resize', resizePreview);
        };
    }, [])

    useEffect(() => {
        parser?.clear();
        renderer?.clearElements();

        if (gcode.length === 0)
            return;

        const asyncLoadChunked = async () => {
            await loadGcodeChunked(gcode)
        }
        
        asyncLoadChunked();
    }, [gcode])

    useEffect(() => {
        if (!colorOptions)
            return;

        renderer?.changeColors(colorOptions);
    }, [colorOptions])

    useEffect(() => {
        renderer?.toggleTravelVisibility(showTravel);
    }, [showTravel])

    useEffect(() => {
        renderer?.setCurrentLine(currentLine);
    }, [currentLine])

    return (
        <div className="gcode-preview">
            <canvas ref={canvasRef} height={"700px"} width={"1000px"}></canvas>
        </div>
    )
}