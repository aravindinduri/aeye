
"use client";

import type { VideoConfigFormData } from "@/types/aegis";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadCloud, Timer, Play } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label"; 

const formSchema = z.object({
  videoFile: z.custom<FileList>((val) => val instanceof FileList && val.length > 0 , "Please select a video file.").refine(files => files?.[0]?.type.startsWith("video/"), "Please select a valid video file."),
  // Interval is no longer a user input, but we keep it in the schema for the default value
  interval: z.coerce.number().min(1, "Interval must be at least 1 second.").max(300, "Interval cannot exceed 300 seconds.").default(5),
});

type VideoConfigFormProps = {
  onSubmit: (data: Omit<VideoConfigFormData, 'sceneContext'>) => void;
  isProcessing: boolean;
  progress: number;
};

export function VideoConfigForm({ onSubmit, isProcessing, progress }: VideoConfigFormProps) {
  const form = useForm<Omit<VideoConfigFormData, 'sceneContext'>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      interval: 5, // Default interval set to 5 seconds
    },
  });

  const handleFormSubmit: SubmitHandler<Omit<VideoConfigFormData, 'sceneContext'>> = (data) => {
    // Ensure interval is passed, even if not in the form UI
    onSubmit({ ...data, interval: data.interval || 5 });
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <UploadCloud className="mr-2 h-7 w-7 text-primary" />
          Video File Analysis Configuration
        </CardTitle>
        <CardDescription>Upload your video for analysis. Frames will be extracted every 5 seconds.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="videoFile"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><UploadCloud className="mr-2 h-4 w-4" />Video File</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="video/*" 
                      onChange={(e) => onChange(e.target.files)} 
                      {...rest} 
                      className="file:text-primary file:font-semibold hover:file:bg-accent/10"
                      disabled={isProcessing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Screenshot Interval field is removed. Defaulting to 5 seconds. */}
            {/* 
            <FormField
              control={form.control}
              name="interval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Timer className="mr-2 h-4 w-4" />Screenshot Interval (seconds)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} disabled={isProcessing} min="1" max="300" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            */}
            {isProcessing && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Processing Video...</Label>
                <Progress value={progress} className="w-full h-3" />
                <p className="text-sm text-muted-foreground text-center">{Math.round(progress)}% Complete</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isProcessing}>
              <Play className="mr-2 h-5 w-5" />
              {isProcessing ? "Processing..." : "Start File Analysis"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
