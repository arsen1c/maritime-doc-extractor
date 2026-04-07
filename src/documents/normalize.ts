export type NormalizedPart =
  | { type: "text"; text: string }
  | { type: "image"; mimeType: string; dataBase64: string }
  | { type: "document"; mimeType: string; dataBase64: string };

export type NormalizedDocument = {
  mimeType: string;
  fileName: string;
  parts: NormalizedPart[];
};

export async function normalizeDocument(input: {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}): Promise<NormalizedDocument> {
  const dataBase64 = input.buffer.toString("base64");

  if (input.mimeType === "image/jpeg" || input.mimeType === "image/png") {
    return {
      mimeType: input.mimeType,
      fileName: input.fileName,
      parts: [{ type: "image", mimeType: input.mimeType, dataBase64 }],
    };
  }

  return {
    mimeType: input.mimeType,
    fileName: input.fileName,
    parts: [{ type: "document", mimeType: input.mimeType, dataBase64 }],
  };
}
