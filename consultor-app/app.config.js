// Se lee cada vez que Expo prepara la app (además de app.json).
// En los builds de producción de EAS comprueba que no falte nada antes de
// generar la versión para las tiendas, para no publicar por error la versión
// de demostración o con textos de ejemplo.
const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  const enEas = process.env.EAS_BUILD === 'true';
  const perfil = process.env.EAS_BUILD_PROFILE;
  if (enEas && perfil === 'production') {
    const errores = [];
    if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_KEY) {
      errores.push(
        'Faltan EXPO_PUBLIC_SUPABASE_URL y/o EXPO_PUBLIC_SUPABASE_KEY en las variables de EAS ' +
          '(entorno "production"). Sin ellas la app saldría en modo demostración.',
      );
    }
    if (process.env.EXPO_PUBLIC_DEMO === '1') {
      errores.push('EXPO_PUBLIC_DEMO=1 está activado: la app saldría en modo demostración.');
    }
    const consultor = fs.readFileSync(
      path.join(__dirname, 'src', 'constants', 'consultor.ts'),
      'utf8',
    );
    if (consultor.includes("nombre: 'Tu Consultor Financiero'")) {
      errores.push('Cambia "nombre" en src/constants/consultor.ts: sigue el texto de ejemplo.');
    }
    if (/urlPrivacidad:\s*''/.test(consultor)) {
      errores.push('Pon la dirección de tu aviso de privacidad en "urlPrivacidad" (src/constants/consultor.ts).');
    }
    if (errores.length) {
      throw new Error(`No se puede generar la versión para las tiendas:\n- ${errores.join('\n- ')}`);
    }
  }
  return config;
};
