
export const extractFrames = (
  videoFile: File,
  intervalSeconds: number, // Interval in seconds
  onFrame: (frameDataUri: string, timestamp: number) => void,
  onProgress?: (progress: number) => void, // Progress from 0 to 100
  onError?: (error: string) => void
): Promise<void> => {
  const video = document.createElement('video');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  let fileURL: string | null = null; 

  try {
    fileURL = URL.createObjectURL(videoFile);
  } catch (e) {
    const errMessage = "Failed to create Object URL for video file. The file might be invalid or an issue with browser permissions.";
    if (e instanceof Error) {
        // console.error(errMessage, e.message);
    } else {
        // console.error(errMessage, String(e));
    }
    if (onError) onError(errMessage + (e instanceof Error ? ` Details: ${e.message}` : ''));
    return Promise.reject(new Error(errMessage));
  }

  return new Promise<void>((resolvePromise, rejectPromise) => {
    const mainResolve = () => {
      if (fileURL) {
        URL.revokeObjectURL(fileURL);
        fileURL = null; 
      }
      resolvePromise();
    };

    const mainReject = (error: Error) => {
      if (fileURL) {
        URL.revokeObjectURL(fileURL);
        fileURL = null; 
      }
      rejectPromise(error);
    };

    if (!fileURL) { // Should be caught by the try-catch above, but as a safeguard.
        mainReject(new Error("fileURL is null, cannot proceed."));
        return;
    }
    video.src = fileURL;
    video.muted = true;

    let currentTimestamp = 0;
    let processedFrames = 0;
    let totalEstimatedFrames = 0;

    const doProcessNextFrame = () => {
        if (!fileURL) { // Safeguard if URL was revoked prematurely
            mainReject(new Error("fileURL became null during processing."));
            return;
        }
        if (currentTimestamp <= video.duration) {
            video.currentTime = currentTimestamp;
        } else {
            if (video.currentTime < video.duration) {
                video.currentTime = video.duration; 
            } else {
                if (onProgress) onProgress(100);
                mainResolve();
            }
        }
    };
    
    video.onloadedmetadata = () => {
      if (!fileURL) { 
          mainReject(new Error("fileURL became null unexpectedly before metadata loaded."));
          return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (video.duration > 0) {
        totalEstimatedFrames = Math.max(1, Math.floor(video.duration / intervalSeconds));
      } else {
        totalEstimatedFrames = 0;
      }
      
      if (video.duration <= 0 || video.videoWidth === 0 || video.videoHeight === 0) {
        const noDimensionError = "Video file seems to have no duration or dimensions. It might be corrupted or not a valid video format.";
        if (onError) onError(noDimensionError);
        // console.warn(noDimensionError, "Aborting frame extraction.");
        if (onProgress) onProgress(100);
        mainResolve(); 
        return;
      }
      doProcessNextFrame(); 
    };

    video.onerror = () => {
      let detailedErrorMessage = "Error loading or processing video file.";
      if (video.error) {
        switch (video.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            detailedErrorMessage += " The fetching process was aborted by the user.";
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            detailedErrorMessage += " A network error caused the video download to fail.";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            detailedErrorMessage += " The video playback was aborted due to a corruption problem or because the video used features your browser does not support.";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            detailedErrorMessage += " The video could not be loaded, either because the server or network failed or because the format is not supported by your browser.";
            break;
          default:
            detailedErrorMessage += ` An unknown error occurred (Code: ${video.error.code}).`;
        }
        if (video.error.message) {
          detailedErrorMessage += ` Browser message: ${video.error.message}`;
        }
      } else {
        detailedErrorMessage += " No specific error details available from the video element. Ensure the file is a valid video format supported by your browser.";
      }
      
      console.error("Video Processor Error:", detailedErrorMessage, video.error || '(No video.error object)');
      if (onError) onError(detailedErrorMessage);
      mainReject(new Error(detailedErrorMessage));
    };
    
    video.onseeked = () => {
       if (!fileURL) { 
          mainReject(new Error("fileURL became null unexpectedly during seek."));
          return;
      }
      if (!context) {
        const errMessage = "Canvas context not available for drawing frame.";
        if (onError) onError(errMessage);
        mainReject(new Error(errMessage));
        return;
      }
      
      try {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameDataUri = canvas.toDataURL('image/jpeg'); // Use jpeg for smaller size and better compatibility
        onFrame(frameDataUri, video.currentTime);
      } catch (e) {
        const drawError = "Error drawing video frame to canvas or converting to Data URL.";
         if (onError) onError(drawError + (e instanceof Error ? ` Details: ${e.message}` : ''));
        // console.error(drawError, e);
        mainReject(new Error(drawError + (e instanceof Error ? ` ${e.message}` : '')));
        return; // Stop processing if drawing fails
      }
      
      processedFrames++;
      if (onProgress && totalEstimatedFrames > 0) {
        onProgress(Math.min(100, (processedFrames / totalEstimatedFrames) * 100));
      }
      
      currentTimestamp += intervalSeconds;
      doProcessNextFrame();
    };

    video.load(); // Start loading the video
  });
};
