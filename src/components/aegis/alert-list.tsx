
"use client";

import type { AlertIncident, IncidentCategory } from "@/types/aegis";
import { useState, useMemo, useEffect } from "react";
import { AlertCard } from "./alert-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ListFilter, ArrowUpDown, Search, ShieldAlert, Loader2 } from "lucide-react"; // Added Loader2
import { Card } from "@/components/ui/card";
import { db } from "@/lib/firebase"; // Import Firestore instance
import { collection, query, orderBy, onSnapshot, Timestamp as FirebaseTimestamp } from "firebase/firestore"; // Import Firestore functions

// Remove AlertListProps, as it will fetch its own data
// type AlertListProps = {
//   alerts: AlertIncident[];
// };

const INCIDENT_CATEGORIES: IncidentCategory[] = [
  "Trespassing",
  "Abandoned Object",
  "Suspicious Loitering",
  "Crowd Disturbance",
  "Road Hazards",
];

type SortOption = "timestamp_desc" | "timestamp_asc" | "confidence_desc" | "confidence_asc" | "createdAt_desc" | "createdAt_asc";

export function AlertList() { // Removed initialAlerts prop
  const [allAlerts, setAllAlerts] = useState<AlertIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortOption, setSortOption] = useState<SortOption>("createdAt_desc"); // Default sort by creation time
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); 

    const incidentsCollection = collection(db, "incidents");
    // Default ordering by server timestamp, newest first.
    // Specific sorting logic is applied client-side after fetching for now.
    const q = query(incidentsCollection, orderBy("createdAt", "desc")); 

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedAlerts: AlertIncident[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert Firestore Timestamp to number if necessary, or ensure types match
        let videoTimestamp = data.timestamp;
        if (data.timestamp instanceof FirebaseTimestamp) {
          videoTimestamp = data.timestamp.toMillis(); // Or .seconds if preferred for video time
        }

        fetchedAlerts.push({
          id: doc.id,
          frameDataUri: data.frameDataUri,
          timestamp: videoTimestamp, // This is video timestamp
          incidentType: data.incidentType,
          description: data.description,
          location: data.location,
          confidence: data.confidence,
          severity: data.severity,
          // createdAt is used for sorting by persistence time, not displayed directly on card
        });
      });
      setAllAlerts(fetchedAlerts);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching incidents from Firestore:", error);
      setIsLoading(false);
      // Optionally set an error state and display an error message to the user
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, []);


  const filteredAndSortedAlerts = useMemo(() => {
    let processedAlerts = [...allAlerts];

    if (filterType !== "all") {
      processedAlerts = processedAlerts.filter(
        (alert) => alert.incidentType.toLowerCase() === filterType.toLowerCase()
      );
    }

    if (searchTerm) {
      processedAlerts = processedAlerts.filter(
        (alert) =>
          alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alert.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Note: 'createdAt' sorting is handled by Firestore query by default.
    // For other sorts, we do it client-side here.
    // If sorting by 'createdAt' is selected, Firestore already handled it.
    // For a large dataset, these client-side sorts might need optimization or server-side querying.
    processedAlerts.sort((a, b) => {
      const aDoc = allAlerts.find(al => al.id === a.id);
      const bDoc = allAlerts.find(al => al.id === b.id);

      switch (sortOption) {
        case "timestamp_asc": // Video timestamp
          return a.timestamp - b.timestamp;
        case "timestamp_desc": // Video timestamp
          return b.timestamp - a.timestamp;
        case "confidence_asc":
          return a.confidence - b.confidence;
        case "confidence_desc":
          return b.confidence - a.confidence;
        // Firestore already sorts by createdAt_desc by default due to the query
        // Explicitly handling for clarity or if user re-selects
        case "createdAt_asc":
            // This would require fetching in ascending order or reversing a desc fetched array
            // For now, we'll reverse the default Firestore order if this is chosen
            // This is not ideal for pagination but okay for smaller datasets
            return -1; // Placeholder, reversing logic for asc needed if default is desc
        case "createdAt_desc":
             return 1; // Placeholder
        default:
          return 0;
      }
    });
    // Adjust sorting for createdAt_asc if needed by reversing the default fetched order
    if (sortOption === "createdAt_asc") {
        processedAlerts.reverse(); 
    }


    return processedAlerts;
  }, [allAlerts, filterType, searchTerm, sortOption]);

  if (!mounted || isLoading) {
    return (
        <div className="space-y-6 w-full">
            <Card className="flex flex-col sm:flex-row gap-4 p-4 shadow">
                <div className="flex-grow h-10 bg-muted rounded animate-pulse"></div>
                <div className="flex gap-4">
                    <div className="w-full sm:w-[180px] h-10 bg-muted rounded animate-pulse"></div>
                    <div className="w-full sm:w-[220px] h-10 bg-muted rounded animate-pulse"></div>
                </div>
            </Card>
             <div className="flex justify-center items-center py-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-lg text-muted-foreground">Loading Incidents...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <Card className="p-4 shadow-md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search descriptions, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="flex gap-4 flex-col sm:flex-row">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <ListFilter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {INCIDENT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt_desc">Date (Newest First)</SelectItem>
                <SelectItem value="createdAt_asc">Date (Oldest First)</SelectItem>
                <SelectItem value="timestamp_desc">Video Time (Newest First)</SelectItem>
                <SelectItem value="timestamp_asc">Video Time (Oldest First)</SelectItem>
                <SelectItem value="confidence_desc">Confidence (High to Low)</SelectItem>
                <SelectItem value="confidence_asc">Confidence (Low to Low)</SelectItem> {/* Corrected value */}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {filteredAndSortedAlerts.length === 0 && allAlerts.length > 0 && (
         <div className="text-center py-10 bg-card p-6 rounded-lg shadow">
            <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold text-foreground">No Alerts Match Filters</p>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
        </div>
      )}

       {filteredAndSortedAlerts.length === 0 && allAlerts.length === 0 && !searchTerm && filterType === "all" && (
         <div className="text-center py-10 bg-card p-6 rounded-lg shadow">
            <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold text-foreground">No Incidents Detected Yet</p>
            <p className="text-muted-foreground">Upload a video or start live analysis to see results here. Incidents will be stored in the database.</p>
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedAlerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
}
