import React, { useState, useEffect, useMemo } from 'react';
import type { Question } from '../types';

declare const confetti: any;

interface EquationBalancerProps {
  question: Question;
  onSubmit: (answer: string) => void;
  answerStatus: 'unanswered' | 'correct' | 'incorrect';
  selectedAnswer: string | null;
}

type ParsedSide = { x: number; constant: number };

const parseSide = (sideStr: string): ParsedSide => {
    let x = 0;
    let constant = 0;
    if (!sideStr) return { x, constant };

    const terms = sideStr.replace(/\s/g, '').replace(/\-/g, '+-').split('+').filter(Boolean);
    
    terms.forEach(term => {
        if (term.toLowerCase().includes('x')) {
            if (term === 'x') x += 1;
            else if (term === '-x') x -= 1;
            else x += parseFloat(term.replace('x', ''));
        } else {
            constant += parseFloat(term);
        }
    });
    return { x, constant };
};

const formatTerm = (value: number, isVariable: boolean, isFirst: boolean) => {
    if (value === 0) return null;
    const sign = isFirst ? (value < 0 ? '-' : '') : (value < 0 ? ' - ' : ' + ');
    const absValue = Math.abs(value);
    const displayValue = (isVariable && absValue === 1) ? '' : absValue;
    const variable = isVariable ? 'x' : '';
    return `${sign}${displayValue}${variable}`;
};

const TermBlock: React.FC<{ value: number, isVariable: boolean }> = ({ value, isVariable }) => {
    if (value === 0) return null;
    const bgColor = isVariable ? 'bg-blue-500' : 'bg-green-500';
    const sign = value > 0 ? '+' : '-';
    const displayValue = Math.abs(value);
    return (
        <div className={`m-1 p-2 rounded-lg text-white font-bold text-center shadow-md animate-fade-in-fast ${bgColor}`}>
            {sign} {isVariable && displayValue === 1 ? '' : displayValue}{isVariable ? 'x' : ''}
        </div>
    )
}

