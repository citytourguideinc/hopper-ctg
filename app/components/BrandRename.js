'use client';

import { useEffect } from 'react';

const replacements = [
  [/cityFUNHOP/g, 'KARAOKE RIDES'],
  [/cityFUN HOP/g, 'KARAOKE RIDES'],
  [/CityFUNHOP/g, 'KARAOKE RIDES'],
  [/CITYFUNHOP/g, 'KARAOKE RIDES'],
  [/cityHOPPER/g, 'KARAOKE RIDES'],
  [/CityHOPPER/g, 'KARAOKE RIDES'],
  [/CITYHOPPER/g, 'KARAOKE RIDES']
];

function replaceString(value) {
  let next = value;
  for (const [pattern, replacement] of replacements) next = next.replace(pattern, replacement);
  return next;
}

function replaceText(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const next = replaceString(node.nodeValue || '');
    if (next !== node.nodeValue) node.nodeValue = next;
  }

  if (root.querySelectorAll) {
    root.querySelectorAll('[aria-label],[title],[alt],[placeholder]').forEach((el) => {
      ['aria-label','title','alt','placeholder'].forEach((attr) => {
        const value = el.getAttribute(attr);
        if (!value) return;
        const next = replaceString(value);
        if (next !== value) el.setAttribute(attr, next);
      });
    });
  }
}

export default function BrandRename() {
  useEffect(() => {
    replaceText(document.body);
    document.title = replaceString(document.title);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const next = replaceString(node.nodeValue || '');
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
