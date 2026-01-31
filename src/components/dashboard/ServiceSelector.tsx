import { PREDEFINED_SERVICES } from "@/constants/services";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface ServiceSelectorProps {
    selectedServices: string[];
    onChange: (services: string[]) => void;
    disabled?: boolean;
}

export const ServiceSelector = ({
    selectedServices,
    onChange,
    disabled = false,
}: ServiceSelectorProps) => {
    const toggleService = (serviceId: string) => {
        if (disabled) return;

        if (selectedServices.includes(serviceId)) {
            onChange(selectedServices.filter((id) => id !== serviceId));
        } else {
            onChange([...selectedServices, serviceId]);
        }
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PREDEFINED_SERVICES.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                const Icon = service.icon;

                return (
                    <Card
                        key={service.id}
                        className={cn(
                            "relative cursor-pointer transition-all duration-200 hover:shadow-md border-2",
                            isSelected
                                ? "border-primary bg-primary/5 shadow-md"
                                : "border-border hover:border-primary/30 hover:bg-muted/50",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => toggleService(service.id)}
                    >
                        <div className="p-4 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-3">
                                <div className={cn(
                                    "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                {isSelected && (
                                    <CheckCircle2 className="h-5 w-5 text-primary animate-in zoom-in duration-300" />
                                )}
                            </div>

                            <h4 className={cn(
                                "font-semibold mb-1",
                                isSelected ? "text-primary" : "text-foreground"
                            )}>
                                {service.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-3">
                                {service.description}
                            </p>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
};
