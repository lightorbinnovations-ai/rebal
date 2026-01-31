// Nigerian states and major cities for location-first search
export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", 
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", 
  "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", 
  "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", 
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
] as const;

export type NigerianState = typeof NIGERIAN_STATES[number];

export interface LocationData {
  state: string;
  city: string;
  areas: string[];
}

// Major cities and areas by state
export const LOCATION_DATA: Record<string, { cities: Record<string, string[]> }> = {
  Lagos: {
    cities: {
      "Lagos Island": [
        "Victoria Island", "Ikoyi", "Lekki Phase 1", "Lekki Phase 2", 
        "Ajah", "Banana Island", "Eko Atlantic"
      ],
      "Lagos Mainland": [
        "Yaba", "Surulere", "Ikeja", "Maryland", "Gbagada", 
        "Magodo", "Ojodu", "Ogba", "Agege", "Mushin"
      ],
      "Ikorodu": ["Ikorodu", "Agric"],
      "Epe": ["Epe", "Lekki Free Trade Zone"],
      "Badagry": ["Badagry", "Ajara"],
    }
  },
  FCT: {
    cities: {
      "Abuja": [
        "Maitama", "Asokoro", "Wuse", "Wuse 2", "Garki", 
        "Gwarinpa", "Jabi", "Lugbe", "Kubwa", "Lokogoma",
        "Jahi", "Katampe", "Life Camp", "Utako", "Gudu"
      ],
      "Gwagwalada": ["Gwagwalada"],
      "Kuje": ["Kuje"],
      "Bwari": ["Bwari", "Dutse"],
    }
  },
  Rivers: {
    cities: {
      "Port Harcourt": [
        "GRA Phase 1", "GRA Phase 2", "Trans Amadi", "Rumuokwuta",
        "Old GRA", "Woji", "Rumuola", "Elekahia"
      ],
      "Obio-Akpor": ["Rumuigbo", "Rumuodomaya"],
    }
  },
  Oyo: {
    cities: {
      "Ibadan": [
        "Bodija", "Ring Road", "Oluyole", "Dugbe", "Challenge",
        "Jericho", "Agodi", "Mokola"
      ],
    }
  },
  Enugu: {
    cities: {
      "Enugu": [
        "Independence Layout", "GRA", "Trans Ekulu", "New Haven",
        "Ogui", "Coal Camp"
      ],
    }
  },
  Kaduna: {
    cities: {
      "Kaduna": [
        "Barnawa", "Malali", "Ungwan Rimi", "Sabon Tasha",
        "Narayi", "Television"
      ],
    }
  },
  Kano: {
    cities: {
      "Kano": [
        "Nassarawa", "Sabon Gari", "Bompai", "Farm Centre"
      ],
    }
  },
  Delta: {
    cities: {
      "Warri": ["GRA", "Effurun", "Uvwie"],
      "Asaba": ["GRA", "Okpanam", "Cable Point"],
    }
  },
  Edo: {
    cities: {
      "Benin City": [
        "GRA", "Ring Road", "Ugbowo", "Uselu", "Sapele Road"
      ],
    }
  },
  Anambra: {
    cities: {
      "Onitsha": ["GRA", "Fegge", "Woliwo"],
      "Awka": ["Amawbia", "Ifite"],
    }
  },
  "Cross River": {
    cities: {
      "Calabar": ["State Housing", "Marian", "Satellite Town"],
    }
  },
  "Akwa Ibom": {
    cities: {
      "Uyo": ["Ewet Housing", "Shelter Afrique", "Four Towns"],
    }
  },
  Ondo: {
    cities: {
      "Akure": ["Alagbaka", "Futa", "Oba Ile"],
    }
  },
  Osun: {
    cities: {
      "Osogbo": ["GRA", "Oke Fia", "Ring Road"],
    }
  },
  Kwara: {
    cities: {
      "Ilorin": ["GRA", "Tanke", "Fate"],
    }
  },
  Plateau: {
    cities: {
      "Jos": ["Rayfield", "State Lowcost", "Tudun Wada"],
    }
  },
};

// Helper functions
export function getStates(): string[] {
  return [...NIGERIAN_STATES];
}

export function getCities(state: string): string[] {
  return Object.keys(LOCATION_DATA[state]?.cities || {});
}

export function getAreas(state: string, city: string): string[] {
  return LOCATION_DATA[state]?.cities?.[city] || [];
}

// Price ranges for filtering (in Naira)
export const PRICE_RANGES = [
  { label: "Under ₦5M", min: 0, max: 5000000 },
  { label: "₦5M - ₦10M", min: 5000000, max: 10000000 },
  { label: "₦10M - ₦25M", min: 10000000, max: 25000000 },
  { label: "₦25M - ₦50M", min: 25000000, max: 50000000 },
  { label: "₦50M - ₦100M", min: 50000000, max: 100000000 },
  { label: "₦100M - ₦250M", min: 100000000, max: 250000000 },
  { label: "₦250M - ₦500M", min: 250000000, max: 500000000 },
  { label: "Above ₦500M", min: 500000000, max: Infinity },
];

// Property types
export const PROPERTY_TYPES = [
  "Detached Duplex",
  "Semi-Detached Duplex",
  "Terrace",
  "Bungalow",
  "Flat / Apartment",
  "Penthouse",
  "Land",
  "Commercial Property",
  "Office Space",
  "Warehouse",
  "Shop",
];

// Property purposes
export const PROPERTY_PURPOSES = [
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
  { value: "shortlet", label: "Short Let" },
];
