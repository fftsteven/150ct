// Server-side app registry. Add a new app here (plus its folder in apps/ and public/apps/).
//
// Each app module exports:
//   type                       string id, also the URL segment (/potluck/<slug>)
//   clean(input, prevData)     -> [data, error]   validate the host's create/edit form
//   eventDate(data)            -> "YYYY-MM-DD"    drives expiry
//   respond(data, id, input, allResponses)
//                              -> { row | null, conflict?, error? }   one guest's response
//   view(row, {host, data, mine}) -> what this viewer may see of a response
// Optional:
//   private                    true: responder ids hidden from the host too
//   publicData(data, {me, all, host}) -> what the page gets as link.data
//   responderFor(all, k)       -> responder id the host's DELETE ?k= removes
import potluck from "./potluck/server.js";
import meet from "./meet/server.js";
import gift from "./gift/server.js";
import registry from "./registry/server.js";
import squares from "./squares/server.js";

export const APPS = { potluck, meet, gift, registry, squares };
