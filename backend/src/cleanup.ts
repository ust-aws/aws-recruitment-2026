import { deleteAllDocumentObjects } from "./lib/documents";

export async function handler(): Promise<void> {
  await deleteAllDocumentObjects();
}
