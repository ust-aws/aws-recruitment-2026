import { deleteAllDocumentObjects } from "./lib/applications/documents";

export async function handler(): Promise<void> {
  await deleteAllDocumentObjects();
}
