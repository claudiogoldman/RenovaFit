import Image from 'next/image';
import Link from 'next/link';

type AppLogoProps = {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  priority?: boolean;
};

const SIZE_MAP = {
  sm: { width: 96, height: 30 },
  md: { width: 132, height: 42 },
  lg: { width: 180, height: 56 },
};

export function AppLogo({ href = '/', size = 'md', className = '', priority = false }: AppLogoProps) {
  const { width, height } = SIZE_MAP[size];

  return (
    <Link href={href} className={`inline-flex items-center ${className}`.trim()} aria-label="RenovaFit">
      <Image
        src="/image/logo/logo-renovafit.png"
        alt="RenovaFit"
        width={width}
        height={height}
        priority={priority}
        className="block max-w-full object-contain"
      />
    </Link>
  );
}
