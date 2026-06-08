import { createServer } from "node:http";

const targetBaseUrl = process.env.OLLAMA_TARGET_URL || "http://127.0.0.1:11434";
const requiredToken = process.env.OLLAMA_PROXY_TOKEN;
const port = Number(process.env.OLLAMA_PROXY_PORT || 41134);

if (!requiredToken) {
  console.error("OLLAMA_PROXY_TOKEN is required.");
  process.exit(1);
}

function sendJson(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function forwardedHeaders(request) {
  const headers = {};
  for (const [key, value] of Object.entries(request.headers)) {
    if (!value) continue;
    if (["authorization", "connection", "content-length", "host", "transfer-encoding"].includes(key)) continue;
    headers[key] = Array.isArray(value) ? value.join(", ") : value;
  }
  return headers;
}

const server = createServer(async (request, response) => {
  try {
    if (request.url === "/__belife_proxy_health") {
      sendJson(response, 200, { ok: true, target: targetBaseUrl });
      return;
    }

    if (request.headers.authorization !== `Bearer ${requiredToken}`) {
      sendJson(response, 401, { error: "Unauthorized" });
      return;
    }

    if (!request.url?.startsWith("/api/")) {
      sendJson(response, 404, { error: "Not found" });
      return;
    }

    const body = await readBody(request);
    const upstream = await fetch(new URL(request.url, targetBaseUrl), {
      method: request.method,
      headers: forwardedHeaders(request),
      body: body.length > 0 ? body : undefined,
    });
    const upstreamBody = Buffer.from(await upstream.arrayBuffer());
    const headers = Object.fromEntries(upstream.headers.entries());
    delete headers["content-encoding"];
    delete headers["content-length"];
    delete headers["transfer-encoding"];
    response.writeHead(upstream.status, headers);
    response.end(upstreamBody);
  } catch (error) {
    sendJson(response, 502, {
      error: error instanceof Error ? error.message : "Proxy request failed",
    });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`BELIFE Ollama auth proxy listening on http://127.0.0.1:${port}`);
  console.log(`Forwarding to ${targetBaseUrl}`);
});
