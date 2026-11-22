import JSZip from 'jszip';

export async function generateProjectZip(fileTree: Record<string, string>): Promise<Blob> {
  const zip = new JSZip();
  const root = zip.folder('RescueGrid');

  for (const [path, content] of Object.entries(fileTree)) {
    root?.file(path, content);
  }

  return await zip.generateAsync({ type: 'blob' });
}
