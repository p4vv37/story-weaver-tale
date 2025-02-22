
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Play, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { useToast } from './ui/use-toast';
import AnimatedText from './AnimatedText';
import SpinningLoader from './SpinningLoader';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface StoryResponse {
  userInput: string;
  story: string;
  timestamp: number;
}

const StoryInterface = () => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [stories, setStories] = useState<StoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [imagePath, setImagePath] = useState('/lovable-uploads/77ea953b-83c9-4dfd-82ed-386a049da785.png');
  const [isImageChanging, setIsImageChanging] = useState(false);
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const newImagePathRef = useRef<string>('');

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setInput(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        toast({
          title: "Error",
          description: "There was a problem with the speech recognition.",
          variant: "destructive"
        });
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive"
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsRecording(!isRecording);
  };

  const fetchNewImage = async () => {
    try {
      setIsImageChanging(true);
      
      // Wait for fade out
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const response = await fetch('http://localhost:5000/api/get-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) throw new Error('Failed to fetch new image');
      
      const data = await response.json();
      newImagePathRef.current = data.imagePath;
      
      // After getting new image path, wait a short moment before updating
      await new Promise(resolve => setTimeout(resolve, 50));
      setImagePath(newImagePathRef.current);
      
      // Wait a short moment before starting fade in
      await new Promise(resolve => setTimeout(resolve, 50));
      setIsImageChanging(false);
    } catch (error) {
      console.error('Error fetching new image:', error);
      setIsImageChanging(false);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast({
        title: "Input required",
        description: "Please enter some text or use voice input.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: input }),
      });

      if (!response.ok) throw new Error('Failed to generate story');
      
      const data = await response.json();
      
      setStories(prevStories => [...prevStories, {
        userInput: input,
        story: data.text,
        timestamp: Date.now()
      }]);
      
      setInput('');

      const ttsResponse = await fetch('http://localhost:5000/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: data.text }),
      });

      if (!ttsResponse.ok) throw new Error('Failed to convert to speech');

      await fetchNewImage();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate story. Please try again." + error,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartStory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/start-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) throw new Error('Failed to start story');
      
      const data = await response.json();
      const ttsResponse = await fetch('http://localhost:5000/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: data.text }),
      });
      
      setStories([{
        userInput: "Start new story",
        story: data.text,
        timestamp: Date.now()
      }]);
      
      setHasStarted(true);

      await fetchNewImage();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start story. Please try again." + error,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-start p-8">
        <div className="w-full max-w-3xl mb-8">
          <img
            src={imagePath}
            alt="Story Title"
            className={`backlight w-full object-cover rounded-lg shadow-2xl mb-12 transition-opacity duration-300 ${
              isImageChanging ? 'opacity-0' : 'opacity-100'
            }`}
          />
        </div>
        <Button
          onClick={handleStartStory}
          disabled={isLoading}
          size="lg"
          className="text-lg gap-3 transition-all duration-200 ease-in-out hover:scale-105 glass-morphism text-white"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <SpinningLoader className="text-white h-4 w-4" />
              Starting Story...
            </div>
          ) : (
            <>
              <BookOpen className="h-6 w-6" />
              Start New Story
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="w-full max-w-3xl mx-auto mb-8">
        <img
          src={imagePath}
          alt="Story Title"
          className={`backlight w-full object-cover rounded-lg shadow-2xl mb-8 transition-opacity duration-300 ${
            isImageChanging ? 'opacity-0' : 'opacity-100'
          }`}
        />
      </div>
      <div className="max-w-2xl mx-auto space-y-8">
        {stories.map((story, index) => (
          <Card key={story.timestamp} className="p-6 glass-morphism">
            <div className="prose max-w-none space-y-4">
              <div className="p-4 bg-secondary/50 rounded-lg neo-blur">
                <h3 className="font-medium text-white/80 mb-2">Your Input:</h3>
                <p className="text-white/90">{story.userInput}</p>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg neo-blur">
                <h3 className="font-medium text-white/80 mb-2">Generated Story:</h3>
                <div className="text-white/90 prose">
                  <AnimatedText text={story.story} />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">
                <Play className="mr-2 h-4 w-4" />
                Play Audio
              </Button>
            </div>
          </Card>
        ))}

        <Card className="p-6 glass-morphism">
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me your story idea..."
                className="min-h-[120px] resize-none pr-12 text-lg bg-secondary/50 border-white/10 text-white/90 placeholder:text-white/50"
                disabled={isLoading}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 hover:bg-white/10 text-white"
                onClick={toggleRecording}
                disabled={isLoading}
              >
                {isRecording ? (
                  <MicOff className="h-5 w-5 text-red-400" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full h-12 transition-all duration-200 ease-in-out hover:scale-105 glass-morphism text-white"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2 justify-center w-full">
                    <SpinningLoader className="text-white h-4 w-4" />
                    Generating...
                  </div>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StoryInterface;
