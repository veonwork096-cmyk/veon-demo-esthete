// Client facts for the homepage. Source: veon/client.json (company.contacts, socials, C-003/C-004/C-007/C-011/C-023/C-041/C-042).
export const phone = { label: "+38 (066) 221 7733", href: "tel:+380662217733" };
export const email = { label: "esthete.clinic@gmail.com", href: "mailto:esthete.clinic@gmail.com" };
export const emailOnline = {
  label: "esthete.clinic@gmail.com",
  href: `mailto:esthete.clinic@gmail.com?subject=${encodeURIComponent("Онлайн-консультація")}`,
};
export const hours = "Пн–Пт 9:00–19:00, Сб 9:00–17:00";

const maps = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
export const addresses = [
  { street: "вул. Собранецька, 118/2", city: "Ужгород", map: maps("ЕСТЕТ стоматологія, вул. Собранецька 118/2, Ужгород") },
  { street: "вул. Митна, 44", city: "Ужгород", map: maps("ЕСТЕТ стоматологія, вул. Митна 44, Ужгород") },
];

export const messengers = [
  { name: "WhatsApp", href: "https://wa.me/380662217733", icon: "chat" },
  { name: "Viber", href: "viber://chat?number=%2B380662217733", icon: "viber" },
  { name: "Messenger", href: "https://m.me/esthetee", icon: "messenger" },
] as const;

export const socials = [
  { name: "Instagram", href: "https://www.instagram.com/esthetedentalclinic/", icon: "instagram" },
  { name: "Facebook", href: "https://www.facebook.com/esthetee/", icon: "facebook" },
  { name: "YouTube", href: "https://www.youtube.com/channel/UCH6bn7WJsDUFQVL8Tm5lGPg", icon: "youtube" },
] as const;

export const nav = [
  { href: "#directions", label: "Напрями" },
  { href: "#first-visit", label: "Ціни" },
  { href: "#doctors", label: "Лікарі" },
  { href: "#online", label: "Пацієнтам з ЄС" },
  { href: "#reviews", label: "Відгуки" },
  { href: "#contacts", label: "Контакти" },
];

export const soon = "Розділ у розробці";

/** Public file URL that respects the deploy base (GitHub Pages builds with --base /<repo>/). */
export const asset = (p: string): string => `${import.meta.env.BASE_URL.replace(/\/$/, "")}${p}`;
