
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { useToast } from './ui/use-toast';

const StoryInterface = () => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [story, setStory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setInput(transcript);
      };

      recognitionRef.current.onerror = (event) => {
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
      const response = await fetch('/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) throw new Error('Failed to generate story');
      
      const data = await response.json();
      setStory(data.story);
      
      // Text to speech
      const ttsResponse = await fetch('/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: data.story }),
      });

      if (!ttsResponse.ok) throw new Error('Failed to convert to speech');
      
      // Handle audio playback here
      const audioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
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

        {story && (
          <Card className="p-6 shadow-lg border-story-border bg-white animate-fade-in">
            <div className="prose max-w-none">
              <p className="text-lg leading-relaxed text-gray-800">{story}</p>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" className="text-story-accent">
                <Play className="mr-2 h-4 w-4" />
                Play Audio
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StoryInterface;
