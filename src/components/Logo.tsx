import Image from "next/image";
import Link  from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2">
      <Image
        src="/logo.svg"
        alt="Tirra Cred"
        width={125

        }     /* ajuste ao seu SVG */
        height={30}
        priority
      />
      {/* se quiser texto ao lado:
      <span className="font-semibold text-lg text-white">Tirra Cred</span>
      */}
    </Link>
  );
}
