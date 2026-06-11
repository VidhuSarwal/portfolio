export const siteConfig = {
  showSamsung: process.env.NEXT_PUBLIC_SHOW_SAMSUNG !== 'false',
  showLKMP: process.env.NEXT_PUBLIC_SHOW_LKMP !== 'false',
  showGSOC: process.env.NEXT_PUBLIC_SHOW_GSOC !== 'false',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'vidhu.sarwal19@gmail.com',
} as const;
