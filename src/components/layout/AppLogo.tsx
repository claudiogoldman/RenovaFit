import Image from 'next/image';
import Link from 'next/link';

type AppLogoProps = {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  priority?: boolean;
};

const SIZE_MAP = {
  sm: { width: 120, height: 36 },
  md: { width: 160, height: 48 },
  lg: { width: 220, height: 64 },
};

export function AppLogo({ href = '/', size = 'md', className = '', priority = false }: AppLogoProps) {
  const { width, height } = SIZE_MAP[size];

  return (
    <Link href={href} className={`inline-flex items-center ${className}`.trim()} aria-label="RenovaFit">
      <picture>
        <source srcSet="/image/logo/logo-renovafit.webp" type="image/webp" />
        <Image
          src="/image/logo/logo-renovafit.png"
          alt="RenovaFit"
          width={width}
          height={height}
          priority={priority}
          className="h-auto w-auto object-contain"
        />
      </picture>
    </Link>
  );
}
