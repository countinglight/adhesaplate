import { site } from "./site.config";

export const apart = [
  {
    icon: "badge",
    title: "Our Specialty",
    text: "Adhesa Plate specializes in the manufacturing and supplying of quality custom labels, product markings, graphic overlays, membrane switches, insulators and shields since 1954. Our products are UL 969 tested and approved, and our internal quality system is based on ISO 9001.",
  },
  {
    icon: "shield",
    title: "Quality",
    text: "In search of machinery and equipment labels designed to meet the demanding performance requirements of industrial equipment? Adhesa Plate can help you find the right solution to your unique industrial equipment label application.",
  },
  {
    icon: "layers",
    title: "Durability",
    text: "Whether you are looking for a UL approved warning label, or a durable graphic overlay for your device, Adhesa Plate can help you build the perfect label to suit your unique application.",
  },
  {
    icon: "puzzle",
    title: "Problem Solving",
    text: "From medical equipment graphic overlays to laboratory labels, Adhesa Plate can help you find the right solution to your demanding medical label application.",
  },
] as const;

export const understand = [
  { icon: "chat", title: "Needs", text: "Where the label lives, what it has to survive and what it has to say." },
  { icon: "layers", title: "Materials", text: "The film, adhesive and finish that suit the surface and the environment." },
  { icon: "pen", title: "Design", text: "Artwork, color and construction that identify your product." },
] as const;

export const stats = [
  { value: String(site.founded), label: "Serving manufacturers since" },
  { value: "8,500+", label: "Projects completed" },
  { value: "1,200+", label: "Happy clients" },
  { value: "UL 969", label: "Tested and approved" },
];

// The legacy home page's "Our products & services" set, in its order.
export const featured = [
  { title: "Membrane Switches", path: "/products/membrane-switches/", image: "embossed_membrane_switches.jpg", summary: "Graphic overlays in polycarbonate or polyester thin film combined with membrane circuitry. Seals a device from the front, with colorful graphics, display windows and embossed keypads." },
  { title: "Warning Labels", path: "/products/warning-labels/", image: "ul_labels.jpg", summary: "Custom warning and caution labels certified under UL 969 and made to the ANSI standards for safety signs and labels." },
  { title: "Industrial Equipment Labels", path: "/industries/industrial-equipment-mfg/", image: "metallic_ul_label.jpg", summary: "Aluminum foil, polycarbonate, polyester and vinyl, tested and certified under UL 969 for durability, in custom shapes and sizes." },
  { title: "Agency & FCC Labels", path: "/products/agency-fcc-labels/", image: "imprintable_ul_labels.jpg", summary: "UL 969 certified for indoor and outdoor use and tested to the Canadian cUL standard. RoHS compliant." },
  { title: "Graphic Overlays", path: "/products/graphic-overlays/", image: "custom_graphic_overlay.jpg", summary: "Durable polycarbonate and polyester overlays with deadfront and LED display windows, selective texture and embossing." },
  { title: "Custom Application", path: "/products/custom-application/", image: "custom-application-adhesive-labels.jpg", summary: "Direct printing on metal cases, multi-layered acrylic templates, plastic event tickets and other unique work, with fast turnaround and low set up cost." },
  { title: "Serializing & Barcoding", path: "/capabilities/serializing-barcoding/", image: "barcode-asset-labels-2.jpg", summary: "Sequential, human and machine readable numbers, static and sequential barcodes, QR or UID codes on a variety of label materials." },
  { title: "Electronic Device Labels", path: "/industries/electronic-device-mfg/", image: "custom_shape_die_cut_labels.jpg", summary: "RoHS compliant labels certified under UL 969 for indoor and outdoor use, with an LSE adhesive option for powder coated surfaces." },
  { title: "Dome Labels", path: "/products/dome-labels/", image: "custom_dome_labels.jpg", summary: "A .060” clear, non-yellowing urethane dome adds a high end 3-D look, is outdoor durable and can self-repair dents." },
  { title: "Medical Device Labels", path: "/industries/medical-device-mfg/", image: "equipment_labels.jpg", summary: "From medical equipment graphic overlays to laboratory labels. Most are UL 969 certified; all are RoHS compliant." },
  { title: "Materials", path: "/materials/", icon: "layers", summary: "Aluminum foil, polycarbonate, polyester and vinyl: four main materials tested and certified under UL 969 for durability." },
  { title: "Full Service Art Department", path: "/capabilities/full-service-art-dept/", icon: "pen", summary: "Designers on staff can help create a label that will “identify your product”." },
];
