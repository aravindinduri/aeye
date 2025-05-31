
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from 'next/navigation';
import { VideoConfigForm } from "@/components/aegis/video-config-form";
import { AlertList } from "@/components/aegis/alert-list";
import type { AlertIncident } from "@/types/aegis";
import { extractFrames } from "@/lib/video-processor";
import { analyzeFrame, type AnalyzeFrameInput, type AnalyzeFrameOutput } from "@/ai/flows/incident-detection";
import { sendIncidentReportEmail, type SendIncidentReportEmailInput, type SendIncidentReportEmailOutput } from "@/ai/flows/send-incident-report-email-flow";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Play, Square, AlertTriangle, UploadCloud, Video, Timer, MailWarning, Globe, Tv2, Youtube } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const YOUTUBE_STREAMS = [
  { title: "Philippines Live Traffic, Agdao Flyover, Davao City", embedUrl: "https://www.youtube.com/embed/owkylsZUPFY?autoplay=1&mute=1&controls=0&modestbranding=1" },
  { title: "4 Corners Camera Downtown", embedUrl: "https://www.youtube.com/embed/ByED80IKdIU?autoplay=1&mute=1&controls=0&modestbranding=1" },
  { title: "Live cam World - Rolling Cam around the World", embedUrl: "https://www.youtube.com/embed/z7SiAaN4ogw?autoplay=1&mute=1&controls=0&modestbranding=1" },
  { title: "The World Live - Original Version | earthTV®", embedUrl: "https://www.youtube.com/embed/HfgIFGbdGJ0?autoplay=1&mute=1&controls=0&modestbranding=1" },
  { title: "Live Stream 1", embedUrl: "https://www.youtube.com/embed/j9Sa4uBGGQ0?autoplay=1&mute=1&controls=0&modestbranding=1" },
  { title: "Live Stream 2", embedUrl: "https://www.youtube.com/embed/VR-x3HdhKLQ?autoplay=1&mute=1&controls=0&modestbranding=1" },
  { title: "Live Stream 3", embedUrl: "https://www.youtube.com/embed/u4UZ4UvZXrg?autoplay=1&mute=1&controls=0&modestbranding=1" },
];

type AnalysisMode = 'upload' | 'live' | 'external' | 'publicWebcams' | 'incidents';

// Helper function to normalize incident details for key generation
const normalizeIncidentKey = (incident: { incidentType: string; description: string; location: string }): string => {
  // Regex to match "Observed at ISO_TIMESTAMP: " more precisely
  const timestampRegex = /^Observed at (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z):\s*/i;
  const descriptionWithoutTimestamp = incident.description.replace(timestampRegex, '');
  const normalizedDescription = descriptionWithoutTimestamp.toLowerCase().replace(/\s+/g, ' ').trim();
  const normalizedLocation = incident.location.toLowerCase().replace(/\s+/g, ' ').trim();
  return `${incident.incidentType.toLowerCase().trim()}|${normalizedDescription}|${normalizedLocation}`;
};

