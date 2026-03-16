// @ts-ignore
import monkeyImg from "../../assets/2d97176b4315ac24d52cbfeff2724e17a34f84ad.png";
// @ts-ignore
import koalaImg from "../../assets/avatar-koala.png";
// @ts-ignore
import rhinoImg from "../../assets/avatar-rhino.png";
// @ts-ignore
import elephantImg from "../../assets/avatar-elephant.png";
// @ts-ignore
import slothImg from "../../assets/avatar-sloth.png";
// @ts-ignore
import pandaImg from "../../assets/avatar-panda.png";

// To add a new avatar:
// 1. Add its PNG to src/assets/
// 2. Import it above
// 3. Add an entry to AVATAR_OPTIONS below
// 4. Add the id to VALID_AVATARS in src/supabase/functions/server/vine-api.tsx
const AVATAR_OPTIONS_CONST = [
  { id: "monkey", label: "Monkey", img: monkeyImg },
  { id: "koala", label: "Koala", img: koalaImg },
  { id: "rhino", label: "Rhino", img: rhinoImg },
  { id: "elephant", label: "Elephant", img: elephantImg },
  { id: "sloth", label: "Sloth", img: slothImg },
  { id: "panda", label: "Panda", img: pandaImg },
] as const;

export type AvatarAnimal = (typeof AVATAR_OPTIONS_CONST)[number]["id"];

export const DEFAULT_AVATAR: AvatarAnimal = "monkey";

export const AVATAR_OPTIONS: { id: AvatarAnimal; label: string; img: string }[] = [...AVATAR_OPTIONS_CONST];

export const VALID_AVATAR_IDS: string[] = AVATAR_OPTIONS.map((a) => a.id);

export const getAvatarImage = (animal: AvatarAnimal | undefined): string => {
  const option = AVATAR_OPTIONS.find((a) => a.id === animal);
  return option?.img ?? monkeyImg;
};
