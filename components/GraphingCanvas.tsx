import React, { useState, useEffect, useMemo } from 'react';
import type { Question } from '../types';

interface GraphingCanvasProps {
  question: Question;
  onSubmit: (answer: string) => void;
  answerStatus: 'unanswered' | 'correct' | 'incorrect';
  selectedAnswer: string | null;
}

const VIEWBOX_SIZE = 400;
const GRID_RANGE = 10;
const STEP = VIEWBOX_SIZE / (GRID_RANGE * 2);

// Converts graph coordinates to SVG coordinates
const toSvgCoords = ({ x, y }: { x: number; y: number }) => ({
  x: x * STEP + VIEWBOX_SIZE / 2,
  y: -y * STEP + VIEWBOX_SIZE / 2,
});

// Converts SVG coordinates to graph coordinates
const toGraphCoords = ({ x, y }: { x: number; y: number }) => ({
  x: Math.round((x - VIEWBOX_SIZE / 2) / STEP),
  y: Math.round(-(y - VIEWBOX_SIZE / 2) / STEP),
});

const GraphingCanvas: React.FC<GraphingCanvasProps> = ({ question, onSubmit, answerStatus }) => {
  const [mode, setMode] = useState<'line' | 'point' | 'unknown'>('unknown');
  
  // State for line mode
  const [slope, setSlope] = useState(1);
  const [yIntercept, setYIntercept] = useState(0);

  // State for point mode
  const [point, setPoint] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    const { initialState } = question;
    if (initialState?.equation) {
      setMode('line');
      // Simple parser for y = mx + b
      const match = initialState.equation.match(/y\s*=\s*(-?\d*\.?\d*)x\s*([+\-]\s*\d+\.?\d*)/);
      if (match) {
        setSlope(match[1] === '-' ? -1 : parseFloat(match[1] || '1'));
        setYIntercept(parseFloat(match[2].replace(/\s/g, '')));
      } else {
        setSlope(1);
        setYIntercept(0);
      }
    } else if (initialState?.prompt?.toLowerCase().includes('plot the point')) {
      setMode('point');
      setPoint(null);
    } else {
      setMode('unknown');
    }
  }, [question]);

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'point' || answerStatus !== 'unanswered') return;
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const { x, y } = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    setPoint(toGraphCoords({ x, y }));
  };
  
  const handleSubmit = () => {
    if (answerStatus !== 'unanswered') return;
    let answer = '';
    if (mode === 'line') {
      const bSign = yIntercept >= 0 ? '+' : '-';
      answer = `y = ${slope}x ${bSign} ${Math.abs(yIntercept)}`;
    } else if (mode === 'point' && point) {
      answer = `(${point.x}, ${point.y})`;
    }
    onSubmit(answer.replace(/\s/g, ''));
  };

  const linePoints = useMemo(() => {
    if (mode !== 'line') return null;
    const p1 = toSvgCoords({ x: -GRID_RANGE, y: slope * -GRID_RANGE + yIntercept });
    const p2 = toSvgCoords({ x: GRID_RANGE, y: slope * GRID_RANGE + yIntercept });
    return { p1, p2 };
  }, [slope, yIntercept, mode]);
  
  const disabled = answerStatus !== 'unanswered';

  if (mode === 'unknown') {
    return <div className="p-6">Error: Invalid math interaction setup.</div>;
  }

  return (
    <div className="p-6 flex flex-col items-center">
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-slate-800 text-center">{question.questionText}</h2>

      <svg viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} className="w-full max-w-sm bg-white border-2 border-slate-300 rounded-lg shadow-inner cursor-pointer" onClick={handleCanvasClick}>
        {/* Grid */}
        <defs>
          <pattern id="grid" width={STEP} height={STEP} patternUnits="userSpaceOnUse">
            <path d={`M ${STEP} 0 L 0 0 0 ${STEP}`} fill="none" stroke="rgba(203, 213, 225, 0.5)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Axes */}
        <line x1="0" y1={VIEWBOX_SIZE/2} x2={VIEWBOX_SIZE} y2={VIEWBOX_SIZE/2} stroke="#64748b" strokeWidth="2" />
        <line x1={VIEWBOX_SIZE/2} y1="0" x2={VIEWBOX_SIZE/2} y2={VIEWBOX_SIZE} stroke="#64748b" strokeWidth="2" />

        {/* User Interaction Layer */}
        {mode === 'line' && linePoints && (
          <line x1={linePoints.p1.x} y1={linePoints.p1.y} x2={linePoints.p2.x} y2={linePoints.p2.y} stroke="#3b82f6" strokeWidth="4" />
        )}
        {mode === 'point' && point && (
          <circle cx={toSvgCoords(point).x} cy={toSvgCoords(point).y} r="8" fill="#ef4444" />
        )}
      </svg>
      
      {mode === 'line' && (
        <div className="w-full max-w-sm mt-6 space-y-4">
          <div>
            <label htmlFor="slope" className="font-bold text-slate-700">Slope (m): {slope}</label>
            <input type="range" id="slope" min="-5" max="5" step="0.5" value={slope} onChange={e => setSlope(parseFloat(e.target.value))} disabled={disabled} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50" />
          </div>
          <div>
            <label htmlFor="yIntercept" className="font-bold text-slate-700">Y-Intercept (b): {yIntercept}</label>
            <input type="range" id="yIntercept" min="-10" max="10" step="1" value={yIntercept} onChange={e => setYIntercept(parseFloat(e.target.value))} disabled={disabled} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50" />
          </div>
        </div>
      )}

      {mode === 'point' && (
         <p className="mt-4 font-bold text-2xl text-slate-700 h-8">
            {point ? `Selected: (${point.x}, ${point.y})` : 'Click to plot a point'}
         </p>
      )}

      {answerStatus === 'unanswered' && (
        <button 
          onClick={handleSubmit} 
          disabled={mode === 'point' && !point}
          className="mt-6 w-full max-w-sm bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-lg hover:bg-blue-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          Check
        </button>
      )}
    </div>
  );
};

export default GraphingCanvas;