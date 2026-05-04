interface Props {
  name?: string | null;
  email?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-xl' };

export function Avatar({ name, email, size = 'md' }: Props) {
  const initial = (name?.[0] ?? email?.[0] ?? '?').toUpperCase();
  const hue = (initial.charCodeAt(0) * 37) % 360;
  return (
    <div
      className={`${sizes[size]} flex items-center justify-center rounded-full font-semibold text-white`}
      style={{ backgroundColor: `hsl(${hue},60%,50%)` }}
    >
      {initial}
    </div>
  );
}
