"use client";

import React from "react";

interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

/**
 * A very simple word-based diffing algorithm.
 * For production, consider 'diff-match-patch' or 'jsdiff'.
 */
function simpleDiff(oldText: string, newText: string): DiffPart[] {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);
  
  const diff: DiffPart[] = [];
  let i = 0;
  let j = 0;

  while (i < oldWords.length || j < newWords.length) {
    if (i < oldWords.length && j < newWords.length && oldWords[i] === newWords[j]) {
      diff.push({ value: oldWords[i] });
      i++;
      j++;
    } else {
      // Find where they sync up again
      let oldLookahead = i + 1;
      let newLookahead = j + 1;
      let found = false;

      while (oldLookahead < oldWords.length && !found) {
        if (oldWords[oldLookahead] === newWords[j]) {
          // Words in old were removed
          for (let k = i; k < oldLookahead; k++) {
            diff.push({ value: oldWords[k], removed: true });
          }
          i = oldLookahead;
          found = true;
          break;
        }
        oldLookahead++;
      }

      if (!found) {
        while (newLookahead < newWords.length && !found) {
          if (newWords[newLookahead] === oldWords[i]) {
            // Words in new were added
            for (let k = j; k < newLookahead; k++) {
              diff.push({ value: newWords[k], added: true });
            }
            j = newLookahead;
            found = true;
            break;
          }
          newLookahead++;
        }
      }

      if (!found) {
        // Both changed
        if (i < oldWords.length) diff.push({ value: oldWords[i], removed: true });
        if (j < newWords.length) diff.push({ value: newWords[j], added: true });
        i++;
        j++;
      }
    }
  }

  return diff;
}

interface DiffViewerProps {
  oldText: string;
  newText: string;
  className?: string;
}

export function DiffViewer({ oldText, newText, className = "" }: DiffViewerProps) {
  const diffParts = simpleDiff(oldText, newText);

  return (
    <div className={`font-mono text-sm whitespace-pre-wrap leading-relaxed ${className}`}>
      {diffParts.map((part, index) => {
        if (part.added) {
          return (
            <span key={index} className="bg-emerald-500/20 text-emerald-400 px-0.5 rounded border border-emerald-500/20 inline-block m-0.5">
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span key={index} className="bg-red-500/20 text-red-400 px-0.5 rounded border border-red-500/20 line-through inline-block m-0.5">
              {part.value}
            </span>
          );
        }
        return <span key={index} className="text-foreground/80">{part.value}</span>;
      })}
    </div>
  );
}
