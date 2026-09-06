// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from "vitest";
import { renderGallery } from "../src/gallery/gallery.js";

function setGrid() {
  document.body.innerHTML = '<div id="gallery-grid"></div>';
  return document.getElementById("gallery-grid");
}

describe("renderGallery", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("não lança quando #gallery-grid não existe na página", () => {
    expect(() => renderGallery([])).not.toThrow();
  });

  it("mostra o estado 'em breve' quando não há peças (estado atual da Ana 3D)", () => {
    const grid = setGrid();

    renderGallery([]);

    expect(grid.querySelector(".gallery-empty")).not.toBeNull();
    expect(grid.textContent).toContain("portfólio");
  });

  it("mostra o estado 'em breve' quando items é undefined", () => {
    const grid = setGrid();

    renderGallery(undefined);

    expect(grid.querySelector(".gallery-empty")).not.toBeNull();
  });

  it("renderiza um card por peça, com título e tags, quando houver itens", () => {
    const grid = setGrid();

    renderGallery([
      { title: "Porta-retrato família", img: "/foo.jpg", tags: ["Presente", "Rosa"] },
      { title: "Enfeite de mesa", img: "/bar.jpg", tags: [] }
    ]);

    const items = grid.querySelectorAll(".gallery-item");
    expect(items).toHaveLength(2);
    expect(grid.textContent).toContain("Porta-retrato família");
    expect(grid.querySelectorAll(".gallery-tag")).toHaveLength(2);
  });

  it("escapa peças sem tags sem quebrar a renderização", () => {
    const grid = setGrid();

    expect(() =>
      renderGallery([{ title: "Sem tags", img: "/foo.jpg" }])
    ).not.toThrow();
    expect(grid.querySelectorAll(".gallery-item")).toHaveLength(1);
  });
});
