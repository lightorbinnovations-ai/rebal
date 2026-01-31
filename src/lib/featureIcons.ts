import {
  Bed,
  Bath,
  Car,
  Droplets,
  Zap,
  Wifi,
  ShieldCheck,
  Trees,
  Dumbbell,
  Waves,
  Wind,
  Refrigerator,
  Tv,
  Fence,
  Building,
  Home,
  Warehouse,
  Flame,
  Sun,
  Thermometer,
  ParkingCircle,
  LampDesk,
  Sofa,
  Utensils,
  WashingMachine,
  DoorOpen,
  KeyRound,
  Eye,
  Phone,
  Accessibility,
  Dog,
  Baby,
  Store,
  School,
  Church,
  Hospital,
  Mountain,
  Sparkles,
  Check,
  ArrowUp,
  type LucideIcon,
} from "lucide-react";

// Map common feature keywords to icons
const featureIconMap: Record<string, LucideIcon> = {
  // Bedrooms
  bed: Bed,
  bedroom: Bed,
  room: Bed,
  master: Bed,
  
  // Bathrooms
  bath: Bath,
  bathroom: Bath,
  toilet: Bath,
  shower: Bath,
  ensuite: Bath,
  
  // Parking
  parking: Car,
  garage: Car,
  car: Car,
  carport: ParkingCircle,
  
  // Water
  water: Droplets,
  borehole: Droplets,
  well: Droplets,
  tank: Droplets,
  
  // Electricity
  electric: Zap,
  electricity: Zap,
  power: Zap,
  generator: Zap,
  solar: Sun,
  inverter: Zap,
  
  // Internet
  wifi: Wifi,
  internet: Wifi,
  fiber: Wifi,
  
  // Security
  security: ShieldCheck,
  guard: ShieldCheck,
  gated: ShieldCheck,
  cctv: ShieldCheck,
  camera: ShieldCheck,
  alarm: ShieldCheck,
  fence: Fence,
  wall: Fence,
  
  // Garden & Outdoor
  garden: Trees,
  yard: Trees,
  lawn: Trees,
  green: Trees,
  outdoor: Trees,
  balcony: DoorOpen,
  terrace: DoorOpen,
  patio: DoorOpen,
  view: Eye,
  mountain: Mountain,
  
  // Fitness & Pool
  gym: Dumbbell,
  fitness: Dumbbell,
  pool: Waves,
  swimming: Waves,
  
  // Climate Control
  ac: Wind,
  air: Wind,
  conditioning: Wind,
  cooler: Wind,
  heater: Thermometer,
  heating: Thermometer,
  fireplace: Flame,
  
  // Appliances
  fridge: Refrigerator,
  refrigerator: Refrigerator,
  freezer: Refrigerator,
  tv: Tv,
  television: Tv,
  washer: WashingMachine,
  washing: WashingMachine,
  dryer: WashingMachine,
  
  // Furniture
  furnished: Sofa,
  furniture: Sofa,
  sofa: Sofa,
  desk: LampDesk,
  
  // Kitchen
  kitchen: Utensils,
  cooking: Utensils,
  stove: Flame,
  
  // Building Features
  elevator: ArrowUp,
  lift: ArrowUp,
  accessible: Accessibility,
  wheelchair: Accessibility,
  floor: Building,
  story: Building,
  storey: Building,
  
  // Pet & Family
  pet: Dog,
  dog: Dog,
  kid: Baby,
  child: Baby,
  family: Baby,
  playground: Baby,
  
  // Nearby Amenities
  shop: Store,
  store: Store,
  market: Store,
  mall: Store,
  school: School,
  church: Church,
  mosque: Church,
  hospital: Hospital,
  clinic: Hospital,
  
  // Property Types
  duplex: Home,
  flat: Building,
  apartment: Building,
  warehouse: Warehouse,
  
  // Misc
  new: Sparkles,
  modern: Sparkles,
  luxury: Sparkles,
  smart: KeyRound,
  intercom: Phone,
};

export function getFeatureIcon(feature: string): LucideIcon {
  const lowerFeature = feature.toLowerCase();
  
  // Check each keyword against the feature text
  for (const [keyword, icon] of Object.entries(featureIconMap)) {
    if (lowerFeature.includes(keyword)) {
      return icon;
    }
  }
  
  // Default to checkmark if no match found
  return Check;
}

// Extract quantity from feature text (e.g., "3 Bedrooms" -> 3)
export function extractQuantity(feature: string): number | null {
  const match = feature.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}
