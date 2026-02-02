import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Question } from '../types';

interface CalculusVisualizerProps {
  question: Question;
  onSubmit: (answer: string) => void;
  answerStatus: 'unanswered' | 'correct' | 'incorrect';
}

// --- CONSTANTS & HELPERS ---
const VIEWBOX_SIZE = 400;
const X_RANGE = [-10, 10];
const Y_RANGE = [-10, 10];
const NUM_STEPS = 200; // for drawing curve

const toSvgCoords = (p: { x: number; y: number }) => {
    const x = ((p.x - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0])) * VIEWBOX_SIZE;
    const y = VIEWBOX_SIZE - (((p.y - Y_RANGE[0]) / (Y_RANGE[1] - Y_RANGE[0])) * VIEWBOX_SIZE);
    return { x, y };
};
const toGraphCoords = (p: { x: number; y: number }) => {
    const x = (p.x / VIEWBOX_SIZE) * (X_RANGE[1] - X_RANGE[0]) + X_RANGE[0];
    const y = ((VIEWBOX_SIZE - p.y) / VIEWBOX_SIZE) * (Y_RANGE[1] - Y_RANGE[0]) + Y_RANGE[0];
    return { x, y };
}

const safeEval = (fnStr: string): ((x: number) => number) => {
    try {
        const body = fnStr.includes('return') ? fnStr : `return ${fnStr}`;
        // Allow Math functions
        const func = new Function('x', `with(Math) { ${body} }`);
        return (x: number) => {
            const result = func(x);
            return isFinite(result) ? result : NaN;
        };
    } catch (e) {
        console.error("Function parsing error:", e);
        return () => NaN;
    }
}

const getDerivative = (fn: (x: number) => number, x: number) => {
    const h = 0.0001;
    return (fn(x + h) - fn(x - h)) / (2 * h);
};

const Grid: React.FC = React.memo(() => (
    <>
        <defs>
            <pattern id="calc_grid_major" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(203, 213, 225, 0.7)" strokeWidth="1"/>
            </pattern>
            <pattern id="calc_grid_minor" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(203, 213, 225, 0.4)" strokeWidth="0.5"/>
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#calc_grid_minor)" />
        <rect width="100%" height="100%" fill="url(#calc_grid_major)" />
        {/* Axes */}
        <line {...toSvgCoords({ x: X_RANGE[0], y: 0 })} {...toSvgCoords({ x: X_RANGE[1], y: 0 })} stroke="#64748b" strokeWidth="2" />
        <line {...toSvgCoords({ x: 0, y: Y_RANGE[0] })} {...toSvgCoords({ x: 0, y: Y_RANGE[1] })} stroke="#64748b" strokeWidth="2" />
    </>
));

