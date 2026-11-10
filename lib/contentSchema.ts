/**
 * CMS definitions: each editable page has field definitions (drive the admin editor)
 * and defaults (used whenever MongoDB has no value yet).
 */
import { unsplash } from "@/lib/imageUrl";

export type FieldDef =
  | { name: string; label: string; type: "text" | "textarea"; help?: string }
  | { name: string; label: string; type: "image"; folder: "pages" | "gallery" | "products" | "misc" }
  | { name: string; label: string; type: "list"; itemLabel: string; fields: FieldDef[]; max?: number };

export interface PageDef {
  key: string;
  title: string;
  description: string;
  fields: FieldDef[];
}

export const IMG = {
  family: "/01-home-hero-family.png",
  couple: "/02-home-hero-couple.png",
  dog: "/03-home-hero-dog.png",
  dog2: unsplash("photo-1543466835-00a7907e9de1"),
  wedding: "/04-home-hero-wedding.png",
  lake: "/05-home-hero-travel-lake.png",
  travel: unsplash("photo-1469474968028-56623f02e42e"),
  kid: "/06-product-2x2-child.png",
  couple2: "/07-product-2x3-couple-rings.png",
  gift: "/10-gifts-every-occasion.png",
  gift2: unsplash("photo-1549465220-1a8b9238cd48"),
  cafe: "/08-business-magnets-cafe.png",
  kitchen: "/09-about-hero-kitchen-fridge.png",
  prints: unsplash("photo-1452421822248-d4c2b47f0c81"),
  shop: unsplash("photo-1441986300917-64674bd600d8"),
  team: unsplash("photo-1517245386807-bb43f82c33c4"),
  friends: unsplash("photo-1522673607200-164d1b6ce486"),
  pet: unsplash("photo-1583337130417-3346a1be7dee"),
  packing: unsplash("photo-1449247666642-264389f5f5b1"),
};

const featureItem: FieldDef[] = [
  { name: "title", label: "Title", type: "text" },
  { name: "text", label: "Short text", type: "text" },
];

