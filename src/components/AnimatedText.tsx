
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
    // Split the text into words, preserving markdown syntax
    const splitText = text.split(/(\s+)/).filter(word => word.length > 0);
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

  // Custom renderer for ReactMarkdown that applies animation to each word
  const renderWord = (word: string, index: number) => {
    const isVisible = index < currentIndex;
    return (
      <span
        key={index}
        className={`inline-block transition-all duration-300 ${
          isVisible 
            ? 'opacity-100 blur-none translate-y-0' 
            : 'opacity-0 blur-sm translate-y-1'
        }`}
      >
        {word}
      </span>
    );
  };

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
                  {words.map((word, index) => renderWord(word, index))}
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
