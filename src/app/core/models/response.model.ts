export interface ResponseStandar<T> {
  respuesta: T[];
  mensaje: string;
  estado: string;
}

export interface ResponseStandarUnique<T> {
  respuesta: T;
  mensaje: string;
  estado: string;
}
