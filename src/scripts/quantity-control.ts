export function createQuantityControl(
  value: number,
  onChange: (value: number) => void,
) {
  const control = document.createElement("div");
  control.className = "model-quantity";

  const decrease = document.createElement("button");
  decrease.type = "button";
  decrease.textContent = "−";
  decrease.setAttribute("aria-label", "Diminuer la quantité");

  const input = document.createElement("input");
  input.type = "number";
  input.min = "1";
  input.step = "1";
  input.value = String(value);
  input.setAttribute("aria-label", "Quantité du modèle");

  const increase = document.createElement("button");
  increase.type = "button";
  increase.textContent = "+";
  increase.setAttribute("aria-label", "Augmenter la quantité");

  const update = (nextValue: number | string) =>
    onChange(Math.max(1, Math.floor(Number(nextValue) || 1)));
  decrease.addEventListener("click", () => update(Number(input.value) - 1));
  increase.addEventListener("click", () => update(Number(input.value) + 1));
  input.addEventListener("change", () => update(input.value));
  control.append(decrease, input, increase);
  return control;
}
