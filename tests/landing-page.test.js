import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const htmlUrl = new URL("../index.html", import.meta.url);
const cssUrl = new URL("../assets/css/style.css", import.meta.url);

describe("landing page da Ana 3D", () => {
  it("usa a identidade visual da Ana 3D (logo e ícone fornecidos)", async () => {
    const html = await readFile(htmlUrl, "utf8");

    expect(html).toContain("assets/image/ana3d-logo.svg");
    expect(html).toContain("assets/image/ana3d_logoA.svg");
    expect(html).not.toContain("insight-logo");
  });

  it("contém as seções institucionais esperadas", async () => {
    const html = await readFile(htmlUrl, "utf8");

    for (const id of ["sobre", "servicos", "como-funciona", "portfolio", "imprimir", "contato"]) {
      expect(html).toContain(`id="${id}"`);
    }
  });

  it("preserva o contrato de data-attributes exigido por upload-shell/upload-view", async () => {
    const html = await readFile(htmlUrl, "utf8");

    const requiredAttributes = [
      "data-upload-root",
      "data-upload-eyebrow",
      "data-upload-title",
      "data-upload-file-meta",
      "data-upload-dropzone",
      "data-upload-input",
      "data-upload-select",
      "data-upload-status",
      "data-upload-limits",
      "data-upload-actions",
      "data-upload-retry",
      "data-upload-replace",
      "data-upload-remove"
    ];

    for (const attribute of requiredAttributes) {
      expect(html).toContain(attribute);
    }
  });

  it("preserva o contrato de data-attributes exigido por analysis-view (viewer 3D reutilizado)", async () => {
    const html = await readFile(htmlUrl, "utf8");

    const requiredAttributes = [
      "data-analysis-panel",
      "data-analysis-stage",
      "data-analysis-error",
      "data-analysis-retry",
      "data-analysis-result",
      "data-analysis-unit",
      "data-analysis-dimensions",
      "data-analysis-triangles",
      "data-analysis-meshes",
      "data-analysis-vertices",
      "data-analysis-area",
      "data-analysis-volume",
      "data-analysis-watertight",
      "data-analysis-open-edges",
      "data-analysis-non-manifold",
      "data-analysis-components",
      "data-analysis-warnings",
      "data-model-viewer",
      "data-viewer-unavailable"
    ];

    for (const attribute of requiredAttributes) {
      expect(html).toContain(attribute);
    }
  });

  it("carrega o mesmo ponto de entrada (src/main.js) usado pelo shell de upload", async () => {
    const html = await readFile(htmlUrl, "utf8");

    expect(html).toContain('src="/src/main.js"');
  });

  it("tem um alvo #gallery-grid para o portfólio renderizado via JS", async () => {
    const html = await readFile(htmlUrl, "utf8");

    expect(html).toContain('id="gallery-grid"');
  });
});

describe("responsividade estrutural do CSS", () => {
  it("colapsa grids de múltiplas colunas em telas menores", async () => {
    const css = await readFile(cssUrl, "utf8");

    expect(css).toContain("@media (max-width: 900px)");
    expect(css).toContain("@media (max-width: 640px)");
  });

  it("respeita prefers-reduced-motion", async () => {
    const css = await readFile(cssUrl, "utf8");

    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("usa a paleta rosa pastel / off-white pedida no briefing, não a paleta escura do Insight", async () => {
    const css = await readFile(cssUrl, "utf8");

    expect(css).toContain("--cream");
    expect(css).toContain("--blush");
    expect(css).toContain("--rose");
    expect(css).not.toContain("#0a0a0a");
  });
});
