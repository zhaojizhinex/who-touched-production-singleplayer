import { RoleId } from "./types";
import frontendRoleArt from "./assets/art/role-frontend-v2.png";
import backendRoleArt from "./assets/art/role-backend-v2.png";
import qaRoleArt from "./assets/art/role-qa-v2.png";
import pmRoleArt from "./assets/art/role-pm-v2.png";
import internRoleArt from "./assets/art/role-intern-v2.png";
import officeMapArt from "./assets/art/map-office-topdown.png";
import officeMapShowcaseArt from "./assets/art/map-office-labeled-showcase.png";

export const ROLE_ART: Record<RoleId, string> = {
  frontend: frontendRoleArt,
  backend: backendRoleArt,
  qa: qaRoleArt,
  pm: pmRoleArt,
  intern: internRoleArt,
};

export const ROLE_BADGE: Record<RoleId, string> = {
  frontend: "UI",
  backend: "API",
  qa: "BUG",
  pm: "PM",
  intern: "NEW",
};

export const ROLE_THEME: Record<RoleId, string> = {
  frontend: "role-frontend",
  backend: "role-backend",
  qa: "role-qa",
  pm: "role-pm",
  intern: "role-intern",
};

export { officeMapArt, officeMapShowcaseArt };
