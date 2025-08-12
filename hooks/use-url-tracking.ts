import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export interface UrlChangeEvent {
  url: string;
  pathname: string;
  search: string;
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
  const searchParams = useSearchParams();
  const previousUrl = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentUrl = window.location.href;
    const currentPathname = pathname;
    const currentSearch = searchParams.toString();
    const search = currentSearch ? `?${currentSearch}` : "";

    if (currentUrl !== previousUrl.current) {
      const urlChangeEvent: UrlChangeEvent = {
        url: currentUrl,
        pathname: currentPathname,
        search,
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
  }, [pathname, searchParams, onUrlChange, sendToParent, autoNotifyParent]);

  useEffect(() => {
    if (typeof window !== "undefined" && !previousUrl.current) {
      previousUrl.current = window.location.href;
    }
  }, []);

  return {
    currentUrl: typeof window !== "undefined" ? window.location.href : "",
    pathname,
    search: searchParams.toString(),
  };
}
