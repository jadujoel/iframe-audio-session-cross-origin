import iframe from "./src/iframe.html";
import home from "./src/index.html";

export async function serve() {
  const server = Bun.serve({
    routes: {
      "/": home,
      "/iframe.html": iframe,
    },
    development: {
      hmr: true,
      console: true,
    },
  });
  console.log(`Server running at http://localhost:${server.port}`);
}

if (import.meta.main) {
  await serve();
}
