import React from 'react';

interface InfoPanelProps {
  summary?: string;
  keyPoints?: string[];
  biasAnalysis?: string;
}

const InfoSection: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div>
        <h3 className="flex items-center text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
            <span className="text-xl mr-2">{icon}</span>
            {title}
        </h3>
        <div className="text-slate-600 dark:text-slate-400 text-sm space-y-2">
            {children}
        </div>
    </div>
);

const InfoPanel: React.FC<InfoPanelProps> = ({ summary, keyPoints, biasAnalysis }) => {
    const hasContent = summary || (keyPoints && keyPoints.length > 0) || biasAnalysis;

    if (!hasContent) {
        return null;
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 space-y-6 animate-fade-in">
            <h2 className="text-xl font-extrabold text-center text-blue-600 dark:text-blue-400 border-b dark:border-slate-700 pb-3">
                Information
            </h2>
            
            {summary && (
                <InfoSection title="Summary" icon="📝">
                    <p>{summary}</p>
                </InfoSection>
            )}

            {keyPoints && keyPoints.length > 0 && (
                <InfoSection title="Key Points" icon="🔑">
                    <ul className="list-disc list-inside space-y-1.5">
                        {keyPoints.map((point, index) => (
                            <li key={index}>{point}</li>
                        ))}
                    </ul>
                </InfoSection>
            )}

            {biasAnalysis && (
                <InfoSection title="Bias Analysis" icon="🧐">
                    <p>{biasAnalysis}</p>
                </InfoSection>
            )}
        </div>
    );
};

export default InfoPanel;
