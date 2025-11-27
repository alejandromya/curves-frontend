import type { ApiClientPort } from "../aplicacion/ports/apiClientPort";

export const fetchApiClient: ApiClientPort = {
  postFormData: (url, form) => fetch(url, { method: "POST", body: form }),
  get: (url) => fetch(url),
};
