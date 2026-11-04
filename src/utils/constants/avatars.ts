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
// @ts-ignore
import monkeyThumbnailImg from "../../assets/avatar-monkey-thumbnail.png";
// @ts-ignore
import koalaThumbnailImg from "../../assets/avatar-koala-thumbnail.png";
// @ts-ignore
import rhinoThumbnailImg from "../../assets/avatar-rhino-thumbnail.png";
// @ts-ignore
import elephantThumbnailImg from "../../assets/avatar-elephant-thumbnail.png";
// @ts-ignore
import slothThumbnailImg from "../../assets/avatar-sloth-thumbnail.png";
// @ts-ignore
import pandaThumbnailImg from "../../assets/avatar-panda-thumbnail.png";

// See CN-7 for how to add new avatars
export type AvatarAnimal = "monkey" | "koala" | "rhino" | "elephant" | "sloth" | "panda";

export const AVATAR_OPTIONS: {
  value: AvatarAnimal;
  label: string;
  img: string;
  thumbnailImg: string;
  emoji: string;
}[] = [
  { value: "monkey", label: "Monkey", img: monkeyImg, thumbnailImg: monkeyThumbnailImg, emoji: "🐒" },
  { value: "koala", label: "Koala", img: koalaImg, thumbnailImg: koalaThumbnailImg, emoji: "🐨" },
  { value: "rhino", label: "Rhino", img: rhinoImg, thumbnailImg: rhinoThumbnailImg, emoji: "🦏" },
  { value: "elephant", label: "Elephant", img: elephantImg, thumbnailImg: elephantThumbnailImg, emoji: "🐘" },
  { value: "sloth", label: "Sloth", img: slothImg, thumbnailImg: slothThumbnailImg, emoji: "🦥" },
  { value: "panda", label: "Panda", img: pandaImg, thumbnailImg: pandaThumbnailImg, emoji: "🐼" },
];

export const AVATAR_EMOJIS = Object.fromEntries(
  AVATAR_OPTIONS.map((a) => [a.value, a.emoji]),
)

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
