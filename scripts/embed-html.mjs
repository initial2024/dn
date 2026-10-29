import {readFileSync,writeFileSync} from 'node:fs';
const html=readFileSync(new URL('../src/index.html',import.meta.url),'utf8');
writeFileSync(new URL('../src/embedded-html.mjs',import.meta.url),'export default '+JSON.stringify(html)+';\n');