export default function AegisDashboardPage() {
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const { toast } = useToast();

  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('upload');

  const videoRef = useRef<HTMLVideoElement>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const LIVE_ANALYSIS_INTERVAL_SECONDS = 5;
  const liveIntervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const [isLiveAnalyzing, setIsLiveAnalyzing] = useState(false);

  const externalVideoRef = useRef<HTMLVideoElement>(null);
  const [externalStreamUrl, setExternalStreamUrl] = useState<string>("");
  const [currentExternalStreamSrc, setCurrentExternalStreamSrc] = useState<string | undefined>(undefined);
  const [isExternalAnalyzing, setIsExternalAnalyzing] = useState(false);
  const [externalAnalysisIntervalSeconds, setExternalAnalysisIntervalSeconds] = useState<number>(10);
  const externalIntervalIdRef = useRef<NodeJS.Timeout | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Refs for session-based incident deduplication
  const uploadedVideoSessionSeenIncidentsRef = useRef<Set<string>>(new Set());
  const liveAnalysisSessionSeenIncidentsRef = useRef<Set<string>>(new Set());
  const externalStreamSessionSeenIncidentsRef = useRef<Set<string>>(new Set());

  const tabQueryFromUrl = searchParams.get('tab') as AnalysisMode | null;

  useEffect(() => {
    if (tabQueryFromUrl && ['upload', 'live', 'external', 'publicWebcams', 'incidents'].includes(tabQueryFromUrl)) {
      setAnalysisMode(currentMode => {
        if (currentMode !== tabQueryFromUrl) {
          return tabQueryFromUrl;
        }
        return currentMode;
      });
    }
  }, [tabQueryFromUrl]);

  const saveAndReportIncident = useCallback(async (incidentData: Omit<AlertIncident, 'id'>) => {
    let firestoreDocId: string | null = null;
    try {
      console.log("[AEYE_DEBUG] Attempting to save incident to Firestore. Data:", JSON.stringify(incidentData, (key, value) => key === 'frameDataUri' ? (value ? value.substring(0,100) + '...' : null) : value ));

      if (incidentData.frameDataUri && incidentData.frameDataUri.length > 1024 * 1024 * 0.9) {
         console.warn("[AEYE_DEBUG] frameDataUri is very large (over 0.9MiB) and might exceed Firestore document size limit of 1MiB. This could cause the save to fail.");
         toast({
            title: "Potential Firestore Save Issue",
            description: "The incident image data is very large. If saving fails, this might be the cause. Consider reducing frame resolution or using Firebase Storage for images.",
            variant: "default",
            duration: 10000,
         });
      }

      const docRef = await addDoc(collection(db, "incidents"), {
        ...incidentData,
        createdAt: serverTimestamp()
      });
      firestoreDocId = docRef.id;
      console.log("[AEYE_SUCCESS] Incident saved to Firestore with ID: ", firestoreDocId);
      toast({
        title: "Incident Saved",
        description: `Incident "${incidentData.incidentType}" (ID: ${firestoreDocId}) saved to database.`,
        action: <ShieldCheck className="h-5 w-5 text-green-500" />
      });

      const emailInput: SendIncidentReportEmailInput = {
        incidentType: incidentData.incidentType,
        description: incidentData.description,
        location: incidentData.location,
        timestamp: incidentData.timestamp, // This is video timestamp (number)
        confidence: incidentData.confidence,
        confidencePercentage: Math.round(incidentData.confidence * 100),
        severity: incidentData.severity,
        frameDataUri: incidentData.frameDataUri || undefined,
      };
      console.log("[AEYE_DEBUG] Attempting to send email for incident ID:", firestoreDocId);
      const emailResult: SendIncidentReportEmailOutput = await sendIncidentReportEmail(emailInput);

      if (emailResult.success) {
        console.info("[AEYE_SUCCESS] Incident report email prepared/sent for ID:", firestoreDocId, "Preview (HTML snippet):", emailResult.sentEmailContentPreview);
        toast({
          title: "Incident Report Email Sent",
          description: `Email for "${incidentData.incidentType}" sent successfully. Message ID: ${emailResult.messageId || 'N/A'}`,
          action: <MailWarning className="h-5 w-5 text-green-500" />
        });
      } else {
        console.error("[AEYE_ERROR] Failed to send incident report email for ID:", firestoreDocId, "Error:", emailResult.error);
        toast({
          title: "Email Sending Error",
          description: `Incident saved (ID: ${firestoreDocId}), but failed to send email report. ${emailResult.error || "Unknown email error."}`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("[AEYE_ERROR] Error processing incident:", error);
      let description = `Could not process incident. ${error instanceof Error ? error.message : String(error)}`;

      if (firestoreDocId === null) {
         description = `Failed to save incident to Firestore. ${error instanceof Error ? error.message : String(error)}. Please check Firestore setup, rules, and .env configuration. Also, ensure image data is not too large (max 1MiB per document).`;
      }
      toast({
        title: "Incident Processing Error",
        description: description,
        variant: "destructive",
      });
    }
  }, [toast]);


  const handleStopLiveAnalysis = useCallback(() => {
    setIsLiveAnalyzing(false);
    if (liveIntervalIdRef.current) {
      clearInterval(liveIntervalIdRef.current);
      liveIntervalIdRef.current = null;
    }
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach(track => track.stop());
      liveStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    // liveAnalysisSessionSeenIncidentsRef.current.clear(); // Clear seen incidents on stop
     toast({
        title: "Local Live Analysis Stopped",
        description: "Local camera feed and analysis have been stopped.",
      });
  }, [toast]);

  const handleStopExternalAnalysis = useCallback(() => {
    setIsExternalAnalyzing(false);
    if (externalIntervalIdRef.current) {
      clearInterval(externalIntervalIdRef.current);
      externalIntervalIdRef.current = null;
    }
    // externalStreamSessionSeenIncidentsRef.current.clear(); // Clear seen incidents on stop
    toast({
        title: "External Stream Analysis Stopped",
        description: "Analysis of the external stream has been stopped.",
      });
  }, [toast]);

  useEffect(() => {
    const setupCamera = async () => {
      if (analysisMode === 'live') {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          toast({
            variant: 'destructive',
            title: 'Camera API Not Supported',
            description: 'Your browser does not support camera access.',
          });
          setHasCameraPermission(false);
          return;
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          liveStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            if (isLiveAnalyzing) videoRef.current.play().catch(e => console.error("Error auto-playing video on mode switch:", e));
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings for the "Live webcam" feature.',
          });
        }
      } else {
        if (isLiveAnalyzing) {
          handleStopLiveAnalysis();
        } else {
           if (liveStreamRef.current) {
            liveStreamRef.current.getTracks().forEach(track => track.stop());
            liveStreamRef.current = null;
          }
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        }
        setHasCameraPermission(null);
      }
    };

    setupCamera();

    return () => {
      if (liveStreamRef.current) {
        liveStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (liveIntervalIdRef.current) {
        clearInterval(liveIntervalIdRef.current);
      }
      if (externalIntervalIdRef.current) {
        clearInterval(externalIntervalIdRef.current);
      }
    };
  }, [analysisMode, toast, isLiveAnalyzing, handleStopLiveAnalysis]);


  const captureAndAnalyzeFrame = useCallback(async (sourceVideoRef: React.RefObject<HTMLVideoElement>, analysisType: 'live' | 'external') => {
    if (!sourceVideoRef.current || sourceVideoRef.current.paused || sourceVideoRef.current.ended) {
      console.warn(`[AEYE_DEBUG] Skipping frame capture for ${analysisType}: video not playing or ended.`);
      return;
    }
    if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    const video = sourceVideoRef.current;

    if (video.readyState < video.HAVE_METADATA || video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn(`[AEYE_DEBUG] Skipping frame capture for ${analysisType}: video not ready or no dimensions. readyState: ${video.readyState}, width: ${video.videoWidth}, height: ${video.videoHeight}`);
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');

    if (context) {
      try {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameDataUri = canvas.toDataURL('image/jpeg');
        const videoTimestamp = video.currentTime; // This is the video's internal timestamp

        console.log(`[AEYE_DEBUG] Captured frame for ${analysisType} at ${videoTimestamp.toFixed(1)}s. Analyzing...`);
        const analysisInput: AnalyzeFrameInput = {
          frameDataUri,
          timestamp: videoTimestamp.toFixed(1) + "s", // Video timestamp string
          currentTimeISO: new Date().toISOString(), // Current real-world time
        };
        const result: AnalyzeFrameOutput = await analyzeFrame(analysisInput);
        console.log(`[AEYE_DEBUG] AI Analysis result for ${analysisType} frame:`, result);

        const uniqueIncidentsForThisFrame = new Map<string, AnalyzeFrameOutput['incidents'][number]>();
        if (result && result.incidents && result.incidents.length > 0) {
          for (const incident of result.incidents) {
            const perFrameKey = normalizeIncidentKey(incident);
            if (!uniqueIncidentsForThisFrame.has(perFrameKey)) {
              uniqueIncidentsForThisFrame.set(perFrameKey, incident);
            }
          }
        }

        if (uniqueIncidentsForThisFrame.size > 0) {
          let newIncidentsReportedThisFrame = 0;
          const currentSessionSeenIncidents =
            analysisType === 'live' ? liveAnalysisSessionSeenIncidentsRef.current :
            analysisType === 'external' ? externalStreamSessionSeenIncidentsRef.current :
            new Set<string>();

          for (const uniqueIncident of uniqueIncidentsForThisFrame.values()) {
            const sessionKey = normalizeIncidentKey(uniqueIncident);
            if (!currentSessionSeenIncidents.has(sessionKey)) {
              currentSessionSeenIncidents.add(sessionKey);
              await saveAndReportIncident({
                frameDataUri,
                timestamp: videoTimestamp, // Use the video's internal timestamp (number) for saving
                severity: uniqueIncident.severity || "Unknown",
                incidentType: uniqueIncident.incidentType,
                description: uniqueIncident.description, // This will contain "Observed at [currentTimeISO]: ..."
                location: uniqueIncident.location, // This will be the fictional Indian location
                confidence: uniqueIncident.confidence,
              });
              newIncidentsReportedThisFrame++;
            } else {
              console.log(`[AEYE_DEBUG] Duplicate incident (session-wide) skipped for ${analysisType}: ${sessionKey}`);
            }
          }
          if (newIncidentsReportedThisFrame > 0) {
            toast({
              title: `Incident Detected (${analysisType === 'live' ? 'Local Webcam' : 'External Stream'})`,
              description: `${newIncidentsReportedThisFrame} new unique incident(s) identified and processed.`,
            });
          }
        } else {
           console.log(`[AEYE_DEBUG] No unique incidents detected by AI for ${analysisType} frame at ${videoTimestamp.toFixed(1)}s.`);
        }
      } catch (aiError: any) {
        console.error(`[AEYE_ERROR] AI analysis error for ${analysisType} frame:`, aiError);
        let description = `Failed to analyze ${analysisType} frame. ${aiError instanceof Error ? aiError.message : String(aiError)}`;
        if ((analysisType === 'external' || analysisType === 'live') && (aiError.name === 'SecurityError' || (aiError.message && aiError.message.includes('cross-origin')))) {
            description = `Failed to capture frame from ${analysisType === 'external' ? 'external stream' : 'live camera'} due to browser security restrictions (CORS or Tainted Canvas). The video source must allow cross-origin frame data access.`;
            if (analysisType === 'external') handleStopExternalAnalysis();
        }
        toast({
          title: `${analysisType === 'live' ? 'Live webcam' : 'External Stream'} Analysis Error`,
          description,
          variant: "destructive",
        });
      }
    } else {
        console.error(`[AEYE_ERROR] Failed to get 2D context from canvas for ${analysisType} analysis.`);
        toast({
          title: "Canvas Error",
          description: `Could not get 2D context for ${analysisType} frame capture.`,
          variant: "destructive",
        });
    }
  }, [toast, saveAndReportIncident, handleStopExternalAnalysis]);

  const handleStartLiveAnalysis = useCallback(() => {
    if (!hasCameraPermission) {
      toast({
        title: "Camera Permission Required",
        description: "Cannot start live analysis without camera permission.",
        variant: "destructive",
      });
      return;
    }
    if (videoRef.current && liveStreamRef.current) {
        videoRef.current.play().catch(e => console.error("Error playing video:", e));
    }

    liveAnalysisSessionSeenIncidentsRef.current.clear();
    setIsLiveAnalyzing(true);
    if (liveIntervalIdRef.current) clearInterval(liveIntervalIdRef.current);

    console.log("[AEYE_DEBUG] Starting live analysis. First frame capture initiated.");
    captureAndAnalyzeFrame(videoRef, 'live');

    liveIntervalIdRef.current = setInterval(() => {
        console.log("[AEYE_DEBUG] Live analysis interval: capturing frame.");
        captureAndAnalyzeFrame(videoRef, 'live');
    }, LIVE_ANALYSIS_INTERVAL_SECONDS * 1000);

    toast({
      title: "Local Live Analysis Started",
      description: `Capturing frames every ${LIVE_ANALYSIS_INTERVAL_SECONDS} seconds.`,
    });
  }, [hasCameraPermission, captureAndAnalyzeFrame, toast, LIVE_ANALYSIS_INTERVAL_SECONDS]);

  const handleStartExternalAnalysis = useCallback(() => {
    if (!currentExternalStreamSrc || !externalVideoRef.current) {
        toast({
            title: "No External Stream Loaded",
            description: "Please load an external stream URL first.",
            variant: "destructive",
        });
        return;
    }
    externalVideoRef.current.play().catch(e => console.error("Error playing external video:", e));

    externalStreamSessionSeenIncidentsRef.current.clear();
    setIsExternalAnalyzing(true);
    if (externalIntervalIdRef.current) clearInterval(externalIntervalIdRef.current);

    console.log("[AEYE_DEBUG] Starting external stream analysis. First frame capture initiated.");
    captureAndAnalyzeFrame(externalVideoRef, 'external');

    externalIntervalIdRef.current = setInterval(() => {
        console.log("[AEYE_DEBUG] External stream analysis interval: capturing frame.");
        captureAndAnalyzeFrame(externalVideoRef, 'external');
    }, externalAnalysisIntervalSeconds * 1000);
    toast({
        title: "External Stream Analysis Started",
        description: `Attempting to capture frames every ${externalAnalysisIntervalSeconds} seconds. Note: CORS restrictions may prevent analysis.`,
    });
  }, [currentExternalStreamSrc, externalAnalysisIntervalSeconds, captureAndAnalyzeFrame, toast]);


  const handleVideoProcess = useCallback(async (data: { videoFile: FileList; interval: number }) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    uploadedVideoSessionSeenIncidentsRef.current.clear();

    const videoFile = data.videoFile[0];
    if (!videoFile) {
      toast({ title: "Error", description: "No video file selected.", variant: "destructive" });
      setIsProcessing(false);
      return;
    }

    const processingInterval = 5;
    console.log(`[AEYE_DEBUG] Starting video processing for file: ${videoFile.name}, interval: ${processingInterval}s`);

    let frameCount = 0;
    let uniqueIncidentsFoundAndReportedCount = 0;

    try {
      await extractFrames(
        videoFile,
        processingInterval,
        async (frameDataUri, videoTimestamp) => { // videoTimestamp is from extractFrames
          frameCount++;
          console.log(`[AEYE_DEBUG] Extracted frame ${frameCount} at ${videoTimestamp.toFixed(1)}s from uploaded video. Analyzing...`);
          try {
            const analysisInput: AnalyzeFrameInput = {
              frameDataUri,
              timestamp: videoTimestamp.toFixed(1) + "s", // Video timestamp string
              currentTimeISO: new Date().toISOString(),   // Current real-world time
            };
            const result: AnalyzeFrameOutput = await analyzeFrame(analysisInput);
            console.log(`[AEYE_DEBUG] AI Analysis result for uploaded video frame ${frameCount}:`, result);

            const uniqueIncidentsForThisFrame = new Map<string, AnalyzeFrameOutput['incidents'][number]>();
            if (result && result.incidents && result.incidents.length > 0) {
              for (const incident of result.incidents) {
                const perFrameKey = normalizeIncidentKey(incident);
                if (!uniqueIncidentsForThisFrame.has(perFrameKey)) {
                  uniqueIncidentsForThisFrame.set(perFrameKey, incident);
                }
              }
            }

            if (uniqueIncidentsForThisFrame.size > 0) {
              let newIncidentsReportedThisFrame = 0;
              for (const uniqueIncident of uniqueIncidentsForThisFrame.values()) {
                const sessionKey = normalizeIncidentKey(uniqueIncident);
                if (!uploadedVideoSessionSeenIncidentsRef.current.has(sessionKey)) {
                  uploadedVideoSessionSeenIncidentsRef.current.add(sessionKey);
                  await saveAndReportIncident({
                    frameDataUri,
                    timestamp: videoTimestamp, // Use video's internal timestamp (number) for saving
                    severity: uniqueIncident.severity || "Unknown",
                    incidentType: uniqueIncident.incidentType,
                    description: uniqueIncident.description, // Will contain "Observed at [currentTimeISO]: ..."
                    location: uniqueIncident.location,     // Will be fictional Indian location
                    confidence: uniqueIncident.confidence,
                  });
                  newIncidentsReportedThisFrame++;
                  uniqueIncidentsFoundAndReportedCount++;
                } else {
                   console.log(`[AEYE_DEBUG] Duplicate incident (session-wide) skipped for uploaded video: ${sessionKey}`);
                }
              }
              if (newIncidentsReportedThisFrame > 0) {
                 toast({
                    title: "Incident(s) Detected in Uploaded Video",
                    description: `${newIncidentsReportedThisFrame} new unique incident(s) identified in frame ${frameCount} and processed.`,
                  });
              }
            } else {
                console.log(`[AEYE_DEBUG] No unique incidents detected by AI for uploaded video frame ${frameCount} at ${videoTimestamp.toFixed(1)}s.`);
            }
          } catch (aiError) {
            console.error("[AEYE_ERROR] AI analysis error for uploaded video frame:", aiError);
            toast({
              title: "AI Analysis Error",
              description: `Failed to analyze frame at ${videoTimestamp}s. ${aiError instanceof Error ? aiError.message : String(aiError)}`,
              variant: "destructive",
            });
          }
        },
        (progress) => {
          setProcessingProgress(progress);
        },
        (errorMsg) => {
          console.error("[AEYE_ERROR] Frame extraction error:", errorMsg);
          toast({
            title: "Frame Extraction Error",
            description: errorMsg,
            variant: "destructive",
          });
        }
      );

      if (uniqueIncidentsFoundAndReportedCount > 0) {
         toast({
          title: "Analysis Complete",
          description: `${uniqueIncidentsFoundAndReportedCount} new unique incident(s) identified across ${frameCount} frames and processed.`,
        });
      } else if (frameCount > 0) {
         toast({
          title: "Analysis Complete",
          description: `No new incidents detected in ${frameCount} frames.`,
        });
      } else {
        toast({
          title: "Analysis Complete",
          description: "No frames processed. Check video file or interval settings.",
          variant: "default"
        });
      }

    } catch (error) {
      console.error("[AEYE_ERROR] Video processing error:", error);
      toast({
        title: "Video Processing Error",
        description: error instanceof Error ? error.message : "An unknown error occurred during video processing.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(100);
      console.log("[AEYE_DEBUG] Video processing finished.");
    }
  }, [toast, saveAndReportIncident]);

  const handleModeChange = (value: string) => {
    const newMode = value as AnalysisMode;
    if (analysisMode === 'live' && isLiveAnalyzing && newMode !== 'live') {
      handleStopLiveAnalysis();
    }
    if (analysisMode === 'external' && isExternalAnalyzing && newMode !== 'external') {
      handleStopExternalAnalysis();
    }
    setAnalysisMode(newMode);
  };

  const handleLoadExternalStream = () => {
    if (externalStreamUrl) {
        setCurrentExternalStreamSrc(externalStreamUrl);
        if (externalVideoRef.current) {
            externalVideoRef.current.load();
            externalVideoRef.current.play().catch(e => console.warn("Could not autoplay external stream:", e));
        }
        toast({
            title: "External Stream Loading",
            description: `Attempting to load: ${externalStreamUrl}`,
        });
    } else {
        toast({
            title: "No URL Provided",
            description: "Please enter an external stream URL.",
            variant: "destructive",
        });
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <Separator />

      <Tabs value={analysisMode} onValueChange={handleModeChange} className="w-full">

        <TabsContent value="upload" className="mt-6">
          <VideoConfigForm
            onSubmit={handleVideoProcess}
            isProcessing={isProcessing}
            progress={processingProgress}
          />
        </TabsContent>

        <TabsContent value="live" className="mt-6">
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted mb-4 border" autoPlay muted playsInline />

            {hasCameraPermission === null && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Camera Status</AlertTitle>
                <AlertDescription>Checking camera permissions...</AlertDescription>
              </Alert>
            )}

            {hasCameraPermission === false && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Camera Access Denied</AlertTitle>
                <AlertDescription>
                  Please enable camera permissions in your browser settings to use this feature. You may need to refresh the page after granting permissions.
                </AlertDescription>
              </Alert>
            )}

            {hasCameraPermission === true && (
              <div className="space-y-4">
                <Button onClick={isLiveAnalyzing ? handleStopLiveAnalysis : handleStartLiveAnalysis} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!hasCameraPermission}>
                  {isLiveAnalyzing ?
                    <><Square className="mr-2 h-5 w-5" />Stop Live Analysis</> :
                    <><Play className="mr-2 h-5 w-5" />Start Live Analysis</>
                  }
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="external" className="mt-6">
          <div className="bg-card p-6 rounded-lg shadow-lg space-y-6">
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>External Stream Notice</AlertTitle>
                <AlertDescription>
                    Displaying and analyzing external streams (e.g., public traffic cameras)
                </AlertDescription>
            </Alert>

            <div className="space-y-2">
                <Label htmlFor="externalStreamUrl" className="flex items-center"><Globe className="mr-2 h-4 w-4" />External Stream URL (e.g., MJPEG, HLS)</Label>
                <div className="flex gap-2">
                    <Input
                        id="externalStreamUrl"
                        type="url"
                        placeholder="https://example.com/stream.m3u8 or /stream.mjpeg"
                        value={externalStreamUrl}
                        onChange={(e) => setExternalStreamUrl(e.target.value)}
                        disabled={isExternalAnalyzing}
                    />
                    <Button onClick={handleLoadExternalStream} disabled={isExternalAnalyzing || !externalStreamUrl}>Load Stream</Button>
                </div>
            </div>

            <video ref={externalVideoRef} src={currentExternalStreamSrc || undefined} className="w-full aspect-video rounded-md bg-muted border" controls autoPlay muted playsInline crossOrigin="anonymous" onError={(e) => {
                console.error("Error loading external video stream:", e);
                toast({title: "Stream Error", description: "Could not load the video stream. Check the URL and console for details. Ensure the stream supports CORS if you intend to analyze it.", variant: "destructive"});
            }} />

            {currentExternalStreamSrc && (
                 <div className="space-y-4">
                    <div className="space-y-2">
                    <Label htmlFor="externalInterval" className="flex items-center"><Timer className="mr-2 h-4 w-4" />Analysis Interval (seconds)</Label>
                    <Input
                        id="externalInterval"
                        type="number"
                        value={externalAnalysisIntervalSeconds}
                        onChange={(e) => setExternalAnalysisIntervalSeconds(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        disabled={isExternalAnalyzing}
                        min="1"
                        max="300"
                    />
                    </div>
                    <Button onClick={isExternalAnalyzing ? handleStopExternalAnalysis : handleStartExternalAnalysis} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!currentExternalStreamSrc}>
                    {isExternalAnalyzing ?
                        <><Square className="mr-2 h-5 w-5" />Stop Stream Analysis</> :
                        <><Play className="mr-2 h-5 w-5" />Start Stream Analysis</>
                    }
                    </Button>
                </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="publicWebcams" className="mt-6">
          <div className="bg-card p-6 rounded-lg shadow-lg space-y-6">
            <Alert variant="default">
              <Youtube className="h-4 w-4" />
              <AlertTitle>Public Live Webcams</AlertTitle>

            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {YOUTUBE_STREAMS.map((stream) => (
                <div key={stream.embedUrl} className="rounded-lg overflow-hidden shadow-md">
                  <div className="aspect-video">
                    <iframe
                      width="100%"
                      height="100%"
                      src={stream.embedUrl}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="rounded-md"
                    ></iframe>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="mt-6">
          <section aria-labelledby="incidents-tab-heading">
            <h2 id="incidents-tab-heading" className="text-2xl font-semibold mb-6 text-primary flex items-center">
              <ShieldCheck className="mr-3 h-7 w-7" />
              All Detected Incidents
            </h2>
            <AlertList />
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    