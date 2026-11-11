/** Order numbers look like MG-261112-A1B2C3. Shared by the browser (print labels) and the server. */
export const ORDER_NUMBER_RE = /^MG-\d{6}-[0-9A-F]{6}$/;

export function newOrderNumber(d = new Date()) {
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const bytes = crypto.getRandomValues(new Uint8Array(3));
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `MG-${ymd}-${hex}`;
}
