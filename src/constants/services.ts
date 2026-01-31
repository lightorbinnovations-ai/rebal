import {
    Home,
    Map,
    Key,
    Briefcase,
    Building,
    Hammer,
    Building2,
    LineChart,
    TrendingUp,
    Scale
} from "lucide-react";

export interface ServiceDefinition {
    id: string;
    title: string;
    description: string;
    iconName: string; // For reference
    icon: React.ElementType;
}

export const PREDEFINED_SERVICES: ServiceDefinition[] = [
    {
        id: "property_sales",
        title: "Property Sales (Houses)",
        description: "Expert guidance in buying and selling residential properties. We facilitate seamless transactions for houses, apartments, and duplexes, ensuring you get the best value.",
        iconName: "Home",
        icon: Home
    },
    {
        id: "land_sales",
        title: "Land Sales",
        description: "Verified land listings in prime locations. We help you secure secure title deeds and authentic plots for personal or investment purposes.",
        iconName: "Map",
        icon: Map
    },
    {
        id: "property_rentals",
        title: "Property Rentals",
        description: "Connecting tenants with quality homes and landlords with reliable occupants. We streamline the rental process for hassle-free leasing.",
        iconName: "Key",
        icon: Key
    },
    {
        id: "consulting",
        title: "Real Estate Consulting",
        description: "Professional advice on market trends, property acquisition, and portfolio management. We provide clarity for your real estate decisions.",
        iconName: "Briefcase",
        icon: Briefcase
    },
    {
        id: "property_management",
        title: "Property Management",
        description: "Comprehensive management solutions for your real estate assets. From maintenance to tenant relations, we handle the details so you enjoy the returns.",
        iconName: "Building",
        icon: Building
    },
    {
        id: "development",
        title: "Estate Development",
        description: "End-to-end development services for residential and commercial projects. We bring architectural visions to life with quality construction.",
        iconName: "Hammer",
        icon: Hammer
    },
    {
        id: "commercial",
        title: "Commercial Real Estate",
        description: "Strategic solutions for office spaces, retail outlets, and industrial properties. We help businesses find the perfect location to thrive.",
        iconName: "Building2",
        icon: Building2
    },
    {
        id: "valuation",
        title: "Property Valuation",
        description: "Accurate and market-driven property appraisals. We provide detailed valuation reports for sales, taxation, or banking purposes.",
        iconName: "Scale",
        icon: Scale
    },
    {
        id: "investment",
        title: "Investment Advisory",
        description: "Data-driven strategies for high-yield real estate investments. We identify lucrative opportunities to maximize your ROI.",
        iconName: "TrendingUp",
        icon: TrendingUp
    }
];
