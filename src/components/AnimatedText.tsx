
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface AnimatedTextProps {
  text: string;
  className?: string;
}

const AnimatedText = ({ text, className }: AnimatedTextProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.substring(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 50); // Adjust speed here (lower number = faster)

      return () => clearTimeout(timer);
    }
  }, [currentIndex, text]);

  return (
    <div className={`transition-opacity duration-300 ${className}`}>
      <ReactMarkdown>{displayedText}</ReactMarkdown>
    </div>
  );
};

export default AnimatedText;
