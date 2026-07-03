// ShowClutch — listing taxonomy: sale formats, collector categories, die-cast
// scales, and per-brand Series / Edition lists. Series auto-populate from brand.

export const SALE_FORMATS: { value: string; label: string; hint: string }[] = [
  { value: "auction", label: "Auction Only", hint: "Rare, limited, chase, STH, RLC, vintage — everyone gets to bid. No Buy It Now." },
  { value: "direct", label: "Direct Buy", hint: "Mainlines, accessories, common imports, bulk stock — fixed price, instant purchase." },
  { value: "offer", label: "Make an Offer", hint: "Price-uncertain pieces — buyers offer, you accept or counter." },
];

// The 12 collector categories.
export const CATEGORIES = [
  "Standard Release",
  "Premium / Collector Line",
  "Limited Edition",
  "Chase Variant",
  "Regional Exclusive",
  "Retailer / Distributor Exclusive",
  "Event / Convention Exclusive",
  "Collaboration Release",
  "Membership / Club Exclusive",
  "Vintage / Discontinued",
  "Prototype / Pre-production",
  "Error / Variation",
];

// Rare / high-demand categories default to Auction Only.
export const RARE_CATEGORIES = new Set([
  "Limited Edition",
  "Chase Variant",
  "Regional Exclusive",
  "Retailer / Distributor Exclusive",
  "Event / Convention Exclusive",
  "Membership / Club Exclusive",
  "Vintage / Discontinued",
  "Prototype / Pre-production",
  "Error / Variation",
]);

export const SCALES = ["1:64", "1:43", "1:32", "1:24", "1:18", "1:12", "1:87", "Other"];

// Series / Edition options per brand. Brands without an entry fall back to CATEGORIES.
export const BRAND_SERIES: Record<string, string[]> = {
  "Hot Wheels": [
    "Mainline", "Treasure Hunt", "Super Treasure Hunt", "Red Line Club (RLC)",
    "Car Culture", "Team Transport", "Boulevard", "Premium", "Fast & Furious",
    "Pop Culture", "Error / Variation", "Discontinued Release",
  ],
  "Tomica": [
    "Tomica Regular", "Tomica Premium", "Tomica Premium Unlimited",
    "Tomica Limited Vintage", "Tomica Limited Vintage Neo", "Tomica Event Model",
    "Tomica Gift Set", "Disney Tomica", "Discontinued Release",
  ],
  "Matchbox": [
    "Mainline", "Moving Parts", "Matchbox Collectors", "Super Chase",
    "Moving Parts Super Chase", "Anniversary / Special Edition",
    "Mattel Creations / Collector Release", "Licensed Theme / Entertainment Release",
    "Vintage Matchbox", "Error / Variation", "Discontinued Release",
  ],
  "Mini GT": [
    "Mini GT Standard Release", "Kaido House x Mini GT", "Limited Edition",
    "Regional Exclusive", "Event Exclusive", "Distributor / Retailer Exclusive",
    "Kaido House Chase Variant", "Collaboration Release", "Motorsport / Licensed Series",
    "Discontinued Release",
  ],
  "Greenlight": [
    "Standard Release", "Hollywood Series", "Hobby Exclusive", "Club Vee-Dub",
    "Running on Empty", "Muscle Series", "Green Machine Chase", "Limited Edition",
    "Discontinued Release",
  ],
  "Majorette": [
    "Standard Series", "Showroom Premium", "Showroom Deluxe", "JDM Legends Premium",
    "JDM Legends Deluxe", "Japan Series Deluxe", "Limited Edition", "Gift Pack Exclusive",
    "Event / Motor Show Release", "Vintage Majorette", "Discontinued Release",
  ],
  "Tarmac": [
    "GLOBAL64", "HOBBY64", "Special Edition", "Chase Variant", "Regional Exclusive",
    "Retailer / Distributor Exclusive", "Event / Promo Exclusive",
    "Tarmac Owners Club Exclusive", "Collaboration Release", "Limited Production Run",
    "Discontinued Release",
  ],
  "Pop Race": [
    "Pop Race Standard Release", "Pop Race Limited", "Enigma Exclusive", "Enigma Chase",
    "Event Exclusive", "Regional Exclusive", "Chase Variant",
    "Chrome / Carbon / Special Finish", "Opening Parts Collector Release",
    "Collaboration / Licensed Livery", "Discontinued Release",
  ],
  "Inno64": [
    "Inno64 Standard Release", "Limited Edition", "Numbered Limited Edition",
    "Chase Variant", "Chrome Chase", "Event / Expo Exclusive", "Regional Exclusive",
    "Collaboration Release", "Liberty Walk / RWB / Pandem / Top Secret Series",
    "Motorsport / Drift Livery", "Discontinued Release",
  ],
  "Solido": [
    "1:18 Collection", "1:43 Collection", "Street Car", "Motorsport / Endurance",
    "Movie Car / Entertainment Licence", "Limited Edition", "Anniversary Edition",
    "Club Solido Exclusive", "Vintage Solido", "Discontinued Release", "Special Livery",
    "Dealer / Event Exclusive",
  ],
  "Street Warrior": [
    "Street Weapon Standard Release", "Street Warrior Standard Release",
    "Numbered Limited Edition", "Special Colourway", "Chrome / Gradient / Special Finish",
    "Collaboration Release", "Event Exclusive", "Regional Exclusive",
    "RWB / Custom Body Kit Series", "Discontinued Release",
  ],
  "Stancehunters": [
    "Stance Hunters Standard Release", "Numbered Limited Edition", "Special Colourway",
    "Collaboration Release", "Event Exclusive", "Trailer / Diorama Set",
    "Regional Exclusive", "Discontinued Release",
  ],
  "TrendHobby": [
    "Trends Hobby Standard Release", "Numbered Limited Edition", "Special Colourway",
    "Event Exclusive", "Regional Exclusive", "Retailer Exclusive", "Collaboration Release",
    "Discontinued Release",
  ],
};

// Default scale suggestion per brand (Solido skews larger scale).
export const BRAND_DEFAULT_SCALE: Record<string, string> = {
  Solido: "1:18",
};

export function seriesForBrand(brand: string): string[] {
  return BRAND_SERIES[brand] ?? CATEGORIES;
}
