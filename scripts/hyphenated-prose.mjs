import english from "hyphen/en-us/index.js";

// Optional breaks keep narrow justified paragraphs readable on every device.
// Leave tags, entities and abbreviations intact; no browser script is
// needed, and a hyphen is only visible when a word actually crosses a line.
export function hyphenatedProse(html) {
  return String(html).split(/(<[^>]*>|&(?:#\d+|#x[\da-f]+|[a-z]+);)/gi).map(part => {
    if (part.startsWith("<") || part.startsWith("&")) return part;
    return part.replace(/\b[A-Z]?[a-z]{5,}\b/g, word => english.hyphenateSync(word, { minWordLength: 6 }));
  }).join("");
}
