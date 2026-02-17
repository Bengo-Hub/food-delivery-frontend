type PaletteKey = "primary" | "emphasis" | "contrast" | "muted" | "surface" | "dark";

const HEX_COLOR_REGEX = /^#?(?:[0-9a-fA-F]{6})$/;

const defaultPalette: Record<PaletteKey, string> = {
  primary: "#6b2a1b",
  emphasis: "#f36a0c",
  contrast: "#ffffff",
  muted: "#f9ede5",
  surface: "#f4e6dc",
  dark: "#43170d",
};

const sanitizeHex = (value: string | undefined, fallback: string): string => {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  if (!HEX_COLOR_REGEX.test(trimmed)) {
    return fallback;
  }

  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
};

const hexToRgbTriplet = (hexValue: string): string => {
  const sanitized = sanitizeHex(hexValue, hexValue).replace("#", "");
  const red = parseInt(sanitized.slice(0, 2), 16);
  const green = parseInt(sanitized.slice(2, 4), 16);
  const blue = parseInt(sanitized.slice(4, 6), 16);

  return `${red} ${green} ${blue}`;
};

const getPalette = (): Record<PaletteKey, string> => {
  const entries = Object.entries(defaultPalette).map(([key, fallback]) => {
    const envKey = `NEXT_PUBLIC_BRAND_${key.toUpperCase()}`;
    const envValue = process.env[envKey as keyof NodeJS.ProcessEnv];
    return [key, sanitizeHex(envValue, fallback)];
  });

  return Object.fromEntries(entries) as Record<PaletteKey, string>;
};

const brandPalette = getPalette();

const brandName = process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || "Order App";
const brandShortName = process.env.NEXT_PUBLIC_BRAND_SHORT_NAME?.trim() || "Order App";
const brandTagline =
  process.env.NEXT_PUBLIC_BRAND_TAGLINE?.trim() ||
  "Online ordering platform for delivery and shipping. Fast, reliable, and integrated.";
const brandDescription =
  process.env.NEXT_PUBLIC_BRAND_DESCRIPTION?.trim() ||
  "Multi-business online ordering platform with flexible catalog management, real-time tracking, and seamless payment integration.";
const supportEmail =
  process.env.NEXT_PUBLIC_BRAND_SUPPORT_EMAIL?.trim() || "support@codevertexitsolutions.com";
const supportPhone = process.env.NEXT_PUBLIC_BRAND_SUPPORT_PHONE?.trim() || "+254 743 793 901";
const headquarters =
  process.env.NEXT_PUBLIC_BRAND_HQ?.trim() ||
  "Oginga Road, Pioneer House, Second Floor, Kisumu, Kenya";
const logo = process.env.NEXT_PUBLIC_BRAND_LOGO_URL?.trim() || "/logo.jpg";

// Brand defaults are env-configurable per tenant. Backend-managed settings planned for post-MVP.
export const brand = {
  name: brandName,
  shortName: brandShortName,
  tagline: brandTagline,
  description: brandDescription,
  support: {
    email: supportEmail,
    phone: supportPhone,
    headquarters,
  },
  palette: brandPalette,
  cssVariables: {
    primary: hexToRgbTriplet(brandPalette.primary),
    emphasis: hexToRgbTriplet(brandPalette.emphasis),
    contrast: hexToRgbTriplet(brandPalette.contrast),
    muted: hexToRgbTriplet(brandPalette.muted),
    surface: hexToRgbTriplet(brandPalette.surface),
    dark: hexToRgbTriplet(brandPalette.dark),
  },
  metadata: {
    defaultTitle: `${brandShortName} Food Delivery`,
    template: "%s | " + `${brandShortName} Food Delivery`,
    applicationName: `${brandShortName} Platform`,
  },
  assets: {
    logo,
  },
} as const;

export type BrandConfig = typeof brand;
