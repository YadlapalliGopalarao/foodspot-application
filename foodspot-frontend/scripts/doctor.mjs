import {existsSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const p=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
console.log(`Project: ${p.name} ${p.version}\nNode: ${process.version}\nPlatform: ${process.platform}/${process.arch}\nNode executable: ${process.execPath}`);
const [major,minor]=process.versions.node.split('.').map(Number);
if(!(major===20&&minor>=19||major===22&&minor>=12||major>22)){console.error('Unsupported Node.js version. Use Node.js 24 LTS.');process.exitCode=1;}
if(process.platform==='win32')console.log('Windows detected. This project uses a WebAssembly build tool, not native Rollup or Rolldown.');
if(!existsSync(new URL('../package-lock.json',import.meta.url)))console.log('No lockfile yet. Generate it using the README steps before installation.');
else{
 const lock=JSON.parse(readFileSync(new URL('../package-lock.json',import.meta.url),'utf8'));
 const entries=Object.entries(lock.packages??{});
 const scripts=entries.filter(([,v])=>v.hasInstallScript);
 console.log('Resolved packages with install scripts:',scripts.length?scripts.map(([k,v])=>`${k} @ ${v.version}`).join('\n  '):'none listed');
 const match=entries.filter(([k])=>k.endsWith('/picomatch'));
 console.log('Resolved picomatch versions:',match.length?match.map(([,v])=>v.version).join(', '):'not listed');
 const native=entries.filter(([k])=>/(?:^|\/)node_modules\/(?:vite|rollup|rolldown|esbuild|lightningcss|@rollup\/[^/]+|@rolldown\/[^/]+|@esbuild\/[^/]+)$/.test(k));
 console.log('Previously problematic build packages:',native.length?native.map(([k,v])=>`${k} @ ${v.version}`).join('\n  '):'none listed');
 if(native.length)console.warn('Review these unexpected dependencies before installing.');
 console.log('This is not a vulnerability scan. Run npm audit.');
}
if(process.env.npm_execpath){try{console.log('npm: '+execFileSync(process.execPath,[process.env.npm_execpath,'--version'],{encoding:'utf8'}).trim())}catch{}}
