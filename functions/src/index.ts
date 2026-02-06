/**
 * BABALARIN GÜNAHLARI (THE SINS OF THE FATHERS)
 * Backend Core v2.0 (Modular Refactor)
 */

import { verifyTurnstileToken } from "./handlers/auth";
import { onNewSubscriber } from "./handlers/subscribers";
import { askTheNovel } from "./handlers/silvio";

export {
  verifyTurnstileToken,
  onNewSubscriber,
  askTheNovel,
};