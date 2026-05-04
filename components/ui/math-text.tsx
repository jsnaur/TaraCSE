// components/ui/math-text.tsx
import React from "react";
import { InlineMath, BlockMath } from "react-katex";

interface MathTextProps {
  text: string;
  className?: string;
  block?: boolean;
  style?: React.CSSProperties;
}

function renderMarkdown(text: string, keyPrefix: string): React.ReactNode[] {
  if (!text) return [];
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return tokens.map((tok, i) => {
    if (tok.startsWith("**") && tok.endsWith("**")) {
      return <strong key={`${keyPrefix}-b-${i}`}>{tok.slice(2, -2)}</strong>;
    }
    if (tok.startsWith("*") && tok.endsWith("*") && tok.length > 2) {
      return <em key={`${keyPrefix}-i-${i}`}>{tok.slice(1, -1)}</em>;
    }
    return <React.Fragment key={`${keyPrefix}-t-${i}`}>{tok}</React.Fragment>;
  });
}

export function MathText({ text, className = "", block = false, style }: MathTextProps) {
  if (!text) return null;

  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
  const Wrapper = block ? "div" : "span";

  return (
    <Wrapper className={className} style={style}>
      {parts.map((part, index) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          return <BlockMath key={index} math={part.slice(2, -2)} />;
        }
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          return <InlineMath key={index} math={part.slice(1, -1)} />;
        }
        return (
          <React.Fragment key={index}>
            {renderMarkdown(part, String(index))}
          </React.Fragment>
        );
      })}
    </Wrapper>
  );
}
