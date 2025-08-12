import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface ParentMessage {
  type: string;
  data?: any;
  timestamp: number;
  source: "iframe-child";
}

export interface ParentMessageListener {
  (message: ParentMessage): void;
}

export interface UseParentCommunicationOptions {
  allowedOrigins?: string[];
}

export function useParentCommunication(
  options: UseParentCommunicationOptions = {}
) {
  const { allowedOrigins } = options;
  const router = useRouter();
  const messageListeners = useRef<Map<string, ParentMessageListener[]>>(
    new Map()
  );

  const sendToParent = useCallback(
    (type: string, data?: any, targetOrigin: string = "*") => {
      if (typeof window === "undefined" || !window.parent) return;

      const message: ParentMessage = {
        type,
        data,
        timestamp: Date.now(),
        source: "iframe-child",
      };

      try {
        window.parent.postMessage(message, targetOrigin);
      } catch (error) {
        console.error("[IframeChild] Error sending message to parent:", error);
      }
    },
    []
  );

  const addMessageListener = useCallback(
    (type: string, listener: ParentMessageListener) => {
      const listeners = messageListeners.current.get(type) || [];
      listeners.push(listener);
      messageListeners.current.set(type, listeners);

      return () => {
        const currentListeners = messageListeners.current.get(type) || [];
        const index = currentListeners.indexOf(listener);
        if (index > -1) {
          currentListeners.splice(index, 1);
          if (currentListeners.length === 0) {
            messageListeners.current.delete(type);
          } else {
            messageListeners.current.set(type, currentListeners);
          }
        }
      };
    },
    []
  );

  const isOriginAllowed = useCallback(
    (origin: string) => {
      if (!allowedOrigins || allowedOrigins.length === 0) return true;
      return allowedOrigins.includes(origin);
    },
    [allowedOrigins]
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!isOriginAllowed(event.origin)) {
        return;
      }

      try {
        const message = event.data;

        if (!message || typeof message !== "object" || !message.type) {
          return;
        }

        const listeners = messageListeners.current.get(message.type) || [];
        listeners.forEach((listener) => {
          try {
            listener(message);
          } catch (error) {
            console.error("[IframeChild] Error in message listener:", error);
          }
        });
      } catch (error) {
        console.error("[IframeChild] Error processing message:", error);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [isOriginAllowed]);

  useEffect(() => {
    const timer = setTimeout(() => {
      sendToParent("iframe-ready", {
        url: window.location.href,
        title: document.title,
        timestamp: Date.now(),
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [sendToParent]);

  return {
    sendToParent,
    addMessageListener,
    isInIframe: typeof window !== "undefined" && window.parent !== window,
  };
}
