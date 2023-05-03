export type SegmentType = 'Travel' | 'Tool'
export type ArcDirection = 'CW'| 'CC'

export interface Point{
    x: number,
    y: number,
    z: number
}

export interface LineSegment{
    index: number
    lineType: SegmentType
    indecies: Point[]
}

export interface ArcSegment{
    index: number
    direction: ArcDirection
    start: Point
    center:Point
    end:Point
}

export interface ColorOptions{
    travelColor?: number,
    toolColor?: number,
    backgroundColor?: number
}
