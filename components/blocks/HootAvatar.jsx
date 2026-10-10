import React from "react";
import ScolaOwl from "./ScolaOwl";
import PetCharacter from "./PetCharacter";
import { useHootCharacter, useHootGrowth } from "../../utils/hootPet";

// The user's chosen pet at its current growth stage. `character` and `stage`
// override both for previews; `tour` keeps the pointing stick (owl) and cap so
// the guide always looks like a teacher.
const HootAvatar = ({ size = 44, character, stage, tour = false, ...rest }) => {
  const chosen = useHootCharacter();
  const growth = useHootGrowth();
  const kind = character || chosen;
  let level = stage ?? growth.stage;
  if (tour) level = Math.max(level, kind === "owl" ? 3 : 2);
  if (kind === "owl") return <ScolaOwl size={size} stage={level} {...rest} />;
  return <PetCharacter character={kind} size={size} stage={level} {...rest} />;
};

export default HootAvatar;
