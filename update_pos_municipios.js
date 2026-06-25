const fs = require('fs');
const file = 'src/app/admin/nueva-venta/page.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { getConfiguracion }')) {
  content = content.replace(
    'import { getPrendas } from \'@/app/actions/productos\';',
    'import { getPrendas } from \'@/app/actions/productos\';\nimport { getConfiguracion } from \'@/app/actions/config\';'
  );
}

const stateToAdd = `
  const [config, setConfig] = useState<any>(null);
  const [departamentosHabilitados, setDepartamentosHabilitados] = useState<string[]>([]);
  const [provinciasHabilitadas, setProvinciasHabilitadas] = useState<string[]>([]);
`;
if (!content.includes('departamentosHabilitados')) {
  content = content.replace(
    'const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);',
    'const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);' + stateToAdd
  );
}

const oldUseEffect = `  useEffect(() => {
    const fetchProductos = async () => {
      const res = await getPrendas();
      if (res.success) {
        setProductos(res.data || []);
      }
    };
    fetchProductos();
  }, []);`;

const newUseEffect = `  useEffect(() => {
    const fetchDatos = async () => {
      const res = await getPrendas();
      if (res.success) {
        setProductos(res.data || []);
      }
      const configRes = await getConfiguracion();
      if (configRes.success && configRes.data) {
        setConfig(configRes.data);
        if (configRes.data.destinosHabilitados) {
          setDepartamentosHabilitados(Object.keys(configRes.data.destinosHabilitados));
        }
      }
    };
    fetchDatos();
  }, []);

  const handleDeptoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setDestino(val);
    if (config?.destinosHabilitados && config.destinosHabilitados[val]) {
      setProvinciasHabilitadas(config.destinosHabilitados[val]);
      setProvinciaDestino('');
    } else {
      setProvinciasHabilitadas([]);
      setProvinciaDestino('');
    }
  };`;

if (content.includes(oldUseEffect)) {
  content = content.replace(oldUseEffect, newUseEffect);
}

const oldUI = `<div className="space-y-2">
                      <select 
                        value={destino}
                        onChange={(e) => setDestino(e.target.value)}
                        className="w-full bg-surface border border-surface-border rounded-lg p-2 text-sm outline-none focus:border-brand-primary cursor-pointer appearance-none"
                      >
                        <option value="">Selecciona Departamento...</option>
                        <option value="La Paz">La Paz</option>
                        <option value="Cochabamba">Cochabamba</option>
                        <option value="Santa Cruz">Santa Cruz</option>
                        <option value="Oruro">Oruro</option>
                        <option value="Potosí">Potosí</option>
                        <option value="Chuquisaca">Chuquisaca (Sucre)</option>
                        <option value="Tarija">Tarija</option>
                        <option value="Beni">Beni</option>
                        <option value="Pando">Pando</option>
                      </select>
                      <input 
                        type="text" 
                        value={provinciaDestino}
                        onChange={(e) => setProvinciaDestino(e.target.value)}
                        placeholder="Ciudad / Municipio / Zona" 
                        className="w-full bg-surface border border-surface-border p-2 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary transition-all text-sm"
                      />
                    </div>`;

const newUI = `<div className="space-y-2">
                      <select 
                        value={destino}
                        onChange={handleDeptoChange}
                        className="w-full bg-surface border border-surface-border rounded-lg p-2 text-sm outline-none focus:border-brand-primary cursor-pointer appearance-none"
                      >
                        <option value="">Selecciona Departamento...</option>
                        {departamentosHabilitados.length > 0 ? (
                          departamentosHabilitados.map(d => <option key={d} value={d}>{d}</option>)
                        ) : (
                          <>
                            <option value="La Paz">La Paz</option>
                            <option value="Cochabamba">Cochabamba</option>
                            <option value="Santa Cruz">Santa Cruz</option>
                            <option value="Oruro">Oruro</option>
                            <option value="Potosí">Potosí</option>
                            <option value="Chuquisaca">Chuquisaca (Sucre)</option>
                            <option value="Tarija">Tarija</option>
                            <option value="Beni">Beni</option>
                            <option value="Pando">Pando</option>
                          </>
                        )}
                      </select>
                      {provinciasHabilitadas.length > 0 ? (
                        <select 
                          value={provinciaDestino}
                          onChange={(e) => setProvinciaDestino(e.target.value)}
                          className="w-full bg-surface border border-surface-border p-2 rounded-lg outline-none focus:border-brand-primary cursor-pointer appearance-none text-sm"
                        >
                          <option value="">Selecciona Provincia/Municipio...</option>
                          {provinciasHabilitadas.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      ) : (
                        <input 
                          type="text" 
                          value={provinciaDestino}
                          onChange={(e) => setProvinciaDestino(e.target.value)}
                          placeholder="Ciudad / Municipio / Zona" 
                          className="w-full bg-surface border border-surface-border p-2 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary transition-all text-sm"
                        />
                      )}
                    </div>`;

if (content.includes(oldUI)) {
  content = content.replace(oldUI, newUI);
}

fs.writeFileSync(file, content);
console.log('Update municipios applied.');
