import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

const worker = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    const response = await runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
    // Keep streaming bodies intact while applying headers to otherwise immutable responses.
    const secured = new Response(response.body, response);
    secured.headers.set("X-Content-Type-Options", "nosniff");
    secured.headers.set("Referrer-Policy", "no-referrer");
    secured.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    // The host may embed the app. Preserve its frame policy and framework script handling.
    const existingPolicy = secured.headers.get("Content-Security-Policy");
    const baselinePolicy = "base-uri 'self'; object-src 'none'; form-action 'self'";
    secured.headers.set("Content-Security-Policy", existingPolicy ? `${existingPolicy}, ${baselinePolicy}` : baselinePolicy);
    const pathname = new URL(request.url).pathname;
    if (pathname === "/" || pathname === "/api" || pathname.startsWith("/api/")) {
      // Identity-bearing HTML and private JSON must never enter a shared CDN cache.
      secured.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
      secured.headers.set("CDN-Cache-Control", "no-store");
    }
    return secured;
  },
};

export default worker;
