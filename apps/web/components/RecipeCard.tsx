'use client';

import { kr } from '@/lib/format';
import { formatQty, ingredientById } from '@/lib/ingredients';
import type { Recipe } from '@/lib/recipes';
import { scaleFactor } from '@/lib/engine';

/**
 * A dish unfolded inside the week view: scaled ingredients, steps, and the
 * actions "Byt ret" / "Tilbage til planens ret".
 */
export function RecipeCard({
  recipe,
  persons,
  cost,
  swapped,
  onSwap,
  onReset,
}: {
  recipe: Recipe;
  persons: number;
  cost: number;
  swapped: boolean;
  onSwap: () => void;
  onReset?: () => void;
}) {
  const f = scaleFactor(recipe, persons);
  return (
    <div className="recipe" role="region" aria-label={recipe.title}>
      <div className="row wrap ac" style={{ gap: 10 }}>
        <span className="mono">
          {recipe.kcalPerServing} kcal / portion · {recipe.prepMin} min · {persons} pers · ca. {kr(cost)}
        </span>
        {swapped && <span className="chip on">Byttet ind</span>}
      </div>
      <div className="recipe-cols">
        <div>
          <p className="mono" style={{ marginBottom: 6 }}>
            Ingredienser
          </p>
          <ul className="recipe-list">
            {recipe.lines.map((l) => (
              <li key={l.ingredientId}>
                <span>{ingredientById(l.ingredientId).name}</span>
                <span className="s">{formatQty(l.qty * f, l.unit)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mono" style={{ marginBottom: 6 }}>
            Sådan gør du
          </p>
          <ol className="recipe-steps">
            {recipe.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      </div>
      <div className="row wrap" style={{ gap: 8 }}>
        <button type="button" className="chip on" onClick={onSwap}>
          Byt ret →
        </button>
        {swapped && onReset && (
          <button type="button" className="chip" onClick={onReset}>
            Tilbage til planens ret
          </button>
        )}
      </div>
    </div>
  );
}
