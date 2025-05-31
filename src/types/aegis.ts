
import type { AnalyzeFrameOutput } from '@/ai/flows/incident-detection';
import type { Timestamp } from 'firebase/firestore'; // For potential use

export interface VideoConfigFormData {
  videoFile: FileList;
  interval: number;
}

export interface AlertIncident {
  id: string; // Unique ID for this specific incident alert (Firestore document ID)
  frameDataUri: string; // Storing base64 directly. Consider Firebase Storage for prod.
  timestamp: number; // Timestamp in seconds relative to video start
  incidentType: string;
  description: string;
  location: string;
  confidence: number;
  severity: string; // e.g., Low, Medium, High, Critical
  createdAt?: Timestamp | Date; // Firestore server timestamp for when the doc was created
}

export type IncidentCategory = 
  | "Trespassing"
  | "Abandoned Object"
  | "Suspicious Loitering"
  | "Crowd Disturbance"
  | "Road Hazards";

// This represents the result of analyzing a single frame, which might contain multiple incidents
// This type might be less relevant now as incidents are saved individually
export interface FrameAnalysisResult {
  id: string; 
  frameDataUri: string;
  timestamp: number; 
  incidents: AnalyzeFrameOutput['incidents'];
}