// --- MAIN COMPONENT ---
const CalculusVisualizer: React.FC<CalculusVisualizerProps> = ({ question, onSubmit, answerStatus }) => {
    const { initialState, questionText } = question;
    const task = initialState?.calculusTask;
    const fnStr = initialState?.functionString || 'x';
    const svgRef = useRef<SVGSVGElement>(null);
    
    const [func, setFunc] = useState<(x: number) => number>(() => () => NaN);
    const [curvePath, setCurvePath] = useState("");

    // --- State for Derivative Task ---
    const [tangentX, setTangentX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // --- State for Integral Task ---
    const [integralAnswer, setIntegralAnswer] = useState("");

    useEffect(() => {
        const parsedFunc = safeEval(fnStr);
        setFunc(() => parsedFunc);

        let path = "M";
        for (let i = 0; i <= NUM_STEPS; i++) {
            const x = X_RANGE[0] + (i / NUM_STEPS) * (X_RANGE[1] - X_RANGE[0]);
            const y = parsedFunc(x);
            if (!isNaN(y)) {
                const { x: sx, y: sy } = toSvgCoords({ x, y });
                path += `${sx},${sy} `;
            }
        }
        setCurvePath(path);

        // Initialize task-specific state
        if (task === 'DERIVATIVE') setTangentX(0);
        if (task === 'INTEGRAL') setIntegralAnswer("");

    }, [fnStr, task]);
    
    const tangentData = useMemo(() => {
        if (task !== 'DERIVATIVE' || isNaN(func(tangentX))) return null;
        const y = func(tangentX);
        const slope = getDerivative(func, tangentX);
        const y_intercept = y - slope * tangentX;
        
        const startX = X_RANGE[0];
        const endX = X_RANGE[1];
        const startY = slope * startX + y_intercept;
        const endY = slope * endX + y_intercept;

        return {
            point: { x: tangentX, y },
            slope,
            line: { p1: { x: startX, y: startY }, p2: { x: endX, y: endY } }
        };
    }, [task, tangentX, func]);

    const integralPath = useMemo(() => {
        if (task !== 'INTEGRAL' || !initialState?.integralRange) return "";
        const [start, end] = initialState.integralRange;
        const STEPS = 50;
        let path = `M ${toSvgCoords({x: start, y: 0}).x} ${toSvgCoords({x: start, y: 0}).y} `;
        for (let i = 0; i <= STEPS; i++) {
            const x = start + (i / STEPS) * (end - start);
            const y = func(x);
            const { x: sx, y: sy } = toSvgCoords({ x, y });
            path += `L ${sx} ${sy} `;
        }
        path += `L ${toSvgCoords({x: end, y: 0}).x} ${toSvgCoords({x: end, y: 0}).y} Z`;
        return path;
    }, [task, initialState?.integralRange, func]);

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!isDragging || !svgRef.current) return;
        const pt = svgRef.current.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgXY = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
        const graphX = toGraphCoords(svgXY).x;
        setTangentX(graphX);
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleSubmit = () => {
        let answer = "";
        if (task === 'DERIVATIVE' && tangentData) {
            answer = tangentData.point.x.toFixed(1);
        } else if (task === 'INTEGRAL') {
            answer = integralAnswer;
        }
        onSubmit(answer);
    };
    
    const disabled = answerStatus !== 'unanswered';

    return (
        <div className="p-4 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-2 text-slate-800 text-center">{questionText}</h2>
            <p className="font-mono text-blue-600 mb-4">f(x) = {fnStr}</p>
            
            <svg ref={svgRef} viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} className="w-full max-w-md bg-white border-2 border-slate-300 rounded-lg shadow-inner" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                <Grid />
                <path d={curvePath} fill="none" stroke="#3b82f6" strokeWidth="3" />

                {task === 'INTEGRAL' && <path d={integralPath} fill="#3b82f6" fillOpacity="0.3" />}

                {task === 'DERIVATIVE' && tangentData && (
                    <g>
                        <line {...toSvgCoords(tangentData.line.p1)} {...toSvgCoords(tangentData.line.p2)} stroke="#ef4444" strokeWidth="2" strokeDasharray="4" />
                        <circle {...toSvgCoords(tangentData.point)} r="6" fill="#ef4444" onMouseDown={() => !disabled && setIsDragging(true)} className={disabled ? "cursor-not-allowed" : "cursor-grab"} />
                    </g>
                )}
            </svg>
            
            <div className="w-full max-w-md mt-4">
                {task === 'DERIVATIVE' && tangentData && (
                    <div className="p-2 bg-slate-100 rounded-md font-mono text-center">
                        Slope at x={tangentData.point.x.toFixed(2)} is {tangentData.slope.toFixed(2)}
                    </div>
                )}
                {task === 'INTEGRAL' && (
                     <input type="number" value={integralAnswer} onChange={e => setIntegralAnswer(e.target.value)} placeholder="Enter the area" disabled={disabled} className="w-full px-3 py-2 border border-slate-300 rounded-md text-center" />
                )}

                {answerStatus === 'unanswered' && (
                    <button onClick={handleSubmit} className="mt-4 w-full bg-blue-500 text-white font-bold py-3 rounded-xl text-lg hover:bg-blue-600 disabled:bg-slate-300">Check</button>
                )}
            </div>
        </div>
    );
};

export default CalculusVisualizer;