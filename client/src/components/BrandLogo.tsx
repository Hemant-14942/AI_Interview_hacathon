import Link from "next/link";
import Image from "next/image";

export function BrandLogo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center ">
      <Image
        src="/brandlogo.png"
        alt="Intervo"
        width={152}
        height={40}
        className="h-100 w-auto max-w-[min(162px,42vw)] object-contain object-left mt-2"
        priority
      />
    </Link>
  );
}
