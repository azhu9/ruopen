import { appIcon } from "@/lib/appIcon";

export const dynamic = "force-static";

const VARIANTS: Record<string, { size: number; maskable: boolean }> = {
  "192": { size: 192, maskable: false },
  "512": { size: 512, maskable: false },
  "maskable-512": { size: 512, maskable: true },
};

export function generateStaticParams() {
  return Object.keys(VARIANTS).map((variant) => ({ variant }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ variant: string }> }
) {
  const variant = VARIANTS[(await params).variant] ?? VARIANTS["512"];
  // Maskable icons get extra padding so Android's shape crop keeps the glyph.
  return variant.maskable
    ? appIcon(variant.size, { padding: 0.3 })
    : appIcon(variant.size, { rounded: true });
}
