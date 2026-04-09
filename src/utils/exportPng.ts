import { toPng } from "html-to-image";

function downloadBlobUrl(filename: string, blobUrl: string): void {
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function exportCardPng(params: { element: HTMLElement; filename: string }) {
  const { element, filename } = params;
  const dataUrl = await toPng(element, {
    backgroundColor: "#ffffff",
    pixelRatio: 2
  });
  downloadBlobUrl(filename, dataUrl);
}

