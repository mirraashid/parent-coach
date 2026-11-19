interface HeaderProps {
  canReset: boolean;
  onReset: () => void;
}

export function BrandMark() {
  return (
    <svg className="brand__mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="15" fill="var(--ink)" />
      <g fill="var(--marigold)">
        <circle cx="16" cy="9.5" r="4" />
        <circle cx="22.2" cy="14" r="4" />
        <circle cx="19.8" cy="21.3" r="4" />
        <circle cx="12.2" cy="21.3" r="4" />
        <circle cx="9.8" cy="14" r="4" />
      </g>
      <circle cx="16" cy="16" r="3" fill="var(--ink)" />
    </svg>
  );
}

export function Header({ canReset, onReset }: HeaderProps) {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="brand">
          <BrandMark />
          <span className="brand__name">Parent Coach</span>
        </div>
        {canReset && (
          <button type="button" className="btn btn--quiet" onClick={onReset}>
            New conversation
          </button>
        )}
      </div>
    </header>
  );
}
