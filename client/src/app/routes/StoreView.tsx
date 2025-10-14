import { useState } from 'react';
import { updateLoadout } from '../../api/client';
import { useAppStore } from '../../state/appStore';

type LoadoutSlot = 'skin' | 'trail' | 'theme' | 'emote';

const SLOT_LABELS: Record<LoadoutSlot, string> = {
  skin: 'Skins',
  trail: 'Trails',
  theme: 'Themes',
  emote: 'Victory emotes'
};

export function StoreView() {
  const player = useAppStore((state) => state.player);
  const token = useAppStore((state) => state.token);
  const setPlayer = useAppStore((state) => state.setPlayer);
  const [saving, setSaving] = useState<LoadoutSlot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEquip = async (slot: LoadoutSlot, value: string) => {
    if (!player || !token) return;
    if (player.loadout[slot] === value) return;
    setSaving(slot);
    setError(null);
    try {
      const nextLoadout = { ...player.loadout, [slot]: value };
      const updated = await updateLoadout(token, player.id, nextLoadout);
      setPlayer(updated);
    } catch (err) {
      console.error(err);
      setError('Failed to update loadout. Try again later.');
    } finally {
      setSaving(null);
    }
  };

  const renderSlot = (slot: LoadoutSlot, items: string[]) => (
    <div className="store-section" key={slot}>
      <h4>{SLOT_LABELS[slot]}</h4>
      <ul className="store-grid">
        {items.length === 0 ? <li>No unlocks yet — keep progressing!</li> : null}
        {items.map((item) => (
          <li key={item}>
            <button
              className={`store-tile${player?.loadout[slot] === item ? ' is-active' : ''}`}
              onClick={() => handleEquip(slot, item)}
              disabled={saving === slot}
            >
              <span className="store-item">{item}</span>
              {player?.loadout[slot] === item ? <span className="store-active">Equipped</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="page-stack">
      <section className="surface">
        <header className="section-header">
          <div>
            <h2>Cosmetic loadout</h2>
            <p>Equip unlocked looks and celebrate victories in style.</p>
          </div>
        </header>
        {error ? <p className="form-error">{error}</p> : null}
        {player ? (
          <div className="store-stack">
            {renderSlot('skin', player.cosmetics.skins)}
            {renderSlot('trail', player.cosmetics.trails)}
            {renderSlot('theme', player.cosmetics.themes)}
            {renderSlot('emote', player.cosmetics.emotes)}
          </div>
        ) : (
          <p>Loading loadout…</p>
        )}
      </section>

      <section className="surface">
        <h3>Power-up loadout</h3>
        <p>Configure your two power-ups from the inventory (coming soon).</p>
        <ul className="list-inline">
          {(player?.loadout.powerUps ?? []).map((power) => (
            <li key={power} className="power-chip">
              {power}
            </li>
          ))}
          {(player?.loadout.powerUps?.length ?? 0) === 0 ? <li>No power-ups equipped yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
