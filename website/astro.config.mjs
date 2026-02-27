import starlight from "@astrojs/starlight";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Convert mermaid code blocks to plain divs before Shiki runs, preserving exact source.
// HTML-escape the content so characters like `<br>` aren't interpreted as HTML by the
// browser: mermaid reads textContent which decodes entities back to the original source.
function remarkMermaid() {
  return function walk(node) {
    if (node.type === "code" && node.lang === "mermaid") {
      const escaped = node.value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      node.type = "html";
      node.value = `<div class="mermaid not-prose my-6">${escaped}</div>`;
      delete node.lang;
      return;
    }
    if (node.children) node.children.forEach(walk);
  };
}

// Strip .md from relative internal links so spec cross-references work in the website
function rehypeFixMdLinks() {
  return function walk(tree) {
    if (tree.type === "element" && tree.tagName === "a") {
      const href = tree.properties && tree.properties.href;
      if (
        typeof href === "string" &&
        !href.startsWith("http") &&
        !href.startsWith("//")
      ) {
        // Strip .md (with optional #fragment) and fix relative paths for trailing-slash routing
        const mdMatch = href.match(/^(.*)\.md(#.*)?$/);
        if (mdMatch) {
          let newHref = mdMatch[1] + (mdMatch[2] || "");
          // ./foo → ../foo so relative links resolve as siblings under trailing-slash URLs
          if (newHref.startsWith("./")) {
            newHref = "../" + newHref.slice(2);
          }
          tree.properties.href = newHref;
        }
      }
    }
    if (tree.children) {
      tree.children.forEach(walk);
    }
  };
}

const site = "https://www.dds.xyz";

export default defineConfig({
  site,
  integrations: [
    starlight({
      title: "DDS",
      favicon: "/favicon.svg",
      logo: {
        src: "./public/icon.svg",
        alt: "DDS",
        replacesTitle: false,
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/dds-wg/dds",
        },
      ],
      sidebar: [
        {
          label: "Core Specification",
          items: [
            {
              label: "DDS Protocol",
              link: "/spec/dds-protocol/",
            },
            {
              label: "Design Rationale",
              link: "/spec/design-rationale/",
            },
          ],
        },
        {
          label: "Addenda",
          items: [
            {
              label: "Anonymity Addendum",
              link: "/spec/anonymity-addendum/",
            },
            {
              label: "Implementation Addendum",
              link: "/spec/implementation-addendum/",
            },
          ],
        },
      ],
      head: [
        {
          tag: "script",
          attrs: { type: "module" },
          content: `
            import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
            mermaid.initialize({ startOnLoad: false });
            await mermaid.run({ querySelector: '.mermaid' });
            if (location.hash) {
              const el = document.getElementById(location.hash.slice(1));
              if (el) el.scrollIntoView();
            }
          `,
        },
        {
          tag: "meta",
          attrs: { property: "og:image", content: `${site}/og-image.png` },
        },
        {
          tag: "meta",
          attrs: { property: "og:image:width", content: "1200" },
        },
        {
          tag: "meta",
          attrs: { property: "og:image:height", content: "630" },
        },
        {
          tag: "meta",
          attrs: { property: "og:image:type", content: "image/png" },
        },
      ],
      customCss: ["./src/styles/starlight.css"],
    }),
    svelte(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  output: "static",
  trailingSlash: "always",
  markdown: {
    remarkPlugins: [remarkMermaid],
    rehypePlugins: [rehypeFixMdLinks],
    shikiConfig: {
      theme: "github-light",
    },
  },
});
