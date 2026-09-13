export interface PickedFile {
  file: File;
  arrayBuffer: ArrayBuffer;
}

export async function readLocalFile(file: File): Promise<PickedFile> {
  const arrayBuffer = await file.arrayBuffer();
  return { file, arrayBuffer };
}
