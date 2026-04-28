// components/ui/math-text.tsx
import React from "react";
import { InlineMath, BlockMath } from "react-katex";

interface MathTextProps {
  text: string;
  className?: string;
}

export function MathText({ text, className = "" }: MathTextProps) {
  if (!text) return null;

  // Regex safely splits the text by block math ($$...$$) and inline math ($...$)
  // Capture groups keep the delimiters so we know how to render each chunk
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

  return (
    <div className={className}>
      {parts.map((part, index) => {
        // Handle Block Math (Standalone equations)
        if (part.startsWith("$$") && part.endsWith("$$")) {
          const math = part.slice(2, -2); // Remove the $$
          return <BlockMath key={index} math={math} />;
        }
        
        // Handle Inline Math (Equations inside a sentence)
        if (part.startsWith("$") && part.endsWith("$")) {
          const math = part.slice(1, -1); // Remove the $
          return <InlineMath key={index} math={math} />;
        }
        
        // Regular Text (React automatically sanitizes this, preventing XSS)
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}