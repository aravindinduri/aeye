
"use client";

import type { AlertIncident } from "@/types/aegis";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { AlertTriangle, Clock, MapPin, Percent, ShieldAlert, Timer } from "lucide-react";
import { format } from 'date-fns';

type AlertCardProps = {
  alert: AlertIncident;
};

export function AlertCard({ alert }: AlertCardProps) {
  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "destructive";
      case "high":
        return "default"; 
      case "medium":
        return "secondary";
      case "low":
      default:
        return "outline";
    }
  };

  const displaySeverity = alert.severity || "Unknown";

  // Regex to extract ISO timestamp and the rest of the description
  const timestampRegex = /^Observed at (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z):\s*/i;
  const match = alert.description.match(timestampRegex);

  let formattedRealWorldTime: string | null = null;
  let coreDescription = alert.description;

  if (match && match[1]) {
    try {
      const date = new Date(match[1]);
      // Example format: "6:35 PM on Jul 29, 2024"
      formattedRealWorldTime = format(date, "h:mm a 'on' MMM d, yyyy"); 
      coreDescription = alert.description.replace(timestampRegex, '').trim();
    } catch (e) {
      console.error("Failed to parse date from description:", alert.description, e);
      // Keep original description if parsing fails, realWorldTime remains null
    }
  }


  return (
    <Card className="w-full overflow-hidden shadow-md transition-all hover:shadow-lg">
      <CardHeader className="p-0">
        {alert.frameDataUri && (
          <div className="relative aspect-video w-full">
            <Image
              src={alert.frameDataUri}
              alt={`Incident frame at ${alert.timestamp}s`}
              layout="fill"
              objectFit="cover"
              data-ai-hint="security footage"
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center text-xl">
            <AlertTriangle className="mr-2 h-6 w-6 text-destructive" />
            {alert.incidentType}
          </CardTitle>
          <Badge variant={getSeverityBadgeVariant(displaySeverity)} className="ml-2 shrink-0">
            <ShieldAlert className="mr-1 h-3 w-3" />
            {displaySeverity}
          </Badge>
        </div>
        <CardDescription className="text-foreground/80">{coreDescription}</CardDescription>

        <div className="flex flex-col space-y-1 text-sm text-muted-foreground">
          {formattedRealWorldTime && (
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-primary" /> {/* Changed icon color for differentiation */}
              Detected: {formattedRealWorldTime}
            </div>
          )}
          <div className="flex items-center">
            <Timer className="mr-2 h-4 w-4" />
            Video Time: {alert.timestamp.toFixed(1)}s
          </div>
          <div className="flex items-center">
            <MapPin className="mr-2 h-4 w-4" />
            Location: {alert.location}
          </div>
          <div className="flex items-center">
             <Percent className="mr-2 h-4 w-4" />
            Confidence:
            <Badge variant={alert.confidence > 0.7 ? "default" : "secondary"} className="ml-1 bg-primary/10 text-primary">
              {(alert.confidence * 100).toFixed(0)}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

    