export const PAGE_DEFS: PageDef[] = [
  {
    key: "home",
    title: "Homepage",
    description: "Hero, sections and calls to action on the homepage.",
    fields: [
      { name: "heroEyebrow", label: "Hero eyebrow", type: "text" },
      { name: "heroTitle", label: "Hero title (use a line break for two lines)", type: "textarea" },
      { name: "heroSubtitle", label: "Hero subtitle", type: "text" },
      { name: "heroDescription", label: "Hero description", type: "textarea" },
      { name: "heroImage", label: "Hero background image (optional)", type: "image", folder: "pages" },
      { name: "ctaPrimary", label: "Primary CTA label", type: "text" },
      { name: "ctaSecondary", label: "Secondary CTA label", type: "text" },
      { name: "businessMagnetText", label: "Business magnet text", type: "text" },
      { name: "featuredTitle", label: "Featured products heading", type: "text" },
      { name: "stepsTitle", label: "How-to heading", type: "text" },
      { name: "stepsSubtitle", label: "How-to subheading", type: "text" },
      { name: "features", label: "Feature strip", type: "list", itemLabel: "Feature", fields: featureItem, max: 4 },
      { name: "bulkTitle", label: "Bulk pricing heading", type: "text" },
      { name: "aboutTitle", label: "About heading", type: "text" },
      { name: "aboutText", label: "About text", type: "textarea" },
      { name: "occasionsTitle", label: "Occasions heading", type: "text" },
      { name: "occasionsSubtitle", label: "Occasions subheading", type: "text" },
      {
        name: "occasions",
        label: "Occasions (Perfect for every moment)",
        type: "list",
        itemLabel: "Occasion",
        max: 8,
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "text", label: "Short text", type: "text" },
          { name: "image", label: "Image", type: "image", folder: "pages" },
        ],
      },
      { name: "whyTitle", label: "Why Magnetify heading", type: "text" },
      { name: "whyItems", label: "Why Magnetify points", type: "list", itemLabel: "Point", fields: featureItem, max: 6 },
      { name: "faqTitle", label: "FAQ heading", type: "text" },
      {
        name: "faqs",
        label: "Homepage FAQs",
        type: "list",
        itemLabel: "FAQ",
        max: 10,
        fields: [
          { name: "q", label: "Question", type: "text" },
          { name: "a", label: "Answer", type: "textarea" },
        ],
      },
      { name: "ctaTitle", label: "Final call-to-action title", type: "text" },
      { name: "ctaText", label: "Final call-to-action text", type: "textarea" },
      { name: "ctaButton", label: "Final call-to-action button", type: "text" },
    ],
  },
  {
    key: "gallery",
    title: "Hero Magnet Gallery",
    description: "The six photo magnets shown on the homepage fridge display.",
    fields: [
      {
        name: "items",
        label: "Gallery magnets",
        type: "list",
        itemLabel: "Magnet",
        max: 6,
        fields: [
          { name: "image", label: "Image", type: "image", folder: "gallery" },
          { name: "alt", label: "Alt text", type: "text" },
        ],
      },
    ],
  },
  {
    key: "about",
    title: "About Page",
    description: "Content for /about.",
    fields: [
      { name: "heroTitle", label: "Hero title", type: "text" },
      { name: "heroText", label: "Hero text", type: "textarea" },
      { name: "heroImage", label: "Hero image", type: "image", folder: "pages" },
      {
        name: "sections",
        label: "Sections",
        type: "list",
        itemLabel: "Section",
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "text", label: "Text", type: "textarea" },
          { name: "image", label: "Image", type: "image", folder: "pages" },
        ],
      },
    ],
  },
  {
    key: "contact",
    title: "Contact Page",
    description: "Content for /contact.",
    fields: [
      { name: "heroTitle", label: "Hero title", type: "text" },
      { name: "heroText", label: "Hero text", type: "textarea" },
      { name: "formTitle", label: "Form heading", type: "text" },
      { name: "responseNote", label: "Response time note", type: "text" },
    ],
  },
  {
    key: "pricing",
    title: "Pricing Page",
    description: "Copy for /pricing. Prices themselves are managed under Pricing / Products.",
    fields: [
      { name: "heroTitle", label: "Hero title", type: "text" },
      { name: "heroText", label: "Hero text", type: "textarea" },
      {
        name: "faqs",
        label: "Pricing FAQs",
        type: "list",
        itemLabel: "FAQ",
        fields: [
          { name: "q", label: "Question", type: "text" },
          { name: "a", label: "Answer", type: "textarea" },
        ],
      },
    ],
  },
  {
    key: "shop",
    title: "Shop Page",
    description: "Copy for /products.",
    fields: [
      { name: "heroTitle", label: "Hero title", type: "text" },
      { name: "heroText", label: "Hero text", type: "textarea" },
      { name: "businessTitle", label: "Business magnets title", type: "text" },
      { name: "businessText", label: "Business magnets text", type: "textarea" },
      { name: "businessImage", label: "Business magnets image", type: "image", folder: "pages" },
    ],
  },
];

PAGE_DEFS.push(
  { key: "shipping-info", title: "Shipping Page", description: "Content for /shipping. Rates and provinces come from Admin > Shipping.", fields: [
      { name: "heroTitle", label: "Page title", type: "text" },
      { name: "intro", label: "Introduction", type: "textarea" },
      {
        name: "sections",
        label: "Sections",
        type: "list",
        itemLabel: "Section",
        fields: [
          { name: "title", label: "Heading", type: "text" },
          { name: "text", label: "Text (blank line = new paragraph)", type: "textarea" },
        ],
      },
    ] },
  { key: "privacy", title: "Privacy Policy", description: "Content for /privacy-policy.", fields: [
      { name: "heroTitle", label: "Page title", type: "text" },
      { name: "intro", label: "Introduction", type: "textarea" },
      {
        name: "sections",
        label: "Sections",
        type: "list",
        itemLabel: "Section",
        fields: [
          { name: "title", label: "Heading", type: "text" },
          { name: "text", label: "Text (blank line = new paragraph)", type: "textarea" },
        ],
      },
    ] }
);

