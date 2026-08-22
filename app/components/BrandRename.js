'use client';

import { useEffect } from 'react';

const replacements = [
  [/cityFUNHOP/g, 'KARAOKE RIDES'],
  [/cityFUN HOP/g, 'KARAOKE RIDES'],
  [/CityFUNHOP/g, 'KARAOKE RIDES'],
  [/CITYFUNHOP/g, 'KARAOKE RIDES']
];

function replaceText(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    let next = node.nodeValue;
    for (const [pattern, replacement] of replacements) {
      next = next.replace(pattern, replacement);
    }
    if (next !== node.nodeValue) node.nodeValue = next;
  }
}

export default function BrandRename() {
  useEffect(() => {
    replaceText(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            let next = node.nodeValue;
            for (const [pattern, replacement] of replacements) {
              next = next.replace(pattern, replacement);
            }
            if (next !== node.nodeValue) node.nodeValue = next;
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            replaceText(node);
          }
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
