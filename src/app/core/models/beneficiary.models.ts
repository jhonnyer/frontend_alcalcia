export interface IBeneficiary {
  id_beneficiario: string;
  nombres_apellidos: string;
  documento_identidad: string;
  fecha_nacimiento: string;
  direccion: string;
  telefono: string;
  correo_electronico: string;
  programa_id: string;
  fecha_ingreso: string;
  estado: string;
  observaciones: string;
  idNucleo?: string;
}
