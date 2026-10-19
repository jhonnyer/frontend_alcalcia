export async function leerLogoInstitucional(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 512 * 1024 || file.size === 0) {
    throw new Error('Selecciona una imagen PNG o JPEG de máximo 512 KB.');
  }
  const image = await createImageBitmap(file);
  const valid = image.width > 0 && image.height > 0 && image.width <= 2048 && image.height <= 2048;
  image.close();
  if (!valid) throw new Error('El logo no puede superar 2048 × 2048 píxeles.');
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result) : reject(new Error('No se pudo leer el archivo.'));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.onabort = () => reject(new Error('Se canceló la lectura del archivo.'));
    reader.readAsDataURL(file);
  });
}
