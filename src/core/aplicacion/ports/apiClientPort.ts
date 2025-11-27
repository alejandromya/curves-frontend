export type ApiClientPort = {
  postFormData: (url: string, form: FormData) => Promise<Response>;
  get: (url: string) => Promise<Response>;
};
