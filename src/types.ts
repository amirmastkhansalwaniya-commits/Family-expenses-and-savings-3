export const DEFAULT_FAMILY_MEMBERS = [
  'Aamir Khan',
  'Angrej Singh',
  'Kajal',
  'Shahnaz',
  'Sonam'
] as const;

export const FAMILY_MEMBERS = [...DEFAULT_FAMILY_MEMBERS];

export type FamilyMember = string;

export const ADMIN_MEMBER: FamilyMember = 'Aamir Khan';

export interface MemberCustomConfig {
  name: string;
  emoji?: string;
  photoUrl?: string; // base64 data url from gallery or image URL
  color?: string; // theme color key: 'blue', 'emerald', 'pink', 'orange', 'purple', 'amber', 'indigo', 'rose', 'teal', 'cyan'
}

export interface MemberTheme {
  color: string;
  hex: string;
  bg: string;
  text: string;
  border: string;
  badgeBg: string;
  badgeText: string;
  avatarBg: string;
  initials: string;
  emoji: string;
  photoUrl?: string;
}

const COLOR_MAP: Record<string, Omit<MemberTheme, 'initials' | 'emoji' | 'photoUrl'>> = {
  blue: {
    color: 'blue',
    hex: '#2563eb',
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    border: 'border-blue-500',
    badgeBg: 'bg-blue-50 border-blue-200',
    badgeText: 'text-blue-700',
    avatarBg: 'bg-blue-500 text-white',
  },
  emerald: {
    color: 'emerald',
    hex: '#10b981',
    bg: 'bg-emerald-500',
    text: 'text-emerald-600',
    border: 'border-emerald-500',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeText: 'text-emerald-700',
    avatarBg: 'bg-emerald-500 text-white',
  },
  pink: {
    color: 'pink',
    hex: '#ec4899',
    bg: 'bg-pink-500',
    text: 'text-pink-600',
    border: 'border-pink-500',
    badgeBg: 'bg-pink-50 border-pink-200',
    badgeText: 'text-pink-700',
    avatarBg: 'bg-pink-500 text-white',
  },
  orange: {
    color: 'orange',
    hex: '#f97316',
    bg: 'bg-orange-500',
    text: 'text-orange-600',
    border: 'border-orange-500',
    badgeBg: 'bg-orange-50 border-orange-200',
    badgeText: 'text-orange-700',
    avatarBg: 'bg-orange-500 text-white',
  },
  purple: {
    color: 'purple',
    hex: '#a855f7',
    bg: 'bg-purple-500',
    text: 'text-purple-600',
    border: 'border-purple-500',
    badgeBg: 'bg-purple-50 border-purple-200',
    badgeText: 'text-purple-700',
    avatarBg: 'bg-purple-500 text-white',
  },
  amber: {
    color: 'amber',
    hex: '#f59e0b',
    bg: 'bg-amber-500',
    text: 'text-amber-600',
    border: 'border-amber-500',
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeText: 'text-amber-700',
    avatarBg: 'bg-amber-500 text-white',
  },
  indigo: {
    color: 'indigo',
    hex: '#6366f1',
    bg: 'bg-indigo-500',
    text: 'text-indigo-600',
    border: 'border-indigo-500',
    badgeBg: 'bg-indigo-50 border-indigo-200',
    badgeText: 'text-indigo-700',
    avatarBg: 'bg-indigo-500 text-white',
  },
  rose: {
    color: 'rose',
    hex: '#f43f5e',
    bg: 'bg-rose-500',
    text: 'text-rose-600',
    border: 'border-rose-500',
    badgeBg: 'bg-rose-50 border-rose-200',
    badgeText: 'text-rose-700',
    avatarBg: 'bg-rose-500 text-white',
  },
  teal: {
    color: 'teal',
    hex: '#14b8a6',
    bg: 'bg-teal-500',
    text: 'text-teal-600',
    border: 'border-teal-500',
    badgeBg: 'bg-teal-50 border-teal-200',
    badgeText: 'text-teal-700',
    avatarBg: 'bg-teal-500 text-white',
  },
  cyan: {
    color: 'cyan',
    hex: '#06b6d4',
    bg: 'bg-cyan-500',
    text: 'text-cyan-600',
    border: 'border-cyan-500',
    badgeBg: 'bg-cyan-50 border-cyan-200',
    badgeText: 'text-cyan-700',
    avatarBg: 'bg-cyan-500 text-white',
  },
};