export const DEFAULT_CONTENT: Record<string, Record<string, unknown>> = {
  home: {
    heroEyebrow: "CUSTOM MEMORIES MADE SIMPLE",
    heroTitle: "GRAND\nOPENING SALE!",
    heroSubtitle: "Small magnets, big memories.",
    heroDescription:
      "Turn your favorite photos into beautiful personalized magnets that you can display, gift, and enjoy every day.",
    heroImage: "",
    ctaPrimary: "Shop Magnets",
    ctaSecondary: "Start Customizing",
    businessMagnetText: "Your Business Here",
    featuredTitle: "Featured Products",
    stepsTitle: "How to Customize Your Magnets",
    stepsSubtitle: "Create your custom magnets in just a few simple steps.",
    features: [
      { title: "Easy to use", text: "Upload, adjust and order in minutes." },
      { title: "Mobile-friendly ordering", text: "Design right from your phone." },
      { title: "Personalized keepsakes", text: "Your moments, made to last." },
      { title: "Business magnets available", text: "Logos, cards and promos." },
    ],
    bulkTitle: "Bulk Pricing & Special Offers",
    aboutTitle: "About Magnetify",
    aboutText:
      "Magnetify creates personalized photo magnets for families, couples, pet owners, businesses, and gift givers. Turn your favorite photos, special moments, and brand ideas into beautiful magnets that are personal, meaningful, and fun to share.",
    occasionsTitle: "Perfect for Every Moment",
    occasionsSubtitle: "From everyday smiles to once-in-a-lifetime days, keep the moments that matter in sight.",
    occasions: [
      { title: "Family Memories", text: "Holidays, reunions and everyday smiles.", image: IMG.family },
      { title: "Couples & Anniversaries", text: "Date nights, proposals and milestones.", image: IMG.couple },
      { title: "Pets", text: "Your best friend, front and centre.", image: IMG.dog },
      { title: "Weddings", text: "Thank-you favours guests actually keep.", image: IMG.wedding },
      { title: "Travel", text: "Bring your favourite places home.", image: IMG.lake },
      { title: "Business Branding", text: "Logos and promos that stay on the fridge.", image: IMG.cafe },
    ],
    whyTitle: "Why Customers Choose Magnetify",
    whyItems: [
      { title: "Vivid, long-lasting prints", text: "Rich colour and a clean finish that looks great on any fridge." },
      { title: "Design from your phone", text: "Upload, crop, zoom and add text in a few taps — no app needed." },
      { title: "Every order checked", text: "We review each magnet before printing so it comes out right." },
      { title: "Honest, simple pricing", text: "Sale prices on every size, with automatic bulk discounts." },
    ],
    faqTitle: "Frequently Asked Questions",
    faqs: [
      { q: "What sizes do you offer?", a: "2x2 inch square magnets (minimum 9) and 2x3 inch rectangle magnets (minimum 6)." },
      { q: "Can I add text to my magnets?", a: "Yes. Add names, dates or a short message, choose the colour and drag it exactly where you want it." },
      { q: "Do you offer bulk pricing?", a: "Yes. Pricing drops automatically once your cart has 50+ magnets, and again at 100+." },
      { q: "Can I order business magnets?", a: "Absolutely. Upload your logo, business card design or promotional artwork using the Business option." },
      { q: "Can I return custom magnets?", a: "Because every magnet is made from your own photos, custom magnets are final sale and non-refundable." },
    ],
    ctaTitle: "Ready to Turn Your Photos Into Magnets?",
    ctaText: "Upload your favourite photos and see your magnets come to life in minutes. Grand opening sale pricing on every size.",
    ctaButton: "Start Customizing",
  },
  gallery: {
    items: [
      { image: IMG.family, alt: "Smiling family photo magnet" },
      { image: IMG.couple, alt: "Couple photo magnet" },
      { image: IMG.dog, alt: "Golden retriever photo magnet" },
      { image: IMG.wedding, alt: "Wedding photo magnet" },
      { image: IMG.lake, alt: "Mountain lake travel photo magnet" },
    ],
  },
  about: {
    heroTitle: "Turning Moments Into Memories",
    heroText:
      "Magnetify turns your photographs into personalized fridge magnets — small, durable keepsakes that keep the people, pets and places you love in sight every day.",
    heroImage: IMG.kitchen,
    sections: [
      {
        title: "Our Story",
        text: "Magnetify started with a simple idea: the best photos should not stay buried in a phone. We created a simple way to turn them into something you can hold, display and share.",
        image: IMG.prints,
      },
      {
        title: "Why Magnetify",
        text: "Simple ordering from any device, honest pricing, bulk discounts and careful printing on every order. No design skills needed.",
        image: IMG.wedding,
      },
      {
        title: "Personalized Memories",
        text: "Family portraits, weddings, babies' first moments, beloved pets, and special trips. Every magnet is printed from your own photos and personalized with your own text.",
        image: IMG.family,
      },
      {
        title: "Business Magnets",
        text: "Put your logo, business card or promotional message on your customers' fridges. Great for real estate, cafés, clinics, trades and events.",
        image: IMG.cafe,
      },
      {
        title: "Gifts for Every Occasion",
        text: "Birthdays, weddings, holidays, baby showers and thank-yous. A set of personal magnets is a gift people actually keep.",
        image: IMG.gift,
      },
      {
        title: "Quality & Care",
        text: "We check every order before printing, use vivid long-lasting prints and pack each set carefully so it arrives ready to display.",
        image: IMG.packing,
      },
    ],
  },
  contact: {
    heroTitle: "Get in Touch",
    heroText: "Questions about an order, bulk pricing or business magnets? Send us a message and we will get back to you.",
    formTitle: "Send Us a Message",
    responseNote: "We usually reply within 1–2 business days.",
  },
  pricing: {
    heroTitle: "Simple, Honest Pricing",
    heroText: "Enjoy our Grand opening sale prices on every magnet, plus additional savings when you order more.",
    faqs: [
      { q: "How do bulk discounts work?", a: "Bulk pricing applies automatically to your whole cart once you reach the total number of magnets shown." },
      { q: "Is there a minimum order?", a: "Yes. 2x2 magnets have a minimum of 9 and 2x3 magnets have a minimum of 6 per design set." },
      { q: "Can I return custom magnets?", a: "Custom magnets are made just for you, so they are final sale and non-refundable." },
    ],
  },
  "shipping-info": {
    heroTitle: "Shipping Information",
    intro: "We are currently shipping within British Columbia (BC) only. We are working on expanding to more provinces soon.",
    sections: [
      { title: "Where we ship", text: "Orders can currently be delivered to addresses in British Columbia only. If you are outside BC, please contact us and we will let you know as soon as we ship to your area." },
      { title: "Processing time", text: "Every custom magnet is made to order. Once your payment is confirmed, we review your photos, print and pack your order carefully. We will email you when your order ships." },
      { title: "Shipping costs", text: "A flat shipping rate applies to every order, and orders of $100 or more ship free. The exact amount is shown in your cart and at checkout before you pay." },
      { title: "Damaged or lost orders", text: "If your order arrives damaged or does not arrive, please email us with your order number and a photo of the package so we can make it right." },
    ],
  },
  privacy: {
    heroTitle: "Privacy Policy",
    intro: "Magnetify respects your privacy. This policy explains what personal information we collect when you visit our website or place an order, how we use it, and the choices you have.",
    sections: [
      { title: "Information we collect", text: "When you place an order we collect your name, email address, shipping address and, if you choose to provide it, your phone number. We also receive the photos and text you upload to create your magnets.\n\nWhen you contact us we collect your name, email address and message." },
      { title: "How we use your information", text: "We use your information to make, ship and support your order, to reply to your messages and to send you updates about your order. We do not sell or rent your personal information." },
      { title: "Your photos", text: "Photos you upload are used only to produce your magnets. We will only feature your order on our social media if you agreed to this at checkout. You can change your mind at any time by emailing us." },
      { title: "Payments", text: "Payments are processed securely by our payment providers (such as Stripe and PayPal). We never see or store your full card details." },
      { title: "How long we keep information", text: "We keep order information as long as needed to complete your order and meet our legal and accounting obligations. You can ask us to delete your uploaded photos once your order is complete." },
      { title: "Your rights", text: "You can ask to see, correct or delete the personal information we hold about you by emailing us. We will respond within a reasonable time." },
      { title: "Contact us", text: "If you have any questions about this policy or your personal information, please email magnetify1@hotmail.com." },
    ],
  },
  shop: {
    heroTitle: "Shop Personalized Magnets",
    heroText: "Choose your size, upload your photos and make them yours.",
    businessTitle: "Business Magnets",
    businessText:
      "Upload your logo, business card design or promotional artwork and we will turn it into magnets your customers keep on their fridge.",
    businessImage: IMG.cafe,
  },
};

