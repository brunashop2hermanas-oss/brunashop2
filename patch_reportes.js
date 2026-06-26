const fs = require('fs');

function patchPage() {
  const filePath = 'src/app/admin/reportes/page.tsx';
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/\r\n/g, '\n');

  // Add imports
  if (!content.includes('import { deleteVenta }')) {
    content = content.replace(
      'import { getReportesFinancieros } from "@/app/actions/reportes";',
      `import { getReportesFinancieros } from "@/app/actions/reportes";\nimport { deleteVenta } from "@/app/actions/ventas";\nimport { getUserRole } from "@/app/actions/auth";\nimport { Trash2 } from "lucide-react";`
    );
  }

  // Add role state
  if (!content.includes('const [userRole, setUserRole]')) {
    content = content.replace(
      'const [loading, setLoading] = useState(true);',
      `const [loading, setLoading] = useState(true);\n  const [userRole, setUserRole] = useState("");`
    );
  }

  // Fetch role
  if (!content.includes('getUserRole().then')) {
    content = content.replace(
      'const fetchReportes = async () => {',
      `const fetchReportes = async () => {\n      getUserRole().then(r => setUserRole(r || ""));`
    );
  }

  // Add delete handler
  if (!content.includes('const handleDeleteVenta')) {
    content = content.replace(
      'const handlePrintDetalle = () => {',
      `const handleDeleteVenta = async (ventaId: string) => {\n    if (confirm("¿Estás seguro de eliminar esta venta por completo? El stock será devuelto al catálogo y los puntos restados." )) {\n      setLoading(true);\n      const res = await deleteVenta(ventaId);\n      if (res.success) {\n        alert("Venta eliminada y stock restaurado con éxito.");\n        // Refetch\n        const queryParam = rango === "Especifica" ? \`fecha:\${fechaEspecifica}\` : rango;\n        const reportRes = await getReportesFinancieros(queryParam);\n        if (reportRes.success && reportRes.data) {\n          setReportes(reportRes.data as any);\n        }\n      } else {\n        alert("Error al eliminar venta: " + res.error);\n      }\n      setLoading(false);\n    }\n  };\n\n  const handlePrintDetalle = () => {`
    );
  }

  // Update table headers
  if (!content.includes('<th className="p-4 text-sm font-bold print-text-black text-center no-print">Acciones</th>')) {
    content = content.replace(
      '<th className="p-4 text-sm font-bold print-text-black text-right">Fecha</th>\n              </tr>',
      `<th className="p-4 text-sm font-bold print-text-black text-right">Fecha</th>\n                {userRole === "ADMINISTRADOR" && <th className="p-4 text-sm font-bold print-text-black text-center no-print">Acciones</th>}\n              </tr>`
    );
  }

  // Update table row (add size/color and delete button)
  const targetRow = `<td className="p-4">
                    <p className="font-bold print-text-black">{t.prendaNombre}</p>
                    <p className="text-xs text-foreground/60 print-text-black">Cant: {t.cantidad}</p>
                  </td>`;
  const replacementRow = `<td className="p-4">
                    <p className="font-bold print-text-black">{t.prendaNombre}</p>
                    <p className="text-xs text-foreground/60 print-text-black">Cant: {t.cantidad} | Talla: {t.talla} | Color: {t.color}</p>
                  </td>`;
                  
  if (content.includes(targetRow)) {
      content = content.replace(targetRow, replacementRow);
  } else {
      console.log('Row target not found');
  }

  const targetEndRow = `<td className="p-4 text-right text-sm text-foreground/70 print-text-black">
                    {t.fecha.split(', ')[0]}<br/>{t.fecha.split(', ')[1] || ""}
                  </td>
                </tr>`;
  const replacementEndRow = `<td className="p-4 text-right text-sm text-foreground/70 print-text-black">
                    {t.fecha.split(', ')[0]}<br/>{t.fecha.split(', ')[1] || ""}
                  </td>
                  {userRole === "ADMINISTRADOR" && (
                    <td className="p-4 text-center no-print">
                      <button onClick={() => handleDeleteVenta(t.ventaId)} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors" title="Eliminar Venta (Restaurar Stock)">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>`;

  if (content.includes(targetEndRow)) {
      content = content.replace(targetEndRow, replacementEndRow);
  } else {
      console.log('End row target not found');
  }
  
  // Update colspan for "No hay transacciones"
  const targetColspan = '<td colSpan={5} className="p-4 text-center text-foreground/60">No hay transacciones';
  const replacementColspan = '<td colSpan={userRole === "ADMINISTRADOR" ? 6 : 5} className="p-4 text-center text-foreground/60">No hay transacciones';
  if (content.includes(targetColspan)) {
      content = content.replace(targetColspan, replacementColspan);
  }

  fs.writeFileSync(filePath, content, 'utf-8');
}

patchPage();
console.log('Done!');
