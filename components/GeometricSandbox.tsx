import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Question } from '../types';

// --- TYPE DEFINITIONS ---
type Point = { type: 'point'; id: string; x: number; y: number; label?: string; };
type Line = { type: 'line'; id: string; p1Id: string; p2Id: string; };
type Polygon = { type: 'polygon'; id: string; pointIds: string[]; };
type GeoObject = Point | Line | Polygon;

type Tool = 'select' | 'point' | 'line' | 'measure' | 'transform';
type GeometricTask = 'MEASURE_ANGLE' | 'CONSTRUCT_SHAPE' | 'TRANSFORM_SHAPE';

interface GeometricSandboxProps {
  question: Question;
  onSubmit: (answer: string) => void;
  answerStatus: 'unanswered' | 'correct' | 'incorrect';
}

// --- CONSTANTS & HELPERS ---
const VIEWBOX_SIZE = 400;
const GRID_RANGE = 10;
const STEP = VIEWBOX_SIZE / (GRID_RANGE * 2);

const toSvgCoords = (p: { x: number; y: number }) => ({ x: p.x * STEP + VIEWBOX_SIZE / 2, y: -p.y * STEP + VIEWBOX_SIZE / 2 });
const toGraphCoords = (p: { x: number; y: number }) => ({ x: (p.x - VIEWBOX_SIZE / 2) / STEP, y: -(p.y - VIEWBOX_SIZE / 2) / STEP });
const snap = (val: number) => Math.round(val);

const calculateAngle = (p1: Point, p2: Point, p3: Point) => {
    const a = Math.sqrt(Math.pow(p3.x - p2.x, 2) + Math.pow(p3.y - p2.y, 2));
    const b = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    const c = Math.sqrt(Math.pow(p3.x - p1.x, 2) + Math.pow(p3.y - p1.y, 2));
    const angleRad = Math.acos((a * a + b * b - c * c) / (2 * a * b));
    return Math.round(angleRad * 180 / Math.PI);
};

