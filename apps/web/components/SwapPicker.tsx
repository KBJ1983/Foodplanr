'use client';

import { useMemo } from 'react';
import { swapDelta, type PricingInput } from '@/lib/engine';
import { kr } from '@/lib/format';
import { RECIPES } from '@/lib/recipes';

/** Pick another dish for a day. Shows kcal, time and what it does to the week's price. */
export function SwapPicker({
  input,
  dayIndex,
  currentRecipeId,
  onPick,
  onClose,
}: {
  input: PricingInput;
  dayIndex: number;
  currentRecipeId: string;
  onPick: (recipeId: string) => void;
  onClose: () => void;
}) {
  const options = useMemo(
    () =>
      RECIPES.filter((r) => r.id !== currentRecipeId)
        .map((r) => ({ recipe: r, delta: swapDelta(input, dayIndex, r.id) }))
        .sort((a, b) => a.delta - b.delta),
    [input, dayIndex, currentRecipeId],
  );

  return (
    <div className="recipe" role="dialog" aria-label="Byt ret">
      <div className="row sb ac">
        <p className="h2">Vælg en anden ret</p>
        <button type="button" className="chip" onClick={onClose}>
          Luk
        </button>
      </div>
      <p className="s">Prisen viser ændringen for hele ugen med jeres butikker og ugens tilbud.</p>
      <div className="col" style={{ gap: 0 }}>
        {options.map(({ recipe, delta }) => (
          <button key={recipe.id} type="button" className="li" onClick={() => onPick(recipe.id)}>
            <span>
              <b>{recipe.title}</b>
              <span className="s">
                {' '}
                · {recipe.kcalPerServing} kcal · {recipe.prepMin} min
              </span>
            </span>
            <span className="s" style={{ whiteSpace: 'nowrap', fontWeight: 700, opacity: 1, color: delta < 0 ? 'var(--a-dark)' : undefined }}>
              {delta === 0 ? '± 0 kr' : delta > 0 ? `+ ${kr(delta)}` : `− ${kr(-delta)}`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
