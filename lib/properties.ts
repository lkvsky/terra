export interface Property {
  id: string;
  name: string;
  description: string;
  location: string;
  imageUrl: string;
}

export const PROPERTIES: Property[] = [
  {
    id: "desert_house",
    name: "Las Palmas",
    description:
      "A modern desert oasis with a heated pool, outdoor kitchen, stargazing deck, and sweeping mountain.",
    location: "Palm Springs, CA",
    imageUrl:
      "/cactus.png",
  },
  {
    id: "beach_house",
    name: "Padaro",
    description:
      "Oceanfront property with direct beach access and panoramic ocean views throughout.",
    location: "Carpinteria, CA",
    imageUrl:
      "/dolphin.png",
  }
];
