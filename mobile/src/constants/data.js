export const OCCASIONS = [
  { id: 'birthday', label: 'Birthday', icon: '🎂', color: '#FF6B6B' },
  { id: 'anniversary', label: 'Anniversary', icon: '💝', color: '#E55555' },
  { id: 'wedding', label: 'Wedding', icon: '💒', color: '#F57C1F' },
  { id: 'graduation', label: 'Graduation', icon: '🎓', color: '#10B981' },
  { id: 'apology', label: 'Apology', icon: '🙏', color: '#6366F1' },
  { id: 'get-well', label: 'Get Well', icon: '💐', color: '#F59E0B' },
  { id: 'just-because', label: 'Just Because', icon: '🎁', color: '#EC4899' },
  { id: 'christmas', label: 'Christmas', icon: '🎄', color: '#059669' },
  { id: 'eid', label: 'Eid', icon: '🌙', color: '#7C3AED' },
  { id: 'valentines', label: "Valentine's", icon: '❤️', color: '#DC2626' },
];

export const GIFT_CATEGORIES = [
  { id: 'cakes', label: 'Cakes & Desserts', icon: '🎂', image: null },
  { id: 'flowers', label: 'Flowers', icon: '💐', image: null },
  { id: 'chocolates', label: 'Chocolates & Snacks', icon: '🍫', image: null },
  { id: 'hampers', label: 'Gift Hampers', icon: '🧺', image: null },
  { id: 'balloons', label: 'Balloons & Cards', icon: '🎈', image: null },
  { id: 'personalized', label: 'Personalized', icon: '✨', image: null },
];

export const BEAUTY_CATEGORIES = [
  { id: 'nails', label: 'Nails', icon: '💅', image: null },
  { id: 'hair', label: 'Hair Styling', icon: '💇‍♀️', image: null },
  { id: 'makeup', label: 'Makeup', icon: '💄', image: null },
  { id: 'barber', label: 'Barber', icon: '✂️', image: null },
  { id: 'waxing', label: 'Waxing', icon: '🪒', image: null },
  { id: 'massage', label: 'Massage', icon: '💆', image: null },
];

export const ONBOARDING_SLIDES = [
  {
    id: '1',
    title: 'Send Gifts Instantly',
    description: 'Surprise your loved ones with cakes, flowers, hampers and more — delivered right to their door.',
    icon: '🎁',
  },
  {
    id: '2',
    title: 'Book Beauty Services',
    description: 'Find top nail techs, hairdressers, makeup artists and barbers near you — at home or salon.',
    icon: '💅',
  },
  {
    id: '3',
    title: 'Make Moments Special',
    description: 'Send a cake AND book a makeover for the celebrant. One app, endless possibilities.',
    icon: '✨',
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