const EquationBalancer: React.FC<EquationBalancerProps> = ({ question, onSubmit, answerStatus }) => {
    const [left, setLeft] = useState<ParsedSide>({ x: 0, constant: 0 });
    const [right, setRight] = useState<ParsedSide>({ x: 0, constant: 0 });
    const [scaleRotation, setScaleRotation] = useState(0);
    const [operationValue, setOperationValue] = useState("");

    useEffect(() => {
        const leftSide = question.initialState?.leftSide as string;
        const rightSide = question.initialState?.rightSide as string;
        setLeft(parseSide(leftSide));
        setRight(parseSide(rightSide));
        setOperationValue("");
    }, [question]);

    useEffect(() => {
      const leftWeight = (left.x * 2) + (left.constant * 3);
      const rightWeight = (right.x * 2) + (right.constant * 3);
      const diff = leftWeight - rightWeight;
      setScaleRotation(Math.max(-5, Math.min(5, diff * 0.5)));
    }, [left, right]);

    useEffect(() => {
      if (answerStatus === 'correct' && typeof confetti === 'function') {
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
      }
    }, [answerStatus]);

    const handleOperation = (op: 'add' | 'subtract' | 'multiply' | 'divide', target: 'x' | 'constant' | 'all') => {
        const value = parseFloat(operationValue);
        if (isNaN(value)) {
            alert("Please enter a valid number.");
            return;
        }

        const apply = (side: ParsedSide): ParsedSide => {
            let newX = side.x;
            let newConstant = side.constant;
            
            if (op === 'add') {
                target === 'x' ? newX += value : newConstant += value;
            } else if (op === 'subtract') {
                target === 'x' ? newX -= value : newConstant -= value;
            } else if (op === 'multiply') {
                newX *= value;
                newConstant *= value;
            } else if (op === 'divide') {
                if (value === 0) {
                    alert("Cannot divide by zero!");
                    return side;
                }
                newX /= value;
                newConstant /= value;
            }
            return { x: parseFloat(newX.toFixed(2)), constant: parseFloat(newConstant.toFixed(2)) };
        };
        
        setLeft(prev => apply(prev));
        setRight(prev => apply(prev));
        setOperationValue("");
    };

    const formatSide = (side: ParsedSide) => {
        const xPart = formatTerm(side.x, true, true);
        const constPart = formatTerm(side.constant, false, side.x === 0);
        if (!xPart && !constPart) return '0';
        return `${xPart || ''}${constPart || ''}`.trim();
    };

    const isFinalForm = useMemo(() => {
      const isLeftFinal = left.x === 1 && left.constant === 0 && right.x === 0;
      const isRightFinal = right.x === 1 && right.constant === 0 && left.x === 0;
      return isLeftFinal || isRightFinal;
    }, [left, right]);
    
    const handleCheck = () => {
        let finalAnswer = '';
        if (left.x === 1 && left.constant === 0 && right.x === 0) {
            finalAnswer = `x=${right.constant}`;
        } else if (right.x === 1 && right.constant === 0 && left.x === 0) {
            finalAnswer = `x=${left.constant}`;
        }
        
        if (finalAnswer) {
            onSubmit(finalAnswer.replace(/\s/g, ''));
        }
    };
    
    const disabled = answerStatus !== 'unanswered';

    return (
        <div className="p-6 bg-slate-50 min-h-[500px]">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-slate-800 text-center">{question.questionText}</h2>

            <div className="relative h-64 flex flex-col justify-end items-center mb-6">
                <div 
                    className="w-full max-w-lg h-2 bg-slate-500 rounded-full transition-transform duration-500 ease-in-out" 
                    style={{ transform: `rotate(${scaleRotation}deg)` }}
                >
                    <div className="absolute -left-8 -top-2 w-48 h-32 bg-slate-200 rounded-lg shadow-lg flex flex-wrap justify-center items-center p-2 border-b-4 border-slate-400">
                        {<TermBlock value={left.x} isVariable />}
                        {<TermBlock value={left.constant} isVariable={false} />}
                    </div>
                    <div className="absolute -right-8 -top-2 w-48 h-32 bg-slate-200 rounded-lg shadow-lg flex flex-wrap justify-center items-center p-2 border-b-4 border-slate-400">
                        {<TermBlock value={right.x} isVariable />}
                        {<TermBlock value={right.constant} isVariable={false} />}
                    </div>
                </div>
                <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-slate-600"></div>
                <div className="w-16 h-4 bg-slate-600"></div>
            </div>

            <div className="text-center text-3xl font-bold font-mono text-slate-700 mb-6 p-4 bg-white rounded-lg shadow-inner">
                {formatSide(left)} = {formatSide(right)}
            </div>
            
            <div className="flex flex-col items-center gap-3 p-4 bg-slate-100 rounded-lg max-w-lg mx-auto border">
                <label htmlFor="opValue" className="font-bold text-slate-700">Enter a number to apply:</label>
                <input 
                    id="opValue"
                    type="number"
                    value={operationValue}
                    onChange={e => setOperationValue(e.target.value)}
                    disabled={disabled}
                    className="p-2 border-2 border-slate-300 rounded-lg text-center text-xl font-bold w-32 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none"
                    placeholder="e.g., 3"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
                    <button onClick={() => handleOperation('add', 'constant')} disabled={disabled || !operationValue} className="p-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 disabled:bg-slate-300 transition-colors">+ Number</button>
                    <button onClick={() => handleOperation('subtract', 'constant')} disabled={disabled || !operationValue} className="p-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 disabled:bg-slate-300 transition-colors">- Number</button>
                    <button onClick={() => handleOperation('add', 'x')} disabled={disabled || !operationValue} className="p-2 bg-green-400 text-white rounded-lg font-bold hover:bg-green-500 disabled:bg-slate-300 transition-colors">+ X Term</button>
                    <button onClick={() => handleOperation('subtract', 'x')} disabled={disabled || !operationValue} className="p-2 bg-red-400 text-white rounded-lg font-bold hover:bg-red-500 disabled:bg-slate-300 transition-colors">- X Term</button>
                    <button onClick={() => handleOperation('multiply', 'all')} disabled={disabled || !operationValue} className="p-2 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600 disabled:bg-slate-300 transition-colors">× Multiply</button>
                    <button onClick={() => handleOperation('divide', 'all')} disabled={disabled || !operationValue} className="p-2 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 disabled:bg-slate-300 transition-colors">÷ Divide</button>
                </div>
            </div>
            
            <div className="mt-6 text-center">
                <p className="text-sm text-slate-500 mb-2 h-5">
                    {answerStatus === 'unanswered' && (isFinalForm ? "Ready to check your answer!" : "Keep going until you have 'x' by itself.")}
                </p>
                <button
                    onClick={handleCheck}
                    disabled={disabled || !isFinalForm}
                    className="w-full max-w-sm bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-lg hover:bg-blue-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                    Check Answer
                </button>
            </div>
        </div>
    );
};

export default EquationBalancer;