export function getMemberInitials(name: string): string {
  if (!name) return 'FM';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function getMemberTheme(
  member: string,
  customConfigs?: Record<string, MemberCustomConfig>
): MemberTheme {
  const custom = customConfigs?.[member];
  const defaultMap: Record<string, { color: string; emoji: string }> = {
    'Aamir Khan': { color: 'blue', emoji: '🧔‍♂️' },
    'Amir Khan': { color: 'blue', emoji: '🧔‍♂️' },
    'Angrej Singh': { color: 'emerald', emoji: '🧔' },
    'Kajal': { color: 'pink', emoji: '👩' },
    'Shahnaz': { color: 'orange', emoji: '🧕' },
    'Sonam': { color: 'purple', emoji: '👩‍🎓' },
  };

  const chosenColor = custom?.color || defaultMap[member]?.color || 'indigo';
  const colorTheme = COLOR_MAP[chosenColor] || COLOR_MAP.indigo;
  const emoji = custom?.emoji || defaultMap[member]?.emoji || '👤';
  const photoUrl = custom?.photoUrl;
  const initials = getMemberInitials(member);

  return {
    ...colorTheme,
    initials,
    emoji,
    photoUrl,
  };
}

export const MEMBER_THEMES: Record<string, MemberTheme> = new Proxy({}, {
  get: (_target, prop: string) => {
    return getMemberTheme(prop);
  }
});

export interface GrocerySubtype {
  id: string;
  label: string;
  emoji: string;
  defaultNotes: string;
  isCustom?: boolean;
}

export type CategorySubtype = GrocerySubtype;

export const GROCERY_SUBTYPES: GrocerySubtype[] = [
  { id: 'quick_commerce', label: 'Blinkit / Zepto / Instamart', emoji: '⚡', defaultNotes: '10-Min Quick Commerce Grocery Delivery' },
  { id: 'bulk_ration', label: 'Monthly Bulk Ration', emoji: '📦', defaultNotes: 'Monthly Atta, Rice, Pulses, Oil & Sugar' },
  { id: 'atta_grains', label: 'Atta, Flour & Grains', emoji: '🌾', defaultNotes: 'Wheat flour, Atta, Besan, Maida & Suji' },
  { id: 'rice_pulses', label: 'Rice, Dal & Pulses', emoji: '🍚', defaultNotes: 'Basmati rice, Toor dal, Moong & Chana' },
  { id: 'oil_ghee', label: 'Cooking Oil & Ghee', emoji: '🛢️', defaultNotes: 'Mustard oil, Sunflower oil & Desi Ghee' },
  { id: 'spices_masalas', label: 'Spices, Salt & Masalas', emoji: '🧂', defaultNotes: 'Spices, Turmeric, Salt & Whole Masalas' },
  { id: 'dairy', label: 'Milk, Curd & Dairy', emoji: '🥛', defaultNotes: 'Daily milk, paneer, curd & butter' },
  { id: 'breakfast_bakery', label: 'Bread, Eggs & Bakery', emoji: '🍞', defaultNotes: 'Fresh bread, eggs, butter & bakery items' },
  { id: 'staple_veggies', label: 'Daily Mandi Veggies', emoji: '🧄', defaultNotes: 'Daily potatoes, onions, tomatoes & green veggies' },
  { id: 'seasonal_fruits', label: 'Fresh Fruits & Juices', emoji: '🥭', defaultNotes: 'Fresh seasonal fruits, apples & bananas' },
  { id: 'kirana', label: 'Kirana Store & Spices', emoji: '🏪', defaultNotes: 'Local Kirana shop grocery items' },
  { id: 'supermarket', label: 'Supermarket / D-Mart', emoji: '🛒', defaultNotes: 'Supermarket cart bulk shopping' },
  { id: 'beverages', label: 'Beverages & Soft Drinks', emoji: '🥤', defaultNotes: 'Fruit juices, cold drinks, tea & coffee' },
  { id: 'meat', label: 'Meat, Fish & Poultry', emoji: '🥩', defaultNotes: 'Fresh chicken, mutton, fish & seafood' },
  { id: 'frozen_foods', label: 'Frozen & Ready-to-Cook', emoji: '🧊', defaultNotes: 'Frozen paneer, green peas, fries & ready meals' },
  { id: 'household', label: 'Cleaning & Household', emoji: '🧹', defaultNotes: 'Detergent, soaps, cleaners & tissues' },
  { id: 'tea_snacks', label: 'Tea, Coffee & Dry Fruits', emoji: '☕', defaultNotes: 'Tea leaves, coffee, almonds, cashews & raisins' },
  { id: 'personal_care', label: 'Personal Care & Hygiene', emoji: '🧴', defaultNotes: 'Shampoo, soaps, toothpaste & skincare' },
  { id: 'baby_care', label: 'Baby Care & Diapers', emoji: '🍼', defaultNotes: 'Baby food, milk powder & diapers' },
  { id: 'snacks_sweets', label: 'Snacks & Biscuits', emoji: '🍪', defaultNotes: 'Namkeen, biscuits, chips & chocolates' },
  { id: 'pooja_supplies', label: 'Pooja & Festival Essentials', emoji: '🪔', defaultNotes: 'Agarbatti, camphor, ghee & puja items' },
  { id: 'pet_care', label: 'Pet Food & Supplies', emoji: '🐶', defaultNotes: 'Dog/cat food, treats & pet care' },
];

export type GrocerySubtypeId = string;

export const CATEGORIES = [
  { id: 'Groceries', label: 'Groceries & Family Ration', icon: 'ShoppingCart', color: 'emerald' },
  { id: 'SIP', label: 'SIP & Investments', icon: 'TrendingUp', color: 'emerald' },
  { id: 'EMI', label: 'EMI & Loan Installments', icon: 'CreditCard', color: 'indigo' },
  { id: 'Utilities', label: 'Utilities (Electricity/Water/Wifi)', icon: 'Zap', color: 'amber' },
  { id: 'Medical', label: 'Medical & Healthcare', icon: 'HeartPulse', color: 'rose' },
  { id: 'Fuel', label: 'Fuel & Transportation', icon: 'Fuel', color: 'blue' },
  { id: 'Rent', label: 'Rent & Housing', icon: 'Home', color: 'indigo' },
  { id: 'Dining', label: 'Dining & Snacks', icon: 'Utensils', color: 'orange' },
  { id: 'Education', label: 'Education & Fees', icon: 'GraduationCap', color: 'purple' },
  { id: 'Shopping', label: 'Shopping & Clothes', icon: 'ShoppingBag', color: 'pink' },
  { id: 'Entertainment', label: 'Entertainment & Movies', icon: 'Film', color: 'cyan' },
  { id: 'Household', label: 'Household Items', icon: 'Package', color: 'teal' },
  { id: 'Travel', label: 'Travel & Vacations', icon: 'Plane', color: 'sky' },
  { id: 'Insurance', label: 'Insurance & Protection', icon: 'ShieldCheck', color: 'violet' },
  { id: 'Maintenance', label: 'Home & Vehicle Maintenance', icon: 'Wrench', color: 'amber' },
  { id: 'PersonalCare', label: 'Personal Care & Beauty', icon: 'Sparkles', color: 'rose' },
  { id: 'GiftsDonations', label: 'Gifts, Pooja & Charity', icon: 'Gift', color: 'fuchsia' },
  { id: 'Subscriptions', label: 'Digital Subscriptions & Apps', icon: 'Tv', color: 'blue' },
  { id: 'Fitness', label: 'Fitness, Sports & Gym', icon: 'Dumbbell', color: 'lime' },
  { id: 'Pets', label: 'Pet Care & Supplies', icon: 'Dog', color: 'orange' },
  { id: 'BabyChild', label: 'Baby & Child Care', icon: 'Baby', color: 'pink' },
  { id: 'Taxes', label: 'Government Taxes & Fees', icon: 'Landmark', color: 'slate' },
  { id: 'Business', label: 'Business & Office Expenses', icon: 'Briefcase', color: 'indigo' },
  { id: 'SavingsReserve', label: 'Emergency Reserve & Cash', icon: 'PiggyBank', color: 'emerald' },
  { id: 'Others', label: 'Others / Misc', icon: 'MoreHorizontal', color: 'slate' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];

export const CATEGORY_SUBTYPES_MAP: Record<CategoryId, CategorySubtype[]> = {
  Groceries: GROCERY_SUBTYPES,
  Utilities: [
    { id: 'electricity', label: 'Electricity Bill', emoji: '⚡', defaultNotes: 'Monthly home electricity power bill' },
    { id: 'wifi_broadband', label: 'Wifi & Broadband Internet', emoji: '📡', defaultNotes: 'High speed Wi-Fi broadband bill' },
    { id: 'mobile_recharge', label: 'Mobile Recharge & Postpaid', emoji: '📱', defaultNotes: 'Mobile prepaid recharge / postpaid plan' },
    { id: 'lpg_gas', label: 'Piped Gas & LPG Cylinder', emoji: '⛽', defaultNotes: 'LPG Cooking gas cylinder / piped gas bill' },
    { id: 'water_bill', label: 'Water Supply Bill', emoji: '💧', defaultNotes: 'Municipal / Society water supply charges' },
    { id: 'dth_cable', label: 'Cable TV & DTH Recharge', emoji: '📺', defaultNotes: 'Tata Play / Airtel DTH / Cable TV recharge' },
    { id: 'society_maintenance', label: 'Building & Society Maintenance', emoji: '🏢', defaultNotes: 'Monthly building / society maintenance charges' },
  ],
  Medical: [
    { id: 'medicines', label: 'Medicines & Pharmacy', emoji: '💊', defaultNotes: 'Daily medicines & pharmacy purchase' },
    { id: 'doctor_consultation', label: 'Doctor Consultation & Clinic', emoji: '🩺', defaultNotes: 'Doctor clinic consultation fee' },
    { id: 'lab_tests', label: 'Lab Tests & Diagnostics', emoji: '🧪', defaultNotes: 'Blood test, X-Ray & diagnostic lab fee' },
    { id: 'dental_care', label: 'Dental Care & Clinic', emoji: '🦷', defaultNotes: 'Dental checkup & treatment' },
    { id: 'hospital_bill', label: 'Hospital & Emergency', emoji: '🏥', defaultNotes: 'Hospital treatment / emergency medical bill' },
    { id: 'health_insurance', label: 'Health Insurance Premium', emoji: '🛡️', defaultNotes: 'Health & medical insurance premium' },
    { id: 'eye_care', label: 'Eye Care & Spectacles', emoji: '👓', defaultNotes: 'Eye test, prescription glasses & lenses' },
    { id: 'supplements', label: 'Vitamins & Health Supplements', emoji: '🌿', defaultNotes: 'Protein, multivitamins & health supplements' },
  ],
  Fuel: [
    { id: 'petrol_diesel', label: 'Petrol / Diesel Fuel', emoji: '⛽', defaultNotes: 'Car / Bike petrol fuel refilling' },
    { id: 'vehicle_service', label: 'Vehicle Servicing & Repair', emoji: '🔧', defaultNotes: 'Bike / Car service, engine oil & repair' },
    { id: 'taxi_cab', label: 'Taxi / Cab (Uber / Ola)', emoji: '🚕', defaultNotes: 'Uber / Ola cab fare for travel' },
    { id: 'auto_rickshaw', label: 'Auto & E-Rickshaw Fare', emoji: '🛺', defaultNotes: 'Local auto rickshaw fare' },
    { id: 'metro_bus', label: 'Metro Card & Bus Pass', emoji: '🚆', defaultNotes: 'Metro card recharge / Bus ticket fare' },
    { id: 'toll_fastag', label: 'Toll Tax & FASTag Recharge', emoji: '🚗', defaultNotes: 'FASTag recharge & highway toll tax' },
    { id: 'parking_fee', label: 'Vehicle Parking Fee', emoji: '🅿️', defaultNotes: 'Car / Bike parking fee' },
  ],
  Dining: [
    { id: 'restaurant_dining', label: 'Restaurant & Family Dinner', emoji: '🍽️', defaultNotes: 'Family restaurant lunch / dinner' },
    { id: 'food_delivery', label: 'Zomato & Swiggy Delivery', emoji: '🛵', defaultNotes: 'Zomato / Swiggy online food order' },
    { id: 'tea_coffee', label: 'Tea, Coffee & Snacks Stall', emoji: '☕', defaultNotes: 'Tea stall, coffee & evening snacks' },
    { id: 'fast_food', label: 'Fast Food, Pizza & Burgers', emoji: '🍕', defaultNotes: 'Burgers, pizza & fast food treat' },
    { id: 'bakery_cakes', label: 'Bakery, Cakes & Pastries', emoji: '🍰', defaultNotes: 'Birthday cake, pastries & bakery items' },
    { id: 'office_lunch', label: 'Office Canteen & Daily Thali', emoji: '🍱', defaultNotes: 'Daily office canteen lunch & thali' },
    { id: 'ice_cream', label: 'Ice Cream & Shakes', emoji: '🍦', defaultNotes: 'Ice cream parlour & cold shakes' },
  ],
  Shopping: [
    { id: 'clothing_apparel', label: 'Clothing, Dresses & Shirts', emoji: '👗', defaultNotes: 'Family clothes, shirts, dresses & ethnic wear' },
    { id: 'footwear_shoes', label: 'Footwear & Shoes', emoji: '👟', defaultNotes: 'Shoes, sandals & footwear' },
    { id: 'electronics', label: 'Mobiles, Laptops & Gadgets', emoji: '💻', defaultNotes: 'Mobile, laptop & electronic gadgets' },
    { id: 'online_shopping', label: 'Amazon / Flipkart Orders', emoji: '🛒', defaultNotes: 'Amazon / Flipkart online shopping' },
    { id: 'home_decor', label: 'Home Decor & Furniture', emoji: '🪑', defaultNotes: 'Furniture, curtains & home decor' },
    { id: 'cosmetics_beauty', label: 'Cosmetics & Beauty Products', emoji: '💄', defaultNotes: 'Makeup, skincare & salon products' },
    { id: 'gifts_festive', label: 'Gifts & Festive Presents', emoji: '🎁', defaultNotes: 'Birthday gift & festive celebration shopping' },
  ],
  Education: [
    { id: 'school_college_fee', label: 'School / College Quarterly Fee', emoji: '🎒', defaultNotes: 'Quarterly / monthly school or college fee' },
    { id: 'tuition_coaching', label: 'Tuition & Coaching Classes', emoji: '📚', defaultNotes: 'Coaching classes & home tuition fee' },
    { id: 'books_stationery', label: 'Books, Copies & Stationery', emoji: '✏️', defaultNotes: 'Notebooks, pens, textbooks & stationery' },
    { id: 'exam_admission', label: 'Exam Fees & Registration', emoji: '📑', defaultNotes: 'Competitive exam fee & registration form' },
    { id: 'online_courses', label: 'Online Courses & Upskilling', emoji: '💻', defaultNotes: 'Udemy, Coursera or online skill course' },
    { id: 'school_transport', label: 'School Bus & Van Fare', emoji: '🚌', defaultNotes: 'Monthly school bus / van fee' },
  ],
  Entertainment: [
    { id: 'movie_tickets', label: 'Movie Tickets (BookMyShow)', emoji: '🎟️', defaultNotes: 'Cinema hall movie tickets & popcorn' },
    { id: 'ott_subscriptions', label: 'OTT (Netflix, Prime, Hotstar)', emoji: '🎬', defaultNotes: 'Netflix, Prime Video, Hotstar recharge' },
    { id: 'family_outing', label: 'Family Outing & Amusement Parks', emoji: '🎡', defaultNotes: 'Theme park, museum & fun trip' },
    { id: 'gaming_apps', label: 'Video Games & App Purchases', emoji: '🎮', defaultNotes: 'In-game pass, Playstation, Steam purchase' },
    { id: 'concerts_events', label: 'Concerts & Sports Matches', emoji: '🎙️', defaultNotes: 'Event tickets, sports match & concert' },
  ],
  Rent: [
    { id: 'house_rent', label: 'House Monthly Rent', emoji: '🏠', defaultNotes: 'Monthly home rental payment' },
    { id: 'shop_rent', label: 'Shop / Commercial Space Rent', emoji: '🏬', defaultNotes: 'Commercial shop or office space rent' },
    { id: 'maid_salary', label: 'Maid, Cook & Housekeeping Salary', emoji: '🧹', defaultNotes: 'Monthly salary for house maid, cook or cleaner' },
    { id: 'security_salary', label: 'Security Guard Monthly Fee', emoji: '🛡️', defaultNotes: 'Society security guard salary contribution' },
  ],
  SIP: [
    { id: 'equity_mutual_funds', label: 'Equity Mutual Funds SIP', emoji: '📈', defaultNotes: 'Monthly equity index & flexicap SIP' },
    { id: 'gold_sgb', label: 'Digital Gold / SGB', emoji: '🪙', defaultNotes: 'Sovereign Gold Bond / Gold SIP' },
    { id: 'fixed_deposit', label: 'Bank FD / Recurring Deposit', emoji: '🏦', defaultNotes: 'Bank FD / RD monthly installment' },
    { id: 'ppf_nps', label: 'PPF & NPS Retirement Fund', emoji: '📜', defaultNotes: 'Public Provident Fund / NPS contribution' },
    { id: 'direct_stocks', label: 'Direct Stock Market Portfolio', emoji: '📊', defaultNotes: 'Direct stock investment portfolio top-up' },
  ],
  EMI: [
    { id: 'home_loan_emi', label: 'Home Loan Monthly EMI', emoji: '🏠', defaultNotes: 'Monthly home loan installment' },
    { id: 'vehicle_loan_emi', label: 'Car / Bike Loan EMI', emoji: '🚘', defaultNotes: 'Monthly car / bike loan EMI' },
    { id: 'personal_loan_emi', label: 'Personal Loan Installment', emoji: '💳', defaultNotes: 'Bank personal loan installment' },
    { id: 'credit_card_bill', label: 'Credit Card Bill Payment', emoji: '💳', defaultNotes: 'Monthly credit card bill settlement' },
    { id: 'gadget_appliance_emi', label: 'Mobile / TV No-Cost EMI', emoji: '📱', defaultNotes: 'Phone or TV no-cost EMI installment' },
  ],
  Household: [
    { id: 'furniture_carpentry', label: 'Furniture & Carpentry Repair', emoji: '🔨', defaultNotes: 'Furniture repair & woodwork' },
    { id: 'kitchenware', label: 'Kitchen Cookware & Utensils', emoji: '🍳', defaultNotes: 'Pans, pressure cooker & kitchen utensils' },
    { id: 'electrical_fittings', label: 'Electrical Lights, Switches & Plugs', emoji: '💡', defaultNotes: 'LED bulbs, extension boards & switches' },
    { id: 'bedding_curtains', label: 'Bedsheets, Towels & Curtains', emoji: '🛏️', defaultNotes: 'Bedsheets, pillows & window curtains' },
    { id: 'pest_control', label: 'Pest Control & Deep Cleaning', emoji: '🪲', defaultNotes: 'Home pest control treatment' },
  ],
  Travel: [
    { id: 'flight_tickets', label: 'Flight Tickets', emoji: '✈️', defaultNotes: 'Airline flight tickets booking' },
    { id: 'train_tickets', label: 'Train & Rail Tickets (IRCTC)', emoji: '🚆', defaultNotes: 'IRCTC train ticket booking' },
    { id: 'hotel_resort', label: 'Hotel & Resort Stay', emoji: '🏨', defaultNotes: 'Hotel / resort room booking' },
    { id: 'tour_package', label: 'Vacation Tour Package', emoji: '🏝️', defaultNotes: 'Family holiday tour package' },
    { id: 'sightseeing_fun', label: 'Sightseeing & Entry Passes', emoji: '🎟️', defaultNotes: 'Tourist spots & sightseeing entry tickets' },
  ],
  Insurance: [
    { id: 'term_life_insurance', label: 'Term Life Insurance Premium', emoji: '🛡️', defaultNotes: 'Term life insurance policy premium' },
    { id: 'health_policy', label: 'Family Health Insurance', emoji: '🏥', defaultNotes: 'Family health insurance policy payment' },
    { id: 'car_bike_insurance', label: 'Vehicle Insurance Renewal', emoji: '🚗', defaultNotes: 'Car / Bike motor insurance renewal' },
    { id: 'home_property_insurance', label: 'Home & Property Insurance', emoji: '🏠', defaultNotes: 'Home structure & asset policy' },
  ],
  Maintenance: [
    { id: 'ac_service', label: 'AC Service & Gas Refill', emoji: '❄️', defaultNotes: 'Air conditioner servicing & gas refilling' },
    { id: 'plumbing_electrical', label: 'Plumber & Electrician Repair', emoji: '🧰', defaultNotes: 'Plumbing / electrical home repair service' },
    { id: 'car_mechanic', label: 'Car & Bike Maintenance', emoji: '🚘', defaultNotes: 'Vehicle mechanic servicing & repair' },
    { id: 'painting_whitewash', label: 'Home Painting & Whitewash', emoji: '🎨', defaultNotes: 'Wall painting & home whitewash' },
  ],
  PersonalCare: [
    { id: 'salon_haircut', label: 'Salon, Haircut & Grooming', emoji: '✂️', defaultNotes: 'Haircut, shaving & salon styling' },
    { id: 'skincare_cosmetics', label: 'Skincare & Cosmetics', emoji: '💄', defaultNotes: 'Skincare products, cream & cosmetics' },
    { id: 'spa_massage', label: 'Spa & Relaxation', emoji: '💆', defaultNotes: 'Spa therapy & relaxation' },
  ],
  GiftsDonations: [
    { id: 'wedding_gifts', label: 'Wedding & Anniversary Gifts', emoji: '🎁', defaultNotes: 'Shagun cash / wedding gift' },
    { id: 'birthday_presents', label: 'Birthday Presents', emoji: '🎂', defaultNotes: 'Birthday gift & party treat' },
    { id: 'pooja_charity', label: 'Religious Pooja & Mandir Giving', emoji: '🪔', defaultNotes: 'Mandir donation & pooja expense' },
    { id: 'ngo_zakat', label: 'Charity & Zakat Donations', emoji: '🤲', defaultNotes: 'Charitable donation & Zakat helping' },
  ],
  Subscriptions: [
    { id: 'ott_streaming', label: 'Netflix / Prime / Hotstar', emoji: '📺', defaultNotes: 'Video streaming subscription' },
    { id: 'music_streaming', label: 'Spotify / Apple Music', emoji: '🎵', defaultNotes: 'Music subscription' },
    { id: 'cloud_storage', label: 'Google One / iCloud Storage', emoji: '☁️', defaultNotes: 'Cloud storage subscription' },
    { id: 'software_apps', label: 'Software & Productivity Apps', emoji: '💻', defaultNotes: 'Antivirus, Microsoft 365 or software' },
  ],
  Fitness: [
    { id: 'gym_membership', label: 'Gym Monthly / Annual Fee', emoji: '🏋️', defaultNotes: 'Gym membership fee' },
    { id: 'yoga_sports', label: 'Yoga & Sports Coaching', emoji: '🧘', defaultNotes: 'Yoga classes / sports coaching' },
    { id: 'protein_supplements', label: 'Whey Protein & Fitness Nutrition', emoji: '🥛', defaultNotes: 'Whey protein powder & fitness nutrition' },
  ],
  Pets: [
    { id: 'pet_food', label: 'Dog / Cat Food & Treats', emoji: '🐶', defaultNotes: 'Pet food & dog/cat treats' },
    { id: 'vet_clinic', label: 'Vet Consultation & Vaccination', emoji: '🩺', defaultNotes: 'Veterinary doctor consultation & vaccine' },
    { id: 'pet_grooming', label: 'Pet Grooming & Toys', emoji: '🧸', defaultNotes: 'Pet grooming & toy accessories' },
  ],
  BabyChild: [
    { id: 'diapers_wipes', label: 'Diapers & Baby Wipes', emoji: '👶', defaultNotes: 'Baby diapers & wet wipes purchase' },
    { id: 'baby_food_formula', label: 'Baby Food & Powdered Milk', emoji: '🍼', defaultNotes: 'Cerelac, baby food & milk powder' },
    { id: 'toys_baby_clothes', label: 'Baby Clothes & Toys', emoji: '🧸', defaultNotes: 'Baby romper, toys & clothes' },
    { id: 'daycare_nanny', label: 'Daycare & Nanny Charges', emoji: '🏡', defaultNotes: 'Daycare center or nanny monthly fee' },
  ],
  Taxes: [
    { id: 'income_tax', label: 'Income Tax Advance Payment', emoji: '📑', defaultNotes: 'Advance income tax payment' },
    { id: 'property_tax', label: 'Municipal Property Tax', emoji: '🏢', defaultNotes: 'Annual municipal house property tax' },
    { id: 'gst_filing', label: 'GST & CA Accounting Fees', emoji: '📊', defaultNotes: 'GST filing & CA consultation fee' },
  ],
  Business: [
    { id: 'office_stationery', label: 'Office Supplies & Printing', emoji: '🖨️', defaultNotes: 'Printing paper, ink & office stationery' },
    { id: 'client_lunch', label: 'Client Meetings & Coffee', emoji: '☕', defaultNotes: 'Client meeting coffee / business lunch' },
    { id: 'coworking_space', label: 'Co-working Office Rent', emoji: '🏢', defaultNotes: 'Co-working space desk rental' },
  ],
  SavingsReserve: [
    { id: 'emergency_fund', label: 'Emergency Reserve Deposit', emoji: '🏦', defaultNotes: 'Family emergency cash reserve deposit' },
    { id: 'gold_purchase', label: 'Gold Coin / Jewellery Savings', emoji: '🪙', defaultNotes: 'Gold coin / gold savings deposit' },
  ],
  Others: [
    { id: 'pocket_money', label: 'Pocket Money & Cash Allowance', emoji: '💵', defaultNotes: 'Cash allowance / personal expense pocket money' },
    { id: 'charity_donation', label: 'Charity, Zakat & Donations', emoji: '🤲', defaultNotes: 'Charitable donation / religious giving' },
    { id: 'festival_event', label: 'Festival & Wedding Celebration', emoji: '🎉', defaultNotes: 'Festival celebration & event expense' },
    { id: 'govt_taxes', label: 'Government Taxes & Stamp Duty', emoji: '📜', defaultNotes: 'Government property tax / stamp fee' },
    { id: 'misc_unplanned', label: 'Miscellaneous Unplanned Expense', emoji: '🌀', defaultNotes: 'Unspecified daily miscellaneous expense' },
  ],
};

export interface Expense {
  id: string;
  amount: number; // strictly in INR (₹)
  category: CategoryId;
  paidBy: FamilyMember;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm format
  notes?: string;
  createdAt?: string;
  addedByMember?: string;
  isEmiPayment?: boolean;
  emiPlanId?: string;
}

export interface EmiPlan {
  id: string;
  title: string; // e.g. "Home Loan (SBI)", "iPhone 15 Pro", "Bike Loan"
  totalAmount: number; // Total principal or purchase amount in ₹
  emiAmount: number; // Monthly installment amount in ₹
  tenureMonths: number; // e.g., 6, 12, 24, 36
  paidMonths: number; // e.g., 4
  startMonth: string; // YYYY-MM format
  paidBy: FamilyMember;
  category: CategoryId;
  notes?: string;
  status: 'active' | 'completed' | 'paused';
  createdAt?: string;
  addedByMember?: string;
  paymentHistory?: string[]; // Array of YYYY-MM months when payment was logged
  interestRate?: number; // Optional annual interest rate %
}

export interface FamilyBudget {
  monthlyBudget: number; // in INR (₹)
  month: string; // YYYY-MM format
}

export interface SettlementSummary {
  member: FamilyMember;
  totalPaid: number;
  averageShare: number;
  netBalance: number; // positive = spent more than average (gets back), negative = owes
}

export interface MemberBankAmount {
  id: string;
  member: FamilyMember;
  pendingBankAmount: number; // in ₹
  bankName?: string; // e.g. "SBI", "HDFC", "GPay / UPI"
  accountNumberLast4?: string; // e.g. "4821"
  upiId?: string; // e.g. "amir@okicici"
  notes?: string;
  status: 'pending' | 'received' | 'partially_settled';
  lastUpdated?: string;
  customTotalSpentOverride?: number; // Optional manual override for Total Spent
  customMonthSpentOverride?: number; // Optional manual override for Spent of this month
}

export const SIP_FUND_CATEGORIES = [
  'Mutual Funds (Equity)',
  'Index Funds (Nifty 50 / Sensex)',
  'Small Cap / Mid Cap Funds',
  'Flexi Cap / Large Cap Funds',
  'ELSS Tax Saving Funds',
  'PPF / Post Office Monthly',
  'National Pension Scheme (NPS)',
  'Gold & Sovereign Gold Bond (SGB)',
  'Direct Equity / Stocks SIP',
  'Debt / Liquid / Hybrid Funds',
  'REITs & Infrastructure Bonds',
  'Fixed Deposit (FD) / Recurring Deposit (RD)',
  'Cryptocurrency / Web3 SIP',
  'Other / Custom Category'
] as const;

export type SipFundCategory = typeof SIP_FUND_CATEGORIES[number] | (string & {});

export const SIP_GOAL_OPTIONS = [
  'Wealth Generation',
  'Retirement Fund',
  'Retirement Corpus',
  'Child Higher Education',
  'Child Marriage',
  'Home Down Payment',
  'Home Down Payment / Real Estate',
  'Emergency Corpus',
  'Tax Saving (ELSS)',
  'Tax Saving (ELSS / 80C)',
  'Dream Vehicle / Car Purchase',
  'World Tour & Family Vacation',
  'Business Expansion / Startup Capital',
  'Medical / Health Reserve',
  'Other / Custom Goal'
] as const;

export type SipGoalOption = typeof SIP_GOAL_OPTIONS[number] | (string & {});

export interface SipPlan {
  id: string;
  title: string; // e.g. "Parag Parikh Flexi Cap Fund", "Nifty 50 Index SIP", "SBI Small Cap"
  monthlyAmount: number; // Monthly investment in ₹
  expectedRateOfReturn: number; // Expected Annual Return Rate % (e.g., 12.5)
  tenureYears: number; // Investment duration in years (e.g. 5, 10, 15, 20)
  startMonth: string; // YYYY-MM format
  completedMonths: number; // Number of monthly SIP installments paid
  paidBy: FamilyMember;
  fundCategory: string; // e.g., "Mutual Funds (Equity)", "Index Funds", etc.
  goalName?: string; // e.g., "Retirement Fund", "Child Higher Education", "Emergency Corpus", "Wealth Generation"
  notes?: string;
  status: 'active' | 'completed' | 'paused';
  createdAt?: string;
  addedByMember?: string;
  paymentHistory?: string[]; // Array of YYYY-MM months when SIP was logged
  stepUpPercentage?: number; // Optional annual step-up increment percentage (e.g. 10%)
}

export interface DebtRecord {
  id: string;
  title: string; // e.g. "Personal Loan from Ramesh Uncle", "Hand loan for shop repair"
  type: 'borrowed' | 'given'; // 'borrowed' = Money I/Family Owe, 'given' = Money Owed to Us
  personName: string; // Person, lender, borrower or bank name
  totalAmount: number; // Initial debt/loan amount in ₹
  remainingAmount: number; // Current unpaid balance in ₹
  paidBy: FamilyMember; // Responsible family member
  startDate?: string; // YYYY-MM-DD
  time?: string; // HH:mm time format when borrowed/lent
  dueDate?: string; // YYYY-MM-DD target payoff date
  dueTime?: string; // HH:mm target payoff time
  notes?: string;
  status: 'active' | 'settled';
  createdAt?: string;
  addedByMember?: string;
}




