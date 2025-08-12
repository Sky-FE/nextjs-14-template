export interface ScreenshotOptions {
  format?: "png" | "jpeg" | "webp";
  quality?: number;
  width?: number;
  height?: number;
  scale?: number;
}

export interface ScreenshotResult {
  dataUrl: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

export async function captureScreenshot(
  options: ScreenshotOptions = {}
): Promise<ScreenshotResult> {
  const { format = "png", quality = 0.9, width, height, scale = 1 } = options;

  try {
    const html2canvas = await import("html2canvas");

    const canvas = await html2canvas.default(document.body, {
      allowTaint: true,
      useCORS: true,
      scale: scale,
      width: width,
      height: height,
      scrollX: 0,
      scrollY: 0,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      backgroundColor: null,
    });

    const mimeType = `image/${format}`;
    const dataUrl = canvas.toDataURL(mimeType, quality);

    return {
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      format,
      size: dataUrl.length,
    };
  } catch (error) {
    console.error("Screenshot capture failed:", error);
    throw new Error(
      "Failed to capture screenshot: " + (error as Error).message
    );
  }
}

export async function captureViewport(
  options: ScreenshotOptions = {}
): Promise<ScreenshotResult> {
  return captureScreenshot({
    ...options,
    width: window.innerWidth,
    height: window.innerHeight,
  });
}
