import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  },
);
export default function ExcalidrawWrapper({ onReady }: { onReady?: (api: any) => void }) {
  return <Excalidraw
    excalidrawAPI={(api: any) => {
      if (onReady) {
        onReady(api);
      }
    }}
  />;
}

// Utility function to export diagram as image
export async function exportDiagramAsImage(
  api: ExcalidrawImperativeAPI
): Promise<string | null> {
  try {
    const { exportToBlob } = await import('@excalidraw/excalidraw');
    const elements = api.getSceneElements();
    const appState = api.getAppState();

    const blob = await exportToBlob({
      elements,
      appState,
      files: api.getFiles(),
      mimeType: 'image/png',
    });

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error exporting diagram:', error);
    return null;
  }
}
