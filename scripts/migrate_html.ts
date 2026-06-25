import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando migración de textos legales a HTML...");

  const config = await prisma.configuracion.findFirst();
  if (!config) {
    console.log("No se encontró configuración.");
    return;
  }

  // Función simple para convertir saltos de línea a <p> y <br>
  const convertToHTML = (text: string | null) => {
    if (!text) return text;
    if (text.includes('<p>') || text.includes('<h1>') || text.includes('<strong>')) {
      // Ya parece ser HTML
      return text;
    }
    // Convertir a párrafos
    const paragraphs = text.split(/\n\s*\n/).map(p => {
      const lineBreaks = p.replace(/\n/g, '<br/>');
      return `<p>${lineBreaks}</p>`;
    });
    return paragraphs.join('');
  };

  const politicaPrivacidad = convertToHTML(config.politicaPrivacidad);
  const terminosCondiciones = convertToHTML(config.terminosCondiciones);
  const politicasEnvio = convertToHTML(config.politicasEnvio);
  const politicaDevoluciones = convertToHTML(config.politicaDevoluciones);

  await prisma.configuracion.update({
    where: { id: config.id },
    data: {
      politicaPrivacidad,
      terminosCondiciones,
      politicasEnvio,
      politicaDevoluciones
    }
  });

  console.log("¡Migración completada exitosamente!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
