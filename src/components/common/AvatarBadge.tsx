import { AVATAR_OPTIONS } from '../../data/seedData';

interface AvatarBadgeProps {
  name: string;
  avatarId?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarBadge({ name, avatarId = 'coral', size = 'md' }: AvatarBadgeProps) {
  const style = AVATAR_OPTIONS.find((a) => a.id === avatarId) ?? AVATAR_OPTIONS[0];
  const initial = (name.trim().charAt(0) || 'V').toUpperCase();
  const dimensions =
    size === 'sm'
      ? 'h-8 w-8 text-xs'
      : size === 'lg'
        ? 'h-14 w-14 text-xl'
        : 'h-10 w-10 text-sm';

  return (
    <div
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold ${dimensions} ${style.bg} ${style.text}`}
    >
      {initial}
    </div>
  );
}
