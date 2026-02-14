import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { protocol } from "electron";

const TYPST_PROTOCOL = "plainsheet";
const TYPST_HOST = "typst";
const MAX_TYPST_CACHE_ENTRIES = 16;

const typstPreviewCache = new Map<string, Buffer<ArrayBuffer>>();
const typstPreviewOrder: string[] = [];

protocol.registerSchemesAsPrivileged([
  {
    scheme: TYPST_PROTOCOL,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
    },
  },
]);

const cacheTypstPreview = (png: Uint8Array): string => {
  const id = randomUUID();
  typstPreviewCache.set(id, Buffer.from(png));
  typstPreviewOrder.push(id);
  while (typstPreviewOrder.length > MAX_TYPST_CACHE_ENTRIES) {
    const evicted = typstPreviewOrder.shift();
    if (evicted) {
      typstPreviewCache.delete(evicted);
    }
  }
  return id;
};

const typstPreviewUrl = (id: string): string =>
  `${TYPST_PROTOCOL}://${TYPST_HOST}/${id}`;

export const storeTypstPreview = (png: Uint8Array): string =>
  typstPreviewUrl(cacheTypstPreview(png));

export const registerTypstProtocol = () => {
  protocol.handle(TYPST_PROTOCOL, (request) => {
    let url: URL;
    try {
      url = new URL(request.url);
    } catch {
      return new Response("Bad request", { status: 400 });
    }

    if (url.hostname !== TYPST_HOST) {
      return new Response("Not found", { status: 404 });
    }

    const id = url.pathname.replace(/^\/+/, "");
    if (!id) {
      return new Response("Not found", { status: 404 });
    }

    const buffer = typstPreviewCache.get(id);
    if (!buffer) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(buffer, {
      headers: {
        "content-type": "image/png",
        "cache-control": "no-store",
      },
    });
  });
};
