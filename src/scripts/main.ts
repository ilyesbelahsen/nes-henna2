import {
  initializeBooking,
  updateModelRequirement,
} from "./booking";
import { initializeGallery } from "./gallery";
import { initializeSiteUi } from "./site-ui";

initializeSiteUi();
const gallery = initializeGallery(updateModelRequirement);
initializeBooking(gallery);
