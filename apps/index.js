// Server-side app registry. Add a new app here (plus its folder in apps/ and public/apps/).
//
// Each app module exports:
//   type                       string id, also the URL segment (/potluck/<slug>)
//   clean(input, prevData)     -> [data, error]   validate the host's create/edit form
//   eventDate(data)            -> "YYYY-MM-DD"    drives expiry
//   respond(data, id, input, allResponses)
//                              -> { row | null, conflict?, error? }   one guest's response
//   view(row)                  -> what other guests may see of a response
import potluck from "./potluck/server.js";
import eat from "./eat/server.js";

export const APPS = { potluck, eat };
