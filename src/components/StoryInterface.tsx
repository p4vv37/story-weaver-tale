
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { useToast } from './ui/use-toast';

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
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);

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
      
      // Add new story to the end of the array
      setStories(prevStories => [...prevStories, {
        userInput: input,
        story: data.text,
        timestamp: Date.now()
      }]);
      
      setInput('');

      // Text to speech
      const ttsResponse = await fetch('http://localhost:5000/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: data.text }),
      });

      if (!ttsResponse.ok) throw new Error('Failed to convert to speech');
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

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Stories Section */}
        {stories.map((story, index) => (
          <Card key={story.timestamp} className="p-6 shadow-lg border-story-border bg-white">
            <div className="prose max-w-none space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-600 mb-2">Your Input:</h3>
                <p className="text-gray-800">{story.userInput}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-gray-600 mb-2">Generated Story:</h3>
                <p className="text-gray-800">{story.story}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" className="text-story-accent">
                <Play className="mr-2 h-4 w-4" />
                Play Audio
              </Button>
            </div>
          </Card>
        ))}

        {/* Input Section */}
        <Card className="p-6 shadow-lg border-story-border bg-story-background">
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me your story idea..."
                className="min-h-[120px] resize-none pr-12 text-lg"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 hover:bg-story-accent/10"
                onClick={toggleRecording}
              >
                {isRecording ? (
                  <MicOff className="h-5 w-5 text-red-500" />
                ) : (
                  <Mic className="h-5 w-5 text-story-accent" />
                )}
              </Button>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="transition-all duration-200 ease-in-out hover:scale-105"
              >
                {isLoading ? (
                  "Generating..."
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

