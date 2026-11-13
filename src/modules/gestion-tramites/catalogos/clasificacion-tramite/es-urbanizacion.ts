export function esUrbanizacion(nombre: string | null | undefined): boolean {
  return nombre?.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase() === 'urbanizacion';
}