// --- SUB-COMPONENTS ---
const Toolbar: React.FC<{ activeTool: Tool; onSelect: (tool: Tool) => void, disabled: boolean }> = ({ activeTool, onSelect, disabled }) => {
    const tools: { id: Tool, label: string, icon: string }[] = [
        { id: 'point', label: 'Point', icon: '📍' },
        { id: 'line', label: 'Line', icon: '📏' },
        { id: 'measure', label: 'Measure Angle', icon: '📐' },
        { id: 'transform', label: 'Transform', icon: '✨' },
    ];
    return (
        <div className="flex justify-center gap-2 p-2 bg-slate-200 rounded-lg mb-4">
            {tools.map(({ id, label, icon }) => (
                <button
                    key={id}
                    title={label}
                    disabled={disabled}
                    onClick={() => onSelect(id)}
                    className={`px-3 py-2 text-xl rounded-md transition-colors ${activeTool === id ? 'bg-blue-500 text-white' : 'bg-white hover:bg-slate-100'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >{icon}</button>
            ))}
        </div>
    );
};

// --- MAIN COMPONENT ---
const GeometricSandbox: React.FC<GeometricSandboxProps> = ({ question, onSubmit, answerStatus }) => {
    const [task, setTask] = useState<GeometricTask | null>(null);
    const [objects, setObjects] = useState<Record<string, GeoObject>>({});
    const [activeTool, setActiveTool] = useState<Tool>('point');
    const [tempLine, setTempLine] = useState<{ p1Id: string; x2: number; y2: number } | null>(null);
    const [selection, setSelection] = useState<string[]>([]); // Point IDs
    const [measuredAngle, setMeasuredAngle] = useState<number | null>(null);
    const [angleInput, setAngleInput] = useState("");

    // Fix: Use a type guard with an explicit cast to filter objects.
    // The TypeScript compiler inferred the filtered item `o` as `unknown`,
    // preventing access to `o.type`. The type guard correctly types the result.
    const points = useMemo(() => Object.values(objects).filter((o): o is Point => (o as GeoObject).type === 'point'), [objects]);
    const lines = useMemo(() => Object.values(objects).filter((o): o is Line => (o as GeoObject).type === 'line'), [objects]);
    const polygons = useMemo(() => Object.values(objects).filter((o): o is Polygon => (o as GeoObject).type === 'polygon'), [objects]);

    useEffect(() => {
        const initialState = question.initialState;
        setTask(initialState?.geometricTask as GeometricTask);
        const initialObjects = (initialState?.initialObjects as GeoObject[]) || [];
        const objMap: Record<string, GeoObject> = {};
        initialObjects.forEach(obj => objMap[obj.id] = obj);
        setObjects(objMap);
        setSelection([]);
        setMeasuredAngle(null);
        setAngleInput("");
        setActiveTool(initialState?.geometricTask === 'MEASURE_ANGLE' ? 'measure' : 'point');
    }, [question]);
    
    useEffect(() => {
        if (activeTool !== 'measure' || selection.length !== 3) {
             setMeasuredAngle(null);
             return;
        };
        const [p1, p2, p3] = selection.map(id => objects[id] as Point);
        if (p1 && p2 && p3) {
            setMeasuredAngle(calculateAngle(p1, p2, p3));
        }
    }, [selection, activeTool, objects]);
    
    const findPointAt = (coords: { x: number; y: number }): Point | null => {
        return points.find(p => Math.abs(p.x - coords.x) < 0.5 && Math.abs(p.y - coords.y) < 0.5) || null;
    }

    const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (disabled) return;
        const svg = e.currentTarget;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgXY = pt.matrixTransform(svg.getScreenCTM()?.inverse());
        const graphXY = toGraphCoords(svgXY);
        const snappedXY = { x: snap(graphXY.x), y: snap(graphXY.y) };

        const clickedPoint = findPointAt(snappedXY);

        switch (activeTool) {
            case 'point': {
                const id = `p${Date.now()}`;
                const newPoint: Point = { type: 'point', id, ...snappedXY, label: String.fromCharCode(65 + points.length) };
                setObjects(prev => ({ ...prev, [id]: newPoint }));
                break;
            }
            case 'line': {
                if (!clickedPoint) return;
                if (selection.length === 0) {
                    setSelection([clickedPoint.id]);
                } else {
                    const p1Id = selection[0];
                    if (p1Id === clickedPoint.id) return; // Don't draw line to self
                    const id = `l${Date.now()}`;
                    const newLine: Line = { type: 'line', id, p1Id, p2Id: clickedPoint.id };
                    setObjects(prev => ({ ...prev, [id]: newLine }));
                    setSelection([]);
                }
                break;
            }
            case 'measure': {
                if (!clickedPoint) return;
                if (selection.length < 3) {
                    setSelection(prev => [...prev, clickedPoint.id]);
                } else {
                    setSelection([clickedPoint.id]); // Start new selection
                }
                break;
            }
            case 'transform': {
                // Polygon selection logic would go here
                break;
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (disabled || activeTool !== 'line' || selection.length !== 1) {
            setTempLine(null);
            return;
        }
        const svg = e.currentTarget;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgXY = pt.matrixTransform(svg.getScreenCTM()?.inverse());
        const graphXY = toGraphCoords(svgXY);
        setTempLine({ p1Id: selection[0], x2: svgXY.x, y2: svgXY.y });
    };

    const handleSubmit = () => {
        if (disabled) return;
        let answer = "";
        if (task === 'MEASURE_ANGLE') {
            answer = angleInput;
        } else if (task === 'CONSTRUCT_SHAPE' || task === 'TRANSFORM_SHAPE') {
            answer = points.map(p => `(${p.x},${p.y})`).sort().join(',');
        }
        onSubmit(answer);
    };

    const handleTransformation = (type: 'reflectX' | 'reflectY') => {
        const newObjects = { ...objects };
        points.forEach(p => {
            const newPoint = { ...p };
            if (type === 'reflectX') newPoint.y = -p.y;
            if (type === 'reflectY') newPoint.x = -p.x;
            newObjects[p.id] = newPoint;
        });
        setObjects(newObjects);
    };
    
    const disabled = answerStatus !== 'unanswered';

    return (
        <div className="p-4 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-2 text-slate-800 text-center">{question.questionText}</h2>
            <Toolbar activeTool={activeTool} onSelect={setActiveTool} disabled={disabled} />
            
            <svg viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} className="w-full max-w-md bg-white border-2 border-slate-300 rounded-lg shadow-inner cursor-crosshair" onClick={handleCanvasClick} onMouseMove={handleMouseMove}>
                <defs><pattern id="grid" width={STEP} height={STEP} patternUnits="userSpaceOnUse"><path d={`M ${STEP} 0 L 0 0 0 ${STEP}`} fill="none" stroke="rgba(203, 213, 225, 0.5)" strokeWidth="1"/></pattern></defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                <line x1="0" y1={VIEWBOX_SIZE/2} x2={VIEWBOX_SIZE} y2={VIEWBOX_SIZE/2} stroke="#64748b" strokeWidth="2" />
                <line x1={VIEWBOX_SIZE/2} y1="0" x2={VIEWBOX_SIZE/2} y2={VIEWBOX_SIZE} stroke="#64748b" strokeWidth="2" />

                {/* Render objects */}
                {lines.map(line => {
                    const p1 = objects[line.p1Id] as Point;
                    const p2 = objects[line.p2Id] as Point;
                    if (!p1 || !p2) return null;
                    const c1 = toSvgCoords(p1);
                    const c2 = toSvgCoords(p2);
                    return <line key={line.id} x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} stroke="#0ea5e9" strokeWidth="3" />
                })}
                {tempLine && (() => {
                    const p1 = objects[tempLine.p1Id] as Point;
                    if (!p1) return null;
                    const c1 = toSvgCoords(p1);
                    return <line x1={c1.x} y1={c1.y} x2={tempLine.x2} y2={tempLine.y2} stroke="#f59e0b" strokeWidth="2" strokeDasharray="4" />
                })()}
                 {points.map(p => {
                    const {x, y} = toSvgCoords(p);
                    const isSelected = selection.includes(p.id);
                    return <g key={p.id}><circle cx={x} cy={y} r="8" fill={isSelected ? '#f59e0b' : '#3b82f6'} /><text x={x+10} y={y+5} className="font-bold fill-slate-700">{p.label}</text></g>;
                })}
            </svg>

            {/* Task-specific UI */}
            <div className="w-full max-w-md mt-4">
                {task === 'MEASURE_ANGLE' && (
                    <div className="flex items-center gap-2">
                        <input type="text" value={angleInput} onChange={e => setAngleInput(e.target.value)} placeholder="Angle in degrees" disabled={disabled} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                        <div className="p-2 bg-slate-100 rounded-md font-mono text-center min-w-[100px]">
                            {measuredAngle !== null ? `${measuredAngle}°` : '...'}
                        </div>
                    </div>
                )}
                {task === 'TRANSFORM_SHAPE' && (
                    <div className="flex justify-center gap-2">
                        <button onClick={() => handleTransformation('reflectX')} disabled={disabled} className="px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 disabled:bg-slate-300">Reflect X-Axis</button>
                        <button onClick={() => handleTransformation('reflectY')} disabled={disabled} className="px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 disabled:bg-slate-300">Reflect Y-Axis</button>
                    </div>
                )}

                {answerStatus === 'unanswered' && (
                    <button onClick={handleSubmit} className="mt-4 w-full bg-blue-500 text-white font-bold py-3 rounded-xl text-lg hover:bg-blue-600 disabled:bg-slate-300">Check</button>
                )}
            </div>
        </div>
    );
};

export default GeometricSandbox;