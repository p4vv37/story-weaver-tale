
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
      }, 30); // Faster speed for smoother animation

      return () => clearTimeout(timer);
    }
  }, [currentIndex, text]);

  // Split the displayed text into spans for letter animation
  const animatedText = displayedText.split('').map((char, index) => (
    <span
      key={index}
      className="inline-block animate-fade-in"
      style={{
        opacity: 0,
        animation: 'fade-in 0.3s ease-out forwards',
        animationDelay: `${index * 0.03}s`
      }}
    >
      {char}
    </span>
  ));

  return (
    <div className={`transition-opacity duration-300 ${className}`}>
      <ReactMarkdown components={{
        // Custom rendering for paragraphs to preserve the animation
        p: ({ children }) => <p>{children}</p>,
        // Preserve other markdown elements but wrap text in spans
        strong: ({ children }) => <strong>{children}</strong>,
        em: ({ children }) => <em>{children}</em>,
      }}>
        {displayedText}
      </ReactMarkdown>
    </div>
  );
};

export default AnimatedText;
