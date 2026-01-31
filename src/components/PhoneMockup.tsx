import { useState, useEffect } from "react";
import { CheckCheck } from "lucide-react";
import propertyImage1 from "@/assets/default-hero-1.webp";
import propertyImage2 from "@/assets/default-hero-2.webp";
import propertyImage3 from "@/assets/default-hero-3.webp";
import propertyImage4 from "@/assets/default-hero-4.webp";
import propertyImage5 from "@/assets/default-hero-5.webp";
import propertyImage6 from "@/assets/default-hero-6.webp";

const properties = [
  {
    image: propertyImage1,
    price: "₦45M",
    title: "3 Bedroom Duplex in Lekki Phase 1",
    description: "Luxury duplex with modern finishes, 24/7 power, swimming pool access...",
  },
  {
    image: propertyImage2,
    price: "₦95M",
    title: "4 Bedroom Terrace in Banana Island",
    description: "Waterfront terrace with private jetty, smart home features, 4 en-suite...",
  },
  {
    image: propertyImage3,
    price: "₦28M",
    title: "2 Bedroom Apartment in Victoria Island",
    description: "Modern serviced apartment with gym, pool, 24/7 security, ocean view...",
  },
  {
    image: propertyImage4,
    price: "₦180M",
    title: "5 Bedroom Mansion in Maitama",
    description: "Sprawling estate on 2000sqm, cinema room, tennis court, staff quarters...",
  },
  {
    image: propertyImage5,
    price: "₦15M",
    title: "Studio Apartment in Ikeja GRA",
    description: "Cozy studio perfect for young professionals, fully furnished, secure...",
  },
  {
    image: propertyImage6,
    price: "₦320M",
    title: "Commercial Plaza in Wuse 2",
    description: "Prime commercial building, 12 office suites, parking for 50 cars...",
  },
];

