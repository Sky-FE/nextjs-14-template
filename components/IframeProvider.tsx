"use client";

import { useEffect, useCallback, ReactNode } from "react";
import { useParentCommunication } from "@/hooks/use-parent-communication";
import { useUrlTracking } from "@/hooks/use-url-tracking";
import { captureScreenshot, captureViewport } from "@/lib/screenshot";

const defaultScreenshotOptions = {
  format: "png",
  quality: 0.9,
  scale: 1,
};

export interface IframeProviderProps {
  children: ReactNode;
  allowedOrigins?: string[];
}

export function IframeProvider({
  children,
  allowedOrigins,
}: IframeProviderProps) {
  const { sendToParent, addMessageListener, isInIframe } =
    useParentCommunication({
      allowedOrigins,
    });

  useUrlTracking({
    sendToParent,
    autoNotifyParent: true,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reportError = (errorInfo: any) => {
      sendToParent("iframe-error", errorInfo);
    };

    const handleError = (event: ErrorEvent) => {
      reportError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        errorType: "javascript",
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportError({
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        errorType: "unhandledRejection",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, [sendToParent]);

  const handleScreenshotRequest = useCallback(
    async (message: any) => {
      try {
        const options = {
          ...defaultScreenshotOptions,
          ...message.data?.options,
        };

        let result;
        if (message.data?.type === "viewport") {
          result = await captureViewport(options);
        } else {
          result = await captureScreenshot(options);
        }

        sendToParent("screenshot", {
          success: true,
          screenshot: result,
          requestId: message.data?.requestId,
        });
      } catch (error) {
        sendToParent("screenshot", {
          success: false,
          error: (error as Error).message,
          requestId: message.data?.requestId,
        });
      }
    },
    [sendToParent, defaultScreenshotOptions]
  );

  useEffect(() => {
    const unsubscribeScreenshot = addMessageListener(
      "take-screenshot",
      handleScreenshotRequest
    );

    return () => {
      unsubscribeScreenshot();
    };
  }, [addMessageListener, handleScreenshotRequest]);

  return <>{children}</>;
}
