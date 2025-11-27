// dominio puro
export type ArchivoStatus = "pendiente" | "procesando" | "procesado" | "error";

export type Archivo = {
  name(arg0: string, file: File, name: any): unknown;
  id: string;
  file?: File; // opcional, dominio puede existir sin referencia al File real (para tests)
  status?: ArchivoStatus;
};

export type Column = {
  id: number;
  files: Archivo[];
};
