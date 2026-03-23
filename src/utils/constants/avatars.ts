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

// See CN-7 for how to add new avatars
export type AvatarAnimal = "monkey" | "koala" | "rhino" | "elephant" | "sloth" | "panda";

export const AVATAR_OPTIONS: {
  value: AvatarAnimal;
  label: string;
  img: string;
}[] = [
  { value: "monkey", label: "Monkey", img: monkeyImg },
  { value: "koala", label: "Koala", img: koalaImg },
  { value: "rhino", label: "Rhino", img: rhinoImg },
  { value: "elephant", label: "Elephant", img: elephantImg },
  { value: "sloth", label: "Sloth", img: slothImg },
  { value: "panda", label: "Panda", img: pandaImg },
];

export const DEFAULT_AVATAR: AvatarAnimal = "monkey";

export const getAvatarImage = (
  animal: AvatarAnimal | undefined,
): string => {
  if (!animal) {
    return monkeyImg;
  }

  const option = AVATAR_OPTIONS.find((a) => a.value === animal);
  if (!option) {
    console.error(`Invalid avatar animal: ${animal}, defaulting to monkey`);
    return monkeyImg;
  } else {
    return option.img;
  }
};
