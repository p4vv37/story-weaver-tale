
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface AnimatedTextProps {
  text: string;
  className?: string;
}

const AnimatedText = ({ text, className }: AnimatedTextProps) => {
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Split the text into words while preserving spaces
    const splitText = text.split(/(\s+|\b)/);
    setWords(splitText);
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < words.length) {
      const timer = setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 100); // Adjust speed here (lower number = faster)

      return () => clearTimeout(timer);
    }
  }, [currentIndex, words]);

  // Combine all visible words for markdown parsing
  const visibleText = words.slice(0, currentIndex).join('');

  return (
    <div className={`transition-opacity duration-300 ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => {
            if (typeof children === 'string') {
              return (
                <p>
                  {words.map((word, index) => (
                    <span
                      key={index}
                      className={`inline-block transition-all duration-300 ${
                        index < currentIndex 
                          ? 'opacity-100 blur-none translate-y-0' 
                          : 'opacity-0 blur-sm translate-y-1'
                      }`}
                    >
                      {word}
                    </span>
                  ))}
                </p>
              );
            }
            return <p>{children}</p>;
          }
        }}
      >
        {visibleText}
      </ReactMarkdown>
    </div>
  );
};

export default AnimatedText;
