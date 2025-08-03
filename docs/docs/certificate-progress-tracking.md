# Certificate Generation Progress Tracking

This document describes the certificate generation progress tracking system implemented for GitHub issue #35.

## Overview

The progress tracking system provides real-time updates during certificate generation, allowing users to monitor the progress of their certificate generation requests. The system is designed to be temporary and does not persist progress data to the database.

## Architecture

### Components

1. **Progress Tracker Service** (`lib/services/certificate-progress-tracker.ts`)
   - Manages progress state in memory
   - Provides real-time updates via EventEmitter
   - Handles progress cleanup and analytics

2. **Progress API** (`app/api/certificates/progress/[id]/route.ts`)
   - Server-Sent Events (SSE) endpoint for real-time updates
   - REST endpoint for cancellation
   - Rate limiting and authentication

3. **Progress Indicator Component** (`components/ui/certificate-progress-indicator.tsx`)
   - React component for displaying progress
   - Real-time connection to progress stream
   - User-friendly progress visualization

4. **Updated Generation Dialog** (`components/ui/certificate-generation-dialog.tsx`)
   - Integrates progress tracking into existing dialog
   - Shows progress indicator when generation starts

## Progress Stages

The certificate generation process is divided into the following stages:

1. **Initializing** - Setting up the generation process
2. **Template Loading** - Loading certificate template from database
3. **Data Validation** - Validating transaction and entity data
4. **PDF Generation** - Converting template to PDF format
5. **File Preparation** - Finalizing certificate file
6. **Download Ready** - Certificate ready for download
7. **Completed** - Generation finished successfully

## Usage

### Basic Progress Tracking

```typescript
import { certificateProgressTracker } from "@/lib/services/certificate-progress-tracker";

// Initialize progress tracking
const progressId = certificateProgressTracker.initializeProgress(
  transactionId,
  userId,
  {
    timeout: 5 * 60 * 1000, // 5 minutes
    enableCancellation: true,
    enablePersistence: false,
  },
);

// Update progress during generation
certificateProgressTracker.updateProgress(
  progressId,
  "template_loading",
  50,
  "Loading template...",
);

// Complete a stage
certificateProgressTracker.completeStage(
  progressId,
  "template_loading",
  "Template loaded successfully",
);

// Complete generation
certificateProgressTracker.completeGeneration(progressId, {
  certificateNumber: "CERT2024001",
  fileSize: 1024,
  checksum: "abc123",
});
```

### Real-time Updates

```typescript
// Subscribe to progress updates
const unsubscribe = certificateProgressTracker.subscribeToProgress(
  progressId,
  (update) => {
    console.log(`Progress: ${update.progress}% - ${update.message}`);

    if (update.status === "completed") {
      console.log("Generation completed!");
      unsubscribe();
    }
  },
);
```

### React Component Usage

```tsx
import { CertificateProgressIndicator } from "@/components/ui/certificate-progress-indicator";

function MyComponent() {
  const [progressId, setProgressId] = useState<string | null>(null);

  return (
    <div>
      {progressId && (
        <CertificateProgressIndicator
          progressId={progressId}
          onComplete={(result) => {
            console.log("Generation completed:", result);
          }}
          onCancel={() => {
            setProgressId(null);
          }}
          onError={(error) => {
            console.error("Generation failed:", error);
          }}
        />
      )}
    </div>
  );
}
```

## API Endpoints

### GET /api/certificates/progress/[id]

Streams real-time progress updates using Server-Sent Events.

**Headers:**

- `Authorization`: Bearer token required

**Response:** Server-Sent Events stream with JSON progress updates

**Example:**

```javascript
const eventSource = new EventSource(`/api/certificates/progress/${progressId}`);

eventSource.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log(`Progress: ${update.progress}%`);
};
```

### DELETE /api/certificates/progress/[id]

Cancels an active certificate generation.

**Headers:**

- `Authorization`: Bearer token required

**Response:**

```json
{
  "success": true
}
```

## Error Handling

The progress tracking system includes comprehensive error handling:

- **Timeout Handling**: Automatic timeout after 5 minutes (configurable)
- **Connection Recovery**: Automatic reconnection for SSE streams
- **Graceful Degradation**: Falls back to traditional generation if progress tracking fails
- **Error Propagation**: Detailed error messages for debugging

## Analytics

The system provides analytics for completed generations:

```typescript
const analytics = certificateProgressTracker.getProgressAnalytics(progressId);

if (analytics) {
  console.log(`Total duration: ${analytics.totalDuration}ms`);
  console.log(`Average progress rate: ${analytics.averageProgressRate}%/s`);
  console.log(`Stage durations:`, analytics.stageDurations);
}
```

## Configuration

### Progress Options

```typescript
interface ProgressOptions {
  timeout?: number; // Default: 5 minutes
  enableCancellation?: boolean; // Default: true
  enablePersistence?: boolean; // Default: false
  updateInterval?: number; // Default: 500ms
}
```

### Rate Limiting

- **SSE Connections**: 10 per minute per user
- **Generation Requests**: 5 per minute per user
- **Cancellation Requests**: No specific limit

## Testing

Run the progress tracking tests:

```bash
npm test -- lib/services/certificate-progress-tracker.test.ts
```

## Cleanup

Progress data is automatically cleaned up:

- **Completed/Failed**: Cleaned up after 1 minute
- **Old Data**: Cleaned up after 30 minutes
- **Manual Cleanup**: Available via `cleanup()` method

## Security Considerations

- Progress data is stored in memory only (not persisted)
- User authentication required for all operations
- Rate limiting prevents abuse
- Progress IDs are scoped to specific users
- Automatic cleanup prevents memory leaks

## Performance

- **Memory Usage**: Minimal overhead (~1KB per active generation)
- **Network**: Efficient SSE streaming with automatic reconnection
- **CPU**: Lightweight progress calculations
- **Scalability**: Designed for concurrent generations

## Troubleshooting

### Common Issues

1. **Connection Lost**: Automatic reconnection after 2 seconds
2. **Progress Not Updating**: Check if progressId is valid
3. **Generation Stuck**: Use cancellation endpoint
4. **Memory Leaks**: Automatic cleanup prevents this

### Debug Mode

Enable debug logging by setting the logger in the progress tracker:

```typescript
certificateProgressTracker.logger = console; // Default
```

## Future Enhancements

- WebSocket support for bi-directional communication
- Progress persistence for long-running operations
- Advanced analytics and reporting
- Progress templates for different generation types
- Integration with external monitoring systems
