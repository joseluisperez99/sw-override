/**
 * Copyright 2019 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

//ESTE ES EL SERVICE WORKER OVERRIDE

console.log("[PUSH SW] Service Worker Override cargado 5");

//LIMPIAR
async function saveReceivedPush(payload) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("bcpPushDebug", 1);

    request.onupgradeneeded = function (event) {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("receivedPushes")) {
        db.createObjectStore("receivedPushes", {
          autoIncrement: true,
        });
      }
    };

    request.onerror = function () {
      reject(request.error);
    };

    request.onsuccess = function () {
      const db = request.result;

      const transaction = db.transaction("receivedPushes", "readwrite");

      const store = transaction.objectStore("receivedPushes");

      // Guardamos exactamente el JSON recibido
      const addRequest = store.add(payload);

      addRequest.onsuccess = function () {
        console.log("[PUSH SW] Payload guardado con ID:", addRequest.result);

        db.close();
        resolve(addRequest.result);
      };

      addRequest.onerror = function () {
        db.close();
        reject(addRequest.error);
      };
    };
  });
}

const e = "config";
var t = async (t) => {
  try {
    const t = await ((n = "alloyPushNotifications"),
      (o = 1),
      (r = (t) => {
        t.objectStoreNames.contains(e) ||
          t.createObjectStore(e, { keyPath: "id" });
      }),
      new Promise((e, t) => {
        const a = indexedDB.open(n, o);
        ((a.onerror = () => t(a.error)),
          (a.onsuccess = () => e(a.result)),
          (a.onupgradeneeded = (e) => {
            const t = e.target.result;
            r && r(t);
          }));
      })),
      a = await ((e, t, n) =>
        new Promise((o, r) => {
          const a = e.transaction([t], "readonly").objectStore(t).get(n);
          ((a.onerror = () => r(a.error)), (a.onsuccess = () => o(a.result)));
        }))(t, e, "alloyConfig");
    return (t.close(), a);
  } catch (e) {
    t.error("Failed to read data from IndexedDB", { error: e });
  }
  var n, o, r;
};
const n = [];
for (let e = 0; e < 256; ++e) n.push((e + 256).toString(16).slice(1));
let o;
const r = new Uint8Array(16);
var a = {
  randomUUID:
    "undefined" != typeof crypto &&
    crypto.randomUUID &&
    crypto.randomUUID.bind(crypto),
};
function i(e, t, a) {
  const i =
    (e = e || {}).random ??
    e.rng?.() ??
    (function () {
      if (!o) {
        if ("undefined" == typeof crypto || !crypto.getRandomValues)
          throw new Error(
            "crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported",
          );
        o = crypto.getRandomValues.bind(crypto);
      }
      return o(r);
    })();
  if (i.length < 16) throw new Error("Random bytes length must be >= 16");
  return (
    (i[6] = (15 & i[6]) | 64),
    (i[8] = (63 & i[8]) | 128),
    (function (e, t = 0) {
      return (
        n[e[t + 0]] +
        n[e[t + 1]] +
        n[e[t + 2]] +
        n[e[t + 3]] +
        "-" +
        n[e[t + 4]] +
        n[e[t + 5]] +
        "-" +
        n[e[t + 6]] +
        n[e[t + 7]] +
        "-" +
        n[e[t + 8]] +
        n[e[t + 9]] +
        "-" +
        n[e[t + 10]] +
        n[e[t + 11]] +
        n[e[t + 12]] +
        n[e[t + 13]] +
        n[e[t + 14]] +
        n[e[t + 15]]
      ).toLowerCase();
    })(i)
  );
}
function c(e, t, n) {
  return a.randomUUID && !e ? a.randomUUID() : i(e);
}
var s = async (
  { xdm: e, actionLabel: n, applicationLaunches: o = 0, title },
  { logger: r, fetch: a },
) => {
  const i = await t(r),
    {
      browser: s,
      ecid: d,
      edgeDomain: l,
      edgeBasePath: u,
      datastreamId: m,
      datasetId: p,
    } = i || {};
  let g = {};
  n && (g = { customAction: { actionID: n } });
  const f = [
    { name: "browser", errorField: "Browser" },
    { name: "ecid", errorField: "ECID" },
    { name: "edgeDomain", errorField: "Edge domain" },
    { name: "edgeBasePath", errorField: "Edge base path" },
    { name: "datastreamId", errorField: "Datastream ID" },
    { name: "datasetId", errorField: "Dataset ID" },
  ];
  try {
    for (const e of f)
      if (!i[e.name])
        throw new Error(
          `Cannot send tracking call. ${e.errorField} is missing.`,
        );
    const t = `https://${l}/${u}/v1/interact?configId=${m}&requestId=${c()}`,
      h = {
        events: [
          {
            xdm: {
              identityMap: { ECID: [{ id: d }] },
              timestamp: new Date().toISOString(),
              pushNotificationTracking: {
                ...g,
                pushProviderMessageID: c(),
                pushProvider: s.toLowerCase(),
              },
              application: { launches: { value: o } },
              eventType: n
                ? "pushTracking.customAction"
                : "pushTracking.applicationOpened",
              _experience: {
                ...e._experience,
                customerJourneyManagement: {
                  ...e._experience.customerJourneyManagement,
                  pushChannelContext: { platform: "web" },
                  messageProfile: {
                    channel: { _id: "https://ns.adobe.com/xdm/channels/push" },
                  },
                },
              },
            },
            data: {
              __adobe: {
                analytics: {
                  eVar15: title,
                  linkName: n ? "PushWebAction" : "PushWebOpened",
                  linkType: "o",
                },
              },
            },
            meta: { collect: { datasetId: p } },
          },
        ],
      },
      y = await a(t, {
        method: "POST",
        headers: { "content-type": "text/plain; charset=UTF-8" },
        body: JSON.stringify(h),
      });
    return (
      !!y.ok || (r.error("Tracking call failed: ", y.status, y.statusText), !1)
    );
  } catch (e) {
    return (r.error("Error sending tracking call:", e), !1);
  }
};
const d = (e) => ["DEEPLINK", "WEBURL"].includes(e);
const l = self,
  u = {
    namespace: "[alloy][pushNotificationWorker]",
    info: (...e) => console.log(u.namespace, ...e),
    error: (...e) => console.error(u.namespace, ...e),
  };
(l.addEventListener("install", () => {
  l.skipWaiting();
}),
  l.addEventListener("activate", (e) => {
    e.waitUntil(l.clients.claim());
  }),
  l.addEventListener("push", (e) => {
    console.log("[PUSH SW] Evento recibido");
    console.log("[PUSH SW] Evento recibido e: ", e);
    if (e.data) {
      try {
        const data = e.data.json();
        console.log("[PUSH SW] Payload:", data);
        saveReceivedPush(data)
          .then((id) => {
            console.log("[PUSH SW] Push almacenado. ID:", id);
          })
          .catch((error) => {
            console.error("[PUSH SW] Error guardando payload:", error);
          });
      } catch (err) {
        console.error("[PUSH SW] Error:", err);
      }
    }
  }),
  l.addEventListener("push", (e) =>
    (async ({ sw: e, event: t, logger: n }) => {
      if (!t.data) return;
      let o;
      try {
        o = t.data.json();
      } catch (e) {
        return void n.error("Error decoding notification JSON data:", e);
      }

      const r = o.web;

      if (!r?.title) return;

      sendPushReceived(
        {
          title: r.title,
          xdm: r._xdm.mixins,
        },
        {
          logger: n,
          fetch: fetch,
        },
      ).catch((err) => {
        n.error("Error enviando Push Received", err);
      });

      // No mostrar push de control
      if (r.title.includes("[CONTROL]")) {
        console.log("[PUSH SW] Push bloqueado por regla [CONTROL]:title");
        return;
      }

      const a = {
        body: r.body,
        icon: r.media,
        image: r.media,
        data: r,
        actions: [],
      };
      return (
        Object.keys(a).forEach((e) => {
          null == a[e] && delete a[e];
        }),
        r.actions &&
          r.actions.buttons &&
          (a.actions = r.actions.buttons.map((e, t) => ({
            action: `action_${t}`,
            title: e.label,
          }))),
        e.registration.showNotification(r.title, a)
      );
    })({ event: e, logger: u, sw: l }),
  ),
  l.addEventListener("notificationclick", (e) =>
    (({ event: e, sw: t, logger: n, fetch: o }) => {
      e.notification.close();
      const r = e.notification.data;
      let a = null,
        i = null;
      if (e.action) {
        const t = parseInt(e.action.replace("action_", ""), 10);
        if (r?.actions?.buttons[t]) {
          const e = r.actions.buttons[t];
          ((i = e.label), d(e.type) && e.uri && (a = e.uri));
        }
      } else
        d(r?.interaction?.type) &&
          r?.interaction?.uri &&
          (a = r.interaction.uri);
      (s(
        {
          xdm: r._xdm.mixins,
          actionLabel: i,
          applicationLaunches: 1,
          title: r.title,
        },
        {
          logger: n,
          fetch: o,
        },
      ).catch((e) => {
        n.error("Failed to send tracking call:", e);
      }),
        a &&
          e.waitUntil(
            t.clients.matchAll({ type: "window" }).then((e) => {
              for (const t of e)
                if (t.url === a && "focus" in t) return t.focus();
              if (t.clients.openWindow) return t.clients.openWindow(a);
            }),
          ));
    })({ event: e, sw: l, logger: u, fetch: fetch }),
  ),
  l.addEventListener("notificationclose", (e) => {
    const t = e.notification.data;
    s(
      { xdm: t._xdm.mixins, actionLabel: "Dismiss" },
      { logger: u, fetch: fetch },
    ).catch((e) => {
      u.error("Failed to send tracking call:", e);
    });
  }));

var sendPushReceived = async ({ title, xdm }, { logger: r, fetch: a }) => {
  const config = await t(r);

  const { browser, ecid, edgeDomain, edgeBasePath, datastreamId, datasetId } =
    config || {};

  try {
    const requiredFields = [
      { value: browser, name: "Browser" },
      { value: ecid, name: "ECID" },
      { value: edgeDomain, name: "Edge domain" },
      { value: edgeBasePath, name: "Edge base path" },
      { value: datastreamId, name: "Datastream ID" },
      { value: datasetId, name: "Dataset ID" },
    ];

    for (const field of requiredFields) {
      if (!field.value) {
        throw new Error(`Cannot send Push Received. ${field.name} is missing.`);
      }
    }

    const payload = {
      events: [
        {
          xdm: {
            identityMap: {
              ECID: [
                {
                  id: ecid,
                },
              ],
            },

            timestamp: new Date().toISOString(),

            pushNotificationTracking: {
              customAction: {
                actionID: "Push Received",
              },

              pushProviderMessageID: c(),

              pushProvider: browser.toLowerCase(),
            },

            application: {
              launches: {
                value: 0,
              },
            },

            eventType: "pushTracking.customAction",

            _experience: {
              ...xdm?._experience,

              customerJourneyManagement: {
                ...xdm?._experience?.customerJourneyManagement,

                pushChannelContext: {
                  platform: "web",
                },

                messageProfile: {
                  channel: {
                    _id: "https://ns.adobe.com/xdm/channels/push",
                  },
                },
              },
            },
          },
          data: {
            __adobe: {
              analytics: {
                eVar15: title,
                linkName: "PushWebReceived",
                linkType: "o",
              },
            },
          },
          meta: {
            collect: {
              datasetId: datasetId,
            },
          },
        },
      ],
    };

    const url =
      `https://${edgeDomain}/${edgeBasePath}/v1/interact` +
      `?configId=${datastreamId}&requestId=${c()}`;

    console.log("[PUSH SW][Push Received] URL:", url);

    console.log("[PUSH SW][Push Received] Payload:", payload);

    const response = await a(url, {
      method: "POST",

      headers: {
        "content-type": "text/plain; charset=UTF-8",
      },

      body: JSON.stringify(payload),
    });

    console.log(
      "[PUSH SW][Push Received] Response:",
      response.status,
      response.statusText,
    );

    return response;
  } catch (error) {
    r.error("Error sending Push Received tracking:", error);

    return false;
  }
};
