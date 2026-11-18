import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CookingGame } from './cooking/CookingGame';
import { FishingGame } from './fishing/FishingGame';

const game = new URLSearchParams(window.location.search).get('game') === 'cooking' ? 'cooking' : 'fishing';
document.title = game === 'cooking' ? '記憶烹飪' : '釣魚';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {game === 'cooking' ? <CookingGame /> : <FishingGame />}
  </StrictMode>,
);
