export type Photo = { src: string; width: number; height: number; alt: string };

/** Photos shown in the viewer (the side arrows loop through them). Originals live in info/photos/originals. */
export const photos: Photo[] = [
  { src: "/images/photo-1.webp", width: 1350, height: 1800, alt: "Md Maruf Billah smiling, in a white panjabi" },
  { src: "/images/photo-2.jpg", width: 941, height: 1670, alt: "Md Maruf Billah on a beach at sunset, in a white shirt" },
];

/** Face crop of the first photo, used for avatars. */
export const avatarSrc = "/images/avatar.webp";
