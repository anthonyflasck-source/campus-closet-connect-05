export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  school: string;
  joined: string;
}

export interface Listing {
  id: string;
  userId: string;
  title: string;
  description: string;
  size: string;
  color: string;
  price: number;
  dressLength: string;
  eventType: string;
  listingType: 'sell' | 'rent' | 'trade' | 'sell-rent';
  image: string;
  createdAt: string;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  listingId: string;
  message: string;
  createdAt: string;
}

export const SEED_USERS: User[] = [
  { id: 'user-1', name: 'Emma Rodriguez', email: 'emma@university.edu', password: 'password123', school: 'State University', joined: '2025-09-01' },
  { id: 'user-2', name: 'Sophia Chen', email: 'sophia@university.edu', password: 'password123', school: 'State University', joined: '2025-08-15' },
  { id: 'user-3', name: 'Mia Thompson', email: 'mia@university.edu', password: 'password123', school: 'State University', joined: '2025-10-01' },
];

function dressPlaceholder(hue1: number, hue2: number, id: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 530;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, `hsl(${hue1}, 55%, 25%)`);
  grad.addColorStop(0.5, `hsl(${(hue1 + hue2) / 2}, 45%, 18%)`);
  grad.addColorStop(1, `hsl(${hue2}, 50%, 22%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2, 80);
  const dressGrad = ctx.createLinearGradient(0, 0, 0, 400);
  dressGrad.addColorStop(0, `hsla(${hue1}, 70%, 65%, 0.9)`);
  dressGrad.addColorStop(1, `hsla(${hue2}, 60%, 50%, 0.9)`);
  ctx.fillStyle = dressGrad;

  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.quadraticCurveTo(-35, 60, -25, 120);
  ctx.quadraticCurveTo(-22, 140, -28, 160);
  const skirtWidth = 60 + (id % 4) * 25;
  const skirtLen = 200 + (id % 3) * 40;
  ctx.quadraticCurveTo(-skirtWidth, skirtLen, -skirtWidth - 20, skirtLen + 60);
  ctx.lineTo(skirtWidth + 20, skirtLen + 60);
  ctx.quadraticCurveTo(skirtWidth, skirtLen, 28, 160);
  ctx.quadraticCurveTo(22, 140, 25, 120);
  ctx.quadraticCurveTo(35, 60, 30, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `hsla(${hue1}, 80%, 80%, 0.08)`;
  ctx.beginPath();
  ctx.ellipse(0, 200, 50, 150, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `hsla(0, 0%, 80%, 0.3)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.quadraticCurveTo(0, -35, 30, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(0, -50);
  ctx.stroke();
  ctx.restore();

  for (let i = 0; i < 15; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.random() * 2 + 0.5;
    ctx.fillStyle = `hsla(${hue1}, 70%, 80%, ${Math.random() * 0.3 + 0.1})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL('image/jpeg', 0.85);
}

export function generateSeedImages(): string[] {
  return [
    dressPlaceholder(340, 20, 0),
    dressPlaceholder(260, 290, 1),
    dressPlaceholder(45, 25, 2),
    dressPlaceholder(150, 170, 3),
    dressPlaceholder(320, 350, 4),
    dressPlaceholder(0, 0, 5),
    dressPlaceholder(210, 240, 6),
    dressPlaceholder(30, 50, 7),
    dressPlaceholder(280, 310, 8),
    dressPlaceholder(10, 40, 9),
    dressPlaceholder(170, 200, 10),
    dressPlaceholder(55, 45, 11),
    dressPlaceholder(190, 220, 12),
    dressPlaceholder(350, 10, 13),
    dressPlaceholder(120, 140, 14),
    dressPlaceholder(270, 300, 15),
    dressPlaceholder(15, 35, 16),
    dressPlaceholder(200, 230, 17),
    dressPlaceholder(330, 0, 18),
    dressPlaceholder(80, 100, 19),
    dressPlaceholder(240, 260, 20),
    dressPlaceholder(60, 80, 21),
    dressPlaceholder(300, 330, 22),
    dressPlaceholder(160, 180, 23),
  ];
}

export function createSeedListings(images: string[]): Listing[] {
  return [
    { id: 'listing-1', userId: 'user-1', title: 'Rose Satin A-Line Formal Dress', description: 'Stunning rose satin A-line dress, perfect for spring formal. Only worn once — in pristine condition. Features a flattering sweetheart neckline and subtle pleating at the waist. Available to buy or rent for the night!', size: 'S', color: 'Rose', price: 85, dressLength: 'Long', eventType: 'Formal', listingType: 'sell-rent', image: images[0], createdAt: '2026-02-20T10:00:00' },
    { id: 'listing-2', userId: 'user-2', title: 'Royal Blue Sequin Mini', description: 'Eye-catching royal blue sequin mini dress — guaranteed to turn heads at any date party! Stretchy fabric, fits true to size.', size: 'M', color: 'Blue', price: 35, dressLength: 'Short', eventType: 'Date Party', listingType: 'rent', image: images[1], createdAt: '2026-02-18T14:30:00' },
    { id: 'listing-3', userId: 'user-1', title: 'Gold Champagne Beaded Gown', description: 'Elegant champagne-gold gown with intricate beading on the bodice. Perfect for winter formal or gala events.', size: 'S', color: 'Gold', price: 120, dressLength: 'Long', eventType: 'Formal', listingType: 'sell', image: images[2], createdAt: '2026-02-15T09:00:00' },
    { id: 'listing-4', userId: 'user-3', title: 'Emerald Velvet Cocktail Dress', description: 'Rich emerald green velvet cocktail dress with long sleeves and a flattering fit-and-flare silhouette. Buy it outright or rent for your next event!', size: 'M', color: 'Green', price: 55, dressLength: 'Midi', eventType: 'Semi-Formal', listingType: 'sell-rent', image: images[3], createdAt: '2026-02-22T16:00:00' },
    { id: 'listing-5', userId: 'user-2', title: 'Hot Pink Ruched Bodycon', description: 'Fun and flirty hot pink bodycon with ruched sides. Looks amazing in photos! Worn to one date party — in like-new condition.', size: 'XS', color: 'Pink', price: 30, dressLength: 'Short', eventType: 'Date Party', listingType: 'rent', image: images[4], createdAt: '2026-02-25T11:00:00' },
    { id: 'listing-6', userId: 'user-3', title: 'Classic Black Strapless Gown', description: 'Timeless black strapless gown with a sweeping mermaid hem. Formal and sophisticated.', size: 'L', color: 'Black', price: 0, dressLength: 'Long', eventType: 'Formal', listingType: 'trade', image: images[5], createdAt: '2026-02-10T08:00:00' },
    { id: 'listing-7', userId: 'user-1', title: 'Navy Chiffon Wrap Dress', description: 'Flowing navy chiffon wrap dress with flutter sleeves. Universally flattering and easy to dress up or down.', size: 'M', color: 'Navy', price: 45, dressLength: 'Midi', eventType: 'Semi-Formal', listingType: 'sell', image: images[6], createdAt: '2026-03-01T12:00:00' },
    { id: 'listing-8', userId: 'user-2', title: 'Burgundy Off-Shoulder Maxi', description: 'Dramatic burgundy off-shoulder maxi dress with a thigh-high slit. Made from premium crepe fabric.', size: 'S', color: 'Red', price: 25, dressLength: 'Long', eventType: 'Formal', listingType: 'rent', image: images[7], createdAt: '2026-03-03T15:00:00' },
    { id: 'listing-9', userId: 'user-3', title: 'Lavender Tulle Princess Dress', description: 'Whimsical lavender tulle dress with a layered skirt and delicate floral appliqués. Dreamy and romantic. Rent it for a night or make it yours!', size: 'XS', color: 'Purple', price: 95, dressLength: 'Long', eventType: 'Formal', listingType: 'sell-rent', image: images[8], createdAt: '2026-03-05T10:30:00' },
    { id: 'listing-10', userId: 'user-1', title: 'Coral One-Shoulder Party Dress', description: 'Fresh coral one-shoulder dress with an asymmetric hemline. Fun and youthful.', size: 'M', color: 'Pink', price: 40, dressLength: 'Short', eventType: 'Mixer', listingType: 'sell', image: images[9], createdAt: '2026-03-06T09:00:00' },
    { id: 'listing-11', userId: 'user-2', title: 'Sage Green Slip Dress', description: 'Minimalist sage green satin slip dress with lace trim. Effortlessly chic.', size: 'L', color: 'Green', price: 0, dressLength: 'Midi', eventType: 'Semi-Formal', listingType: 'trade', image: images[10], createdAt: '2026-03-07T14:00:00' },
    { id: 'listing-12', userId: 'user-3', title: 'Champagne Sparkle Cutout Dress', description: 'Show-stopping champagne dress with all-over sparkle and tasteful side cutouts.', size: 'S', color: 'Gold', price: 20, dressLength: 'Short', eventType: 'Date Party', listingType: 'rent', image: images[11], createdAt: '2026-03-08T18:00:00' },
    { id: 'listing-13', userId: 'user-1', title: 'Teal Halter Neck Midi Dress', description: 'Gorgeous teal halter neck midi with a flowing A-line skirt. Perfect for outdoor ceremonies or garden parties.', size: 'M', color: 'Blue', price: 60, dressLength: 'Midi', eventType: 'Semi-Formal', listingType: 'sell', image: images[12], createdAt: '2026-03-02T11:00:00' },
    { id: 'listing-14', userId: 'user-2', title: 'Blush Pink Tulle Ball Gown', description: 'Princess-worthy blush pink ball gown with layers of tulle and a corseted bodice. Absolutely stunning for formal events. Available to buy or rent!', size: 'S', color: 'Pink', price: 150, dressLength: 'Long', eventType: 'Formal', listingType: 'sell-rent', image: images[13], createdAt: '2026-02-28T09:30:00' },
    { id: 'listing-15', userId: 'user-3', title: 'Forest Green Satin Wrap Dress', description: 'Luxe forest green satin wrap dress with a deep V-neckline and dramatic puff sleeves.', size: 'L', color: 'Green', price: 0, dressLength: 'Midi', eventType: 'Semi-Formal', listingType: 'trade', image: images[14], createdAt: '2026-03-04T13:00:00' },
    { id: 'listing-16', userId: 'user-1', title: 'Periwinkle Chiffon Maxi', description: 'Dreamy periwinkle chiffon maxi dress with flutter sleeves and a cinched waist. Lightweight and perfect for spring.', size: 'XS', color: 'Purple', price: 70, dressLength: 'Long', eventType: 'Formal', listingType: 'sell', image: images[15], createdAt: '2026-03-06T16:00:00' },
    { id: 'listing-17', userId: 'user-2', title: 'Rust Orange Velvet Mini', description: 'Bold rust orange velvet mini with a square neckline and cap sleeves. Stand out at any mixer or date party.', size: 'M', color: 'Red', price: 25, dressLength: 'Short', eventType: 'Mixer', listingType: 'rent', image: images[16], createdAt: '2026-03-07T10:00:00' },
    { id: 'listing-18', userId: 'user-3', title: 'Icy Blue Beaded Column Dress', description: 'Sophisticated icy blue column dress with intricate beading along the neckline and hemline. Buy or rent for your next gala!', size: 'S', color: 'Blue', price: 110, dressLength: 'Long', eventType: 'Formal', listingType: 'sell-rent', image: images[17], createdAt: '2026-03-01T08:00:00' },
    { id: 'listing-19', userId: 'user-1', title: 'Mauve Silk Slip Dress', description: 'Effortlessly elegant mauve silk slip dress with delicate spaghetti straps and a cowl neckline.', size: 'M', color: 'Pink', price: 50, dressLength: 'Midi', eventType: 'Semi-Formal', listingType: 'sell', image: images[18], createdAt: '2026-02-26T14:00:00' },
    { id: 'listing-20', userId: 'user-2', title: 'Olive Green Linen Midi', description: 'Casual-chic olive green linen midi dress with side pockets and a tie-waist belt. Great for daytime events.', size: 'L', color: 'Green', price: 35, dressLength: 'Midi', eventType: 'Mixer', listingType: 'sell', image: images[19], createdAt: '2026-03-09T12:00:00' },
    { id: 'listing-21', userId: 'user-3', title: 'Midnight Velvet Off-Shoulder Gown', description: 'Dramatic midnight blue velvet gown with an off-shoulder neckline and a floor-sweeping train.', size: 'M', color: 'Navy', price: 40, dressLength: 'Long', eventType: 'Formal', listingType: 'rent', image: images[20], createdAt: '2026-03-05T17:00:00' },
    { id: 'listing-22', userId: 'user-1', title: 'Sunflower Yellow Fit & Flare', description: 'Cheerful sunflower yellow fit-and-flare dress with a scalloped hem. Perfect for spring mixers and brunch events.', size: 'S', color: 'Gold', price: 45, dressLength: 'Short', eventType: 'Mixer', listingType: 'sell', image: images[21], createdAt: '2026-03-08T11:00:00' },
    { id: 'listing-23', userId: 'user-2', title: 'Plum Sequin High-Low Dress', description: 'Stunning plum sequin dress with a high-low hemline that adds drama and movement. All-over shimmer.', size: 'XS', color: 'Purple', price: 30, dressLength: 'Midi', eventType: 'Date Party', listingType: 'rent', image: images[22], createdAt: '2026-03-03T19:00:00' },
    { id: 'listing-24', userId: 'user-3', title: 'Ivory Lace Tea-Length Dress', description: 'Romantic ivory lace tea-length dress with scalloped edges and a fitted bodice. Vintage-inspired elegance.', size: 'M', color: 'White', price: 0, dressLength: 'Midi', eventType: 'Semi-Formal', listingType: 'trade', image: images[23], createdAt: '2026-03-10T10:00:00' },
  ];
}

export const SEED_MESSAGES: Message[] = [
  { id: 'msg-1', fromUserId: 'user-2', toUserId: 'user-1', listingId: 'listing-1', message: "Hi Emma! I love your rose satin dress. Is it still available? I have a spring formal coming up!", createdAt: '2026-03-08T10:00:00' },
  { id: 'msg-2', fromUserId: 'user-3', toUserId: 'user-1', listingId: 'listing-3', message: "Hey! Would you consider $100 for the gold gown? I've been looking for something like this for our winter gala.", createdAt: '2026-03-09T14:30:00' },
];
