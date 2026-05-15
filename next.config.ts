import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone build packages a minimal `server.js` + only the runtime deps
  // we need into `.next/standalone/`. Required for the Docker image.
  output: "standalone",

  // better-sqlite3 ships native bindings; keep it external so Next doesn't try
  // to bundle the .node binary. The tracer still needs to include the package
  // files in the standalone output.
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    "/*": ["./node_modules/better-sqlite3/**/*"],
  },
};

export default nextConfig;
