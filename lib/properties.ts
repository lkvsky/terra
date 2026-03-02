export interface Property {
  id: string;
  name: string;
  description: string;
  location: string;
  imageUrl: string;
}

export const PROPERTIES: Property[] = [
  {
    id: "beach_house",
    name: "Padaro",
    description:
      "Oceanfront property with direct beach access and panoramic ocean views throughout.",
    location: "Carpinteria, CA",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
  },
  {
    id: "desert_house",
    name: "Las Palmas",
    description:
      "A modern desert oasis with a heated pool, outdoor kitchen, stargazing deck, and sweeping mountain.",
    location: "Palm Springs, CA",
    imageUrl:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
  }
];
