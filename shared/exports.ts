import * as interfaces from "./interfaces/interfaces.ts";
import canBotModifyNickname from "./utils/canBotModifyNickname.ts";
import cleanHexCode from "./utils/cleanHexCode.ts";
// import * as supabase from "./utils/supabase.ts";
import getSteamid64 from "./utils/getSteamID64.ts";
import executeWithTimeout from "./utils/executeWithTimeout.ts";
import getNameColor from "./utils/getNameColor.ts";
import * as supabase from "./utils/supabase.ts";

export {
  canBotModifyNickname,
  cleanHexCode,
  // supabase,
  executeWithTimeout,
  getNameColor,
  getSteamid64,
  interfaces,
  supabase,
};