export const PhoneMockup = () => {
  const [step, setStep] = useState(0);
  const [propertyIndex, setPropertyIndex] = useState(0);

  const currentProperty = properties[propertyIndex];

  useEffect(() => {
    const steps = [0, 1, 2, 3, 4];
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % steps.length;
      setStep(steps[currentIndex]);
      
      // Change property when animation resets to beginning
      if (currentIndex === 0) {
        setPropertyIndex((prev) => (prev + 1) % properties.length);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative mx-auto w-[160px] xs:w-[180px] sm:w-[220px] md:w-[260px] lg:w-[280px]">
      {/* Phone Frame */}
      <div className="relative bg-gray-900 rounded-[2rem] sm:rounded-[2.5rem] p-1 sm:p-1.5 shadow-2xl">
        {/* Phone Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 sm:w-24 h-4 sm:h-5 bg-gray-900 rounded-b-xl z-20" />
        
        {/* Phone Screen */}
        <div className="relative bg-[#0b141a] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden">
          {/* WhatsApp Header */}
          <div className="bg-[#1f2c34] px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 pt-4 sm:pt-6">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white font-bold text-[10px] sm:text-xs">
              JD
            </div>
            <div className="flex-1">
              <p className="text-white text-[10px] sm:text-xs font-medium">John Doe</p>
              <p className="text-[#8696a0] text-[8px] sm:text-[10px]">online</p>
            </div>
          </div>

          {/* Chat Area */}
          <div className="h-[200px] xs:h-[220px] sm:h-[280px] md:h-[320px] lg:h-[360px] p-1.5 sm:p-2 space-y-1.5 sm:space-y-2 overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblRyYW5zZm9ybT0icm90YXRlKDQ1KSI+PHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNhKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')]">
            
            {/* Incoming Message */}
            <div 
              className={`transition-all duration-500 ${
                step >= 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="bg-[#1f2c34] rounded-lg rounded-tl-none p-1 sm:p-1.5 max-w-[85%] shadow-sm">
                <p className="text-[#e9edef] text-[8px] sm:text-[10px] leading-tight">
                  Hey! Do you have any 3-bedroom apartments available in Lekki? 🏠
                </p>
                <div className="flex justify-end mt-0.5">
                  <span className="text-[#8696a0] text-[6px] sm:text-[8px]">10:30 AM</span>
                </div>
              </div>
            </div>

            {/* Typing Indicator */}
            <div 
              className={`flex justify-end transition-all duration-300 ${
                step === 1 ? "opacity-100" : "opacity-0 h-0"
              }`}
            >
              <div className="bg-[#005c4b] rounded-lg rounded-tr-none p-1 sm:p-1.5 px-2 sm:px-3 shadow-sm">
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#8696a0] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#8696a0] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#8696a0] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>

            {/* Reply Message */}
            <div 
              className={`flex justify-end transition-all duration-500 ${
                step >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="bg-[#005c4b] rounded-lg rounded-tr-none p-1 sm:p-1.5 max-w-[85%] shadow-sm">
                <p className="text-[#e9edef] text-[8px] sm:text-[10px] leading-tight">
                  Yes! Check out this beautiful property 👇
                </p>
                <div className="flex items-center justify-end gap-0.5 mt-0.5">
                  <span className="text-[#8696a0] text-[6px] sm:text-[8px]">10:31 AM</span>
                  <CheckCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#53bdeb]" />
                </div>
              </div>
            </div>

            {/* Link Preview Message */}
            <div 
              className={`flex justify-end transition-all duration-700 ${
                step >= 3 ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
              }`}
            >
              <div className="bg-[#005c4b] rounded-lg rounded-tr-none overflow-hidden max-w-[90%] shadow-lg">
                {/* Link Preview Card */}
                <div className="bg-[#1a3a32] p-0">
                  {/* Preview Image */}
                  <div className="relative h-14 sm:h-20 md:h-24 overflow-hidden">
                    <img 
                      src={currentProperty.image} 
                      alt="Property preview" 
                      className="w-full h-full object-cover transition-opacity duration-500"
                    />
                    {/* Price Tag */}
                    <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 bg-secondary text-secondary-foreground text-[7px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full shadow-lg">
                      {currentProperty.price}
                    </div>
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                  
                  {/* Preview Details */}
                  <div className="p-1.5 sm:p-2 space-y-0.5">
                    <p className="text-[#00a884] text-[7px] sm:text-[9px] font-medium">rebal.ng</p>
                    <p className="text-[#e9edef] text-[8px] sm:text-[10px] font-medium leading-tight line-clamp-1">
                      {currentProperty.title}
                    </p>
                    <p className="text-[#8696a0] text-[7px] sm:text-[9px] line-clamp-1">
                      {currentProperty.description}
                    </p>
                  </div>
                </div>
                
                {/* Message Footer */}
                <div className="p-1 sm:p-1.5 pt-0">
                  <div className="flex items-center justify-end gap-0.5">
                    <span className="text-[#8696a0] text-[6px] sm:text-[8px]">10:31 AM</span>
                    <CheckCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#53bdeb]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Reaction */}
            <div 
              className={`transition-all duration-500 ${
                step >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="bg-[#1f2c34] rounded-lg rounded-tl-none p-1 sm:p-1.5 max-w-[85%] shadow-sm">
                <p className="text-[#e9edef] text-[8px] sm:text-[10px] leading-tight">
                  Wow this looks amazing! 😍 Can I schedule a viewing?
                </p>
                <div className="flex justify-end mt-0.5">
                  <span className="text-[#8696a0] text-[6px] sm:text-[8px]">10:32 AM</span>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Input Area */}
          <div className="bg-[#1f2c34] px-1.5 sm:px-2 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-1.5">
            <div className="flex-1 bg-[#2a3942] rounded-full px-2 sm:px-3 py-1 sm:py-1.5">
              <p className="text-[#8696a0] text-[8px] sm:text-[10px]">Type a message</p>
            </div>
            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-[#00a884] flex items-center justify-center">
              <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5.67-1.5 1.5V10c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V7c0-.83-.67-1.5-1.5-1.5z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Glow Effect */}
      <div className="absolute -inset-3 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-[3rem] blur-xl -z-10 opacity-60" />
    </div>
  );
};
