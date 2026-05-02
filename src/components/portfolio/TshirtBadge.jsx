import React from 'react';
import { getTshirtColor } from '../../constants';

export default function TshirtBadge({ size, fallback = false, title }) {
  if (!size) return null;
  const color = getTshirtColor(size);
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
        ${color.bg} ${color.text}
        ${fallback ? 'border border-dashed border-current opacity-80' : ''}`}
      title={title || (fallback
        ? `T-shirt fallback: ${size} contributing estimated points`
        : `T-shirt size: ${size}`)}
    >
      {color.label}
    </span>
  );
}