export const DEFAULT_PRODUCTS = [
  {
    slug: "2x2-photo-magnets",
    name: "2x2 Personalized Photo Magnets",
    shortName: "2x2 Magnets",
    kind: "photo" as const,
    size: "2x2" as const,
    regularPrice: 5.99,
    salePrice: 4.99,
    minOrder: 9,
    description: "Square 2x2 inch magnets printed from your favorite photos. Perfect for sets of family, pet and travel memories.",
    image: IMG.kid,
    gallery: [],
    status: "active" as const,
    bulkTiers: [
      { minQty: 50, price: 4.49, label: "50+ MAGNETS" },
      { minQty: 100, price: 3.99, label: "100+ MAGNETS" },
    ],
    sortOrder: 1,
  },
  {
    slug: "2x3-photo-magnets",
    name: "2x3 Personalized Photo Magnets",
    shortName: "2x3 Magnets",
    kind: "photo" as const,
    size: "2x3" as const,
    regularPrice: 6.99,
    salePrice: 5.99,
    minOrder: 6,
    description: "Rectangular 2x3 inch magnets — ideal for portraits, couples and wallet-size memories.",
    image: IMG.couple2,
    gallery: [],
    status: "active" as const,
    bulkTiers: [
      { minQty: 50, price: 5.49, label: "50+ MAGNETS" },
      { minQty: 100, price: 4.99, label: "100+ MAGNETS" },
    ],
    sortOrder: 2,
  },
  {
    slug: "business-magnets-2x2",
    name: "2x2 Business Magnets",
    shortName: "2x2 Business",
    kind: "business" as const,
    size: "2x2" as const,
    regularPrice: 5.99,
    salePrice: 4.99,
    minOrder: 9,
    description: "Square business magnets for logos, QR codes and promotions.",
    image: IMG.cafe,
    gallery: [],
    status: "active" as const,
    bulkTiers: [
      { minQty: 50, price: 4.49, label: "50+ MAGNETS" },
      { minQty: 100, price: 3.99, label: "100+ MAGNETS" },
    ],
    sortOrder: 3,
  },
  {
    slug: "business-magnets-2x3",
    name: "2x3 Business Magnets",
    shortName: "2x3 Business",
    kind: "business" as const,
    size: "2x3" as const,
    regularPrice: 6.99,
    salePrice: 5.99,
    minOrder: 6,
    description: "Business-card-style magnets for contact details, logos and promotions.",
    image: IMG.shop,
    gallery: [],
    status: "active" as const,
    bulkTiers: [
      { minQty: 50, price: 5.49, label: "50+ MAGNETS" },
      { minQty: 100, price: 4.99, label: "100+ MAGNETS" },
    ],
    sortOrder: 4,
  },
];

export const DEFAULT_SITE = {
  contactEmail: "magnetify1@hotmail.com",
  facebookHandle: "shop.magnetify",
  instagramHandle: "shop.magnetify",
  tiktokHandle: "Magnetify1",
  finalSaleNotice: "Custom magnets are final sale and non-refundable.",
  announcement: "",
};
