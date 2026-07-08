function normalizeText(input) {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/İ/g, "I")
    .replace(/ı/g, "i")
    .toUpperCase();
}

function normalizePath(input) {
  return normalizeText(input).replace(/\//g, "\\");
}

function toSlug(input) {
  return normalizeText(input)
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

module.exports = {
  normalizePath,
  normalizeText,
  toSlug,
};
