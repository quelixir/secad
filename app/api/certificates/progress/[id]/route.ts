import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { certificateProgressTracker } from "@/lib/services/certificate-progress-tracker";
import { rateLimit } from "@/lib/utils/rate-limit";

// Rate limiter: 10 connections per minute per user
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

/**
 * GET /api/certificates/progress/[id]
 * Stream progress updates for certificate generation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: progressId } = await params;
  const identifier =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "anonymous";

  try {
    // Rate limiting
    const { success } = await limiter.check(identifier, 10); // 10 connections per minute
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 },
      );
    }

    // Authenticate user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get current progress
    const progress = certificateProgressTracker.getProgress(progressId);
    if (!progress) {
      return NextResponse.json(
        { error: "Progress not found" },
        { status: 404 },
      );
    }

    // Check if user has access to this progress
    if (progress.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Set up Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send initial progress
        const initialData = {
          id: progress.id,
          status: progress.status,
          stage: progress.stage,
          progress: progress.progress,
          message: progress.message,
          error: progress.error,
          estimatedTimeRemaining: progress.estimatedTimeRemaining,
          stageProgress: progress.stageProgress,
          metadata: progress.metadata,
        };

        const initialMessage = `data: ${JSON.stringify(initialData)}\n\n`;
        controller.enqueue(encoder.encode(initialMessage));

        // Subscribe to progress updates
        const unsubscribe = certificateProgressTracker.subscribeToProgress(
          progressId,
          (update) => {
            const message = `data: ${JSON.stringify(update)}\n\n`;
            controller.enqueue(encoder.encode(message));

            // Close stream if generation is complete, failed, or cancelled
            if (
              update.status === "completed" ||
              update.status === "failed" ||
              update.status === "cancelled"
            ) {
              controller.close();
            }
          },
        );

        // Handle client disconnect
        request.signal.addEventListener("abort", () => {
          unsubscribe();
          controller.close();
        });

        // Handle timeout (5 minutes)
        const timeout = setTimeout(
          () => {
            unsubscribe();
            controller.close();
          },
          5 * 60 * 1000,
        );

        // Clean up on close
        const cleanup = () => {
          clearTimeout(timeout);
          unsubscribe();
        };

        request.signal.addEventListener("abort", cleanup);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch (error) {
    console.error("Error in progress stream:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/certificates/progress/[id]
 * Cancel certificate generation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: progressId } = await params;

  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get current progress
    const progress = certificateProgressTracker.getProgress(progressId);
    if (!progress) {
      return NextResponse.json(
        { error: "Progress not found" },
        { status: 404 },
      );
    }

    // Check if user has access to this progress
    if (progress.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if generation can be cancelled
    if (progress.status !== "in_progress" && progress.status !== "pending") {
      return NextResponse.json(
        { error: "Generation cannot be cancelled" },
        { status: 400 },
      );
    }

    // Cancel generation
    const cancelled = certificateProgressTracker.cancelGeneration(progressId);
    if (!cancelled) {
      return NextResponse.json(
        { error: "Failed to cancel generation" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling generation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
