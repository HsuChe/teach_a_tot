import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const renderContent = () => {
    const lines = content.split('\n');
    // Fix: Replaced `JSX.Element` with `React.ReactElement` to resolve the namespace error.
    const elements: React.ReactElement[] = [];
    let listItems: string[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2">
            {listItems.map((item, index) => (
              <li key={index} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    const parseInline = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-slate-300">$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italics
    };

    lines.forEach((line, index) => {
      if (line.trim().startsWith('### ')) {
        flushList();
        elements.push(<h3 key={index} className="text-lg font-bold my-2 text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: parseInline(line.replace('### ', '')) }} />);
      } else if (line.trim().startsWith('## ')) {
        flushList();
        elements.push(<h2 key={index} className="text-xl font-bold my-3 text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: parseInline(line.replace('## ', '')) }} />);
      } else if (line.trim().startsWith('# ')) {
        flushList();
        elements.push(<h1 key={index} className="text-2xl font-bold my-4 text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: parseInline(line.replace('# ', '')) }} />);
      } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        listItems.push(line.trim().substring(2));
      } else {
        flushList();
        if (line.trim() !== '') {
          elements.push(<p key={index} className="my-2" dangerouslySetInnerHTML={{ __html: parseInline(line) }} />);
        }
      }
    });

    flushList(); // Make sure any trailing list is rendered

    return elements;
  };

  return <div className="prose max-w-none text-slate-700 dark:text-slate-400 leading-relaxed">{renderContent()}</div>;
};

export default MarkdownRenderer;