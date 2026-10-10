// Human cartoon avatars (25 male, 25 female). The server stores only the id
// ("face-m03") in AvatarIcon and the background in AvatarColor, so other users
// see the same face and old saved Ionicon presets keep rendering as icons.
import FACES from "./avatarFaces";

const FACE_BY_ID = Object.fromEntries(FACES.map((face) => [face.id, face]));

export const getFaceSvg = (icon) => (icon ? FACE_BY_ID[icon]?.svg || null : null);

// Same {id, icon, color} shape the picker and AuthContext already use.
export const AVATAR_ICONS = FACES.map((face) => ({
  id: face.id,
  icon: face.id,
  color: face.background,
  gender: face.gender,
}));

export default AVATAR_ICONS;
