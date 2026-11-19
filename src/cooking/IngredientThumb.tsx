import { useState } from 'react';
import { ingredientById, ingredientImageUrl } from './ingredients';

export function IngredientThumb({
  id,
  className = 'ing-thumb',
}: {
  id: string;
  className?: string;
}) {
  const item = ingredientById(id);
  const [broken, setBroken] = useState(false);
  if (broken) {
    return <span className={className} aria-hidden="true">{item.emoji}</span>;
  }
  return (
    <img
      className={className}
      src={ingredientImageUrl(id)}
      alt=""
      draggable={false}
      onError={() => setBroken(true)}
    />
  );
}
