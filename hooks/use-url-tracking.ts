import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export interface UrlChangeEvent {
  url: string;
  pathname: string;
  timestamp: number;
  previousUrl?: string;
}

export interface UseUrlTrackingOptions {
  onUrlChange?: (event: UrlChangeEvent) => void;
  sendToParent?: (type: string, data: any) => void;
  autoNotifyParent?: boolean;
  debug?: boolean;
}

export function useUrlTracking(options: UseUrlTrackingOptions = {}) {
  const { onUrlChange, sendToParent, autoNotifyParent = true } = options;

  const pathname = usePathname();
  const previousUrl = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentUrl = window.location.href;
    const currentPathname = pathname;

    if (currentUrl !== previousUrl.current) {
      const urlChangeEvent: UrlChangeEvent = {
        url: currentUrl,
        pathname: currentPathname,
        timestamp: Date.now(),
        previousUrl: previousUrl.current || undefined,
      };

      if (onUrlChange) {
        onUrlChange(urlChangeEvent);
      }

      if (autoNotifyParent && sendToParent) {
        sendToParent("url-changed", urlChangeEvent);
      }

      previousUrl.current = currentUrl;
    }
  }, [pathname, onUrlChange, sendToParent, autoNotifyParent]);

  useEffect(() => {
    if (typeof window !== "undefined" && !previousUrl.current) {
      previousUrl.current = window.location.href;
    }
  }, []);

  return {
    currentUrl: typeof window !== "undefined" ? window.location.href : "",
    pathname,
  };
}
