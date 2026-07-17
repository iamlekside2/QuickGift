// Icons are Ionicons (outline) line-icon names — no emoji per redesign handoff.
// Colors are drawn from the handoff palette (teal / terracotta / semantic).
export const OCCASIONS = [
  { id: 'birthday', label: 'Birthday', icon: 'balloon-outline', color: '#1F4A45' },
  { id: 'anniversary', label: 'Anniversary', icon: 'heart-outline', color: '#E8632F' },
  { id: 'wedding', label: 'Wedding', icon: 'diamond-outline', color: '#7A5FA8' },
  { id: 'graduation', label: 'Graduation', icon: 'school-outline', color: '#3E8E63' },
  { id: 'apology', label: 'Apology', icon: 'flower-outline', color: '#4C7CB0' },
  { id: 'get-well', label: 'Get Well', icon: 'medkit-outline', color: '#B8862E' },
  { id: 'just-because', label: 'Just Because', icon: 'gift-outline', color: '#E8632F' },
  { id: 'christmas', label: 'Christmas', icon: 'snow-outline', color: '#2F6E4C' },
  { id: 'eid', label: 'Eid', icon: 'moon-outline', color: '#1F4A45' },
  { id: 'valentines', label: "Valentine's", icon: 'heart-circle-outline', color: '#D24B4B' },
];

export const GIFT_CATEGORIES = [
  { id: 'cakes', label: 'Cakes & Desserts', icon: 'ice-cream-outline', color: '#E8632F', image: null },
  { id: 'flowers', label: 'Flowers', icon: 'rose-outline', color: '#D24B4B', image: null },
  { id: 'chocolates', label: 'Chocolates & Snacks', icon: 'fast-food-outline', color: '#B8862E', image: null },
  { id: 'hampers', label: 'Gift Hampers', icon: 'basket-outline', color: '#1F4A45', image: null },
  { id: 'balloons', label: 'Balloons & Cards', icon: 'balloon-outline', color: '#7A5FA8', image: null },
  { id: 'personalized', label: 'Personalized', icon: 'color-wand-outline', color: '#3E8E63', image: null },
];

export const BEAUTY_CATEGORIES = [
  { id: 'nails', label: 'Nails', icon: 'hand-left-outline', color: '#E8632F', image: null },
  { id: 'hair', label: 'Hair Styling', icon: 'cut-outline', color: '#1F4A45', image: null },
  { id: 'makeup', label: 'Makeup', icon: 'brush-outline', color: '#7A5FA8', image: null },
  { id: 'barber', label: 'Barber', icon: 'people-outline', color: '#4C7CB0', image: null },
  { id: 'waxing', label: 'Waxing', icon: 'sparkles-outline', color: '#B8862E', image: null },
  { id: 'massage', label: 'Massage', icon: 'body-outline', color: '#3E8E63', image: null },
];

export const ONBOARDING_SLIDES = [
  {
    id: '1',
    title: 'Gifts, delivered today.',
    emphasis: 'today',
    description: 'Cakes, flowers, hampers and more — ordered in minutes, delivered before the moment passes.',
    image: require('../../assets/images/onboarding-1.png'),
  },
  {
    id: '2',
    title: 'Skilled hands, on demand.',
    emphasis: 'on demand',
    description: 'Book a nail tech, hairstylist, or makeup artist. They come to you — you just show up as yourself.',
    image: require('../../assets/images/onboarding-2.png'),
  },
  {
    id: '3',
    title: 'Every occasion, handled.',
    emphasis: 'handled',
    description: 'Combine gifts and beauty services in one place — because the best surprises look effortless.',
    image: require('../../assets/images/onboarding-3.png'),
  },
];

export const FEATURED_GIFTS = [
  { id: '1', name: 'Red Velvet Cake', price: 15000, rating: 4.8, reviews: 124, category: 'cakes', vendor: 'Sweet Treats Lagos', image: null },
  { id: '2', name: 'Rose Bouquet (24 stems)', price: 25000, rating: 4.9, reviews: 89, category: 'flowers', vendor: 'Bloom Nigeria', image: null },
  { id: '3', name: 'Luxury Chocolate Box', price: 12000, rating: 4.7, reviews: 56, category: 'chocolates', vendor: 'ChocoLux', image: null },
  { id: '4', name: 'Birthday Hamper Deluxe', price: 35000, rating: 4.9, reviews: 201, category: 'hampers', vendor: 'GiftBox NG', image: null },
  { id: '5', name: 'Custom Photo Mug', price: 5000, rating: 4.5, reviews: 78, category: 'personalized', vendor: 'PrintHub', image: null },
  { id: '6', name: 'Balloon Arch Set', price: 18000, rating: 4.6, reviews: 42, category: 'balloons', vendor: 'Party Central', image: null },
];

export const FEATURED_PROVIDERS = [
  { id: '1', name: 'Amara Nails', service: 'Nail Technician', rating: 4.9, reviews: 230, price: 5000, location: 'Lekki, Lagos', available: true, image: null },
  { id: '2', name: 'Bimpe Hair Studio', service: 'Hair Stylist', rating: 4.8, reviews: 189, price: 8000, location: 'VI, Lagos', available: true, image: null },
  { id: '3', name: 'Tolu MUA', service: 'Makeup Artist', rating: 4.9, reviews: 310, price: 15000, location: 'Ikeja, Lagos', available: false, image: null },
  { id: '4', name: 'Fresh Cuts Abuja', service: 'Barber', rating: 4.7, reviews: 156, price: 3000, location: 'Wuse, Abuja', available: true, image: null },
];
