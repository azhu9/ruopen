import { appIcon } from "@/lib/appIcon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS rounds home-screen icons itself, so this one stays square.
export default function AppleIcon() {
  return appIcon(180);
}
