interface MainMenuProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  hint?: string;
  dismissible?: boolean;
  actions: Array<{
    label: string;
    onClick: () => void;
    primary?: boolean;
  }>;
}

export function MainMenu({
  open,
  onClose,
  title = '主選單',
  hint,
  dismissible = true,
  actions,
}: MainMenuProps) {
  if (!open) return null;
  return (
    <div className="main-menu" role="dialog" aria-modal="true" aria-label={title}>
      <div className="main-menu-panel">
        <h2>{title}</h2>
        {(hint || (dismissible && onClose)) && (
          <p>{hint ?? '按 Esc 可關閉'}</p>
        )}
        <div className="main-menu-actions">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={action.primary ? 'primary' : undefined}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
        {dismissible && onClose && (
          <button type="button" className="ghost" onClick={onClose}>繼續</button>
        )}
      </div>
    </div>
  );
}

export function MenuToggleButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="menu-toggle" onClick={onClick} aria-label="開啟主選單">
      主選單
    </button>
  );
}
