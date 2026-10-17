import {
  initializeBooking,
  updateModelRequirement,
} from "./booking";
import { initializeGallery } from "./gallery";
import { initializePhotoGate } from "./photo-gate";
import { initializeSiteUi } from "./site-ui";

initializeSiteUi();
initializePhotoGate();
const gallery = initializeGallery(updateModelRequirement);
initializeBooking(gallery);
