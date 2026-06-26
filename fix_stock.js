const fs = require('fs');
let content = fs.readFileSync('src/app/admin/productos/page.tsx', 'utf8');

// 1. Fix loading from product
const target1 = `stockPorTalla: producto.stockPorTalla || {},`;
const repl1 = `stockPorTalla: (() => {
  let s = {};
  if (producto.stockPorTalla) {
    Object.keys(producto.stockPorTalla).forEach(talla => {
      if (typeof producto.stockPorTalla[talla] === 'object' && producto.stockPorTalla[talla] !== null) {
        s[talla] = { ...producto.stockPorTalla[talla] };
      } else {
        s[talla] = { 'Unico': String(producto.stockPorTalla[talla]) };
      }
    });
  }
  return s;
})(),`;
content = content.replace(target1, repl1);

// 2. Fix the color input
const target2 = `                                        <input 
                                          type="number" min="0" 
                                          value={formData.stockPorTalla?.[talla]?.[color] || ""}
                                          onChange={(e) => {
                                            const val = Math.max(0, Number(e.target.value));
                                            setFormData({
                                              ...formData,
                                              stockPorTalla: {
                                                ...formData.stockPorTalla,
                                                [talla]: {
                                                  ...(formData.stockPorTalla[talla] || {}),
                                                  [color]: val.toString()
                                                }
                                              }
                                            });
                                          }}`;
const repl2 = `                                        <input 
                                          type="number" min="0" 
                                          value={formData.stockPorTalla?.[talla]?.[color] === "NaN" ? "" : (formData.stockPorTalla?.[talla]?.[color] || "")}
                                          onChange={(e) => {
                                            const rawVal = e.target.value;
                                            const valStr = rawVal === "" ? "" : Math.max(0, Number(rawVal)).toString();
                                            setFormData({
                                              ...formData,
                                              stockPorTalla: {
                                                ...formData.stockPorTalla,
                                                [talla]: {
                                                  ...(typeof formData.stockPorTalla[talla] === 'object' ? formData.stockPorTalla[talla] : {}),
                                                  [color]: valStr
                                                }
                                              }
                                            });
                                          }}`;
content = content.replace(target2, repl2);

// 3. Fix the Unico input
const target3 = `                                      <input 
                                        type="number" min="0" 
                                        value={formData.stockPorTalla?.[talla]?.['Unico'] || ""}
                                        onChange={(e) => {
                                          const val = Math.max(0, Number(e.target.value));
                                          setFormData({
                                            ...formData,
                                            stockPorTalla: {
                                              ...formData.stockPorTalla,
                                              [talla]: {
                                                ...(formData.stockPorTalla[talla] || {}),
                                                ['Unico']: val.toString()
                                              }
                                            }
                                          });
                                        }}`;
const repl3 = `                                      <input 
                                        type="number" min="0" 
                                        value={formData.stockPorTalla?.[talla]?.['Unico'] === "NaN" ? "" : (formData.stockPorTalla?.[talla]?.['Unico'] || "")}
                                        onChange={(e) => {
                                          const rawVal = e.target.value;
                                          const valStr = rawVal === "" ? "" : Math.max(0, Number(rawVal)).toString();
                                          setFormData({
                                            ...formData,
                                            stockPorTalla: {
                                              ...formData.stockPorTalla,
                                              [talla]: {
                                                ...(typeof formData.stockPorTalla[talla] === 'object' ? formData.stockPorTalla[talla] : {}),
                                                ['Unico']: valStr
                                              }
                                            }
                                          });
                                        }}`;
content = content.replace(target3, repl3);

fs.writeFileSync('src/app/admin/productos/page.tsx', content);
console.log('Fixed successfully');
