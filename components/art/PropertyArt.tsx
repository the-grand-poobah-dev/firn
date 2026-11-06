import { useId, type ReactNode } from 'react';
import { Logo as FirnLogo } from '@/components/ui/Logo';

export type PropertyArtKind = 'tower' | 'villa' | 'marbella' | 'office' | 'palm' | 'lisbon' | 'zurich' | 'mallorca';
type Props = { kind: PropertyArtKind | string; seed?: number; className?: string };

function rngFor(seed: number) {
  let state = (Math.floor(Math.abs(seed)) || 1) >>> 0;
  return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
}
function hashSeed(value: string) { let h = 2166136261; for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619); return h >>> 0; }

export function PropertyArt({ kind, seed = 1, className }: Props) {
  const id = useId().replace(/:/g, '');
  const random = rngFor(seed);
  const pick = (min: number, max: number) => min + random() * (max - min);
  const windows = (x: number, y: number, cols: number, rows: number, color = '#F8D89B') =>
    Array.from({ length: cols * rows }, (_, i) => <rect key={i} x={x + (i % cols) * 7 + 2} y={y + Math.floor(i / cols) * 9 + 2} width="2.5" height="4" rx=".7" fill={color} opacity={random() > .23 ? pick(.45, .95) : .12} />);
  const bgTowers = Array.from({ length: 9 }, (_, i) => {
    const w = pick(13, 26), h = pick(48, 116), x = i * 37 - 4;
    return <g key={i}><rect x={x} y={160 - h} width={w} height={h} rx="1.5" fill={i % 2 ? '#34445A' : '#26394D'} opacity=".88"/>{windows(x, 160 - h + 7, Math.max(1, Math.floor(w / 7)), Math.floor((h - 10) / 9), '#F8C98D')}</g>;
  });
  const trees = Array.from({ length: 9 }, (_, i) => {
    const x = 18 + i * 35 + pick(-4, 4), h = pick(40, 67);
    return <g key={i}><path d={`M${x} 170 L${x} ${170-h} Q${x-10} ${170-h+17} ${x} ${170-h-2} Q${x+10} ${170-h+17} ${x} 170`} fill="#345C46"/><path d={`M${x} 170v-8`} stroke="#8A684A" strokeWidth="2"/></g>;
  });
  let scene: ReactNode;
  switch (kind) {
    case 'villa':
      scene = <><defs><linearGradient id={id+'sky'} x2="0" y2="1"><stop stopColor="#B8D9E5"/><stop offset="1" stopColor="#F6E4C7"/></linearGradient></defs><rect width="320" height="200" fill={`url(#${id}sky)`}/><circle cx="260" cy="38" r="19" fill="#F9D69A" opacity=".8"/><path d="M0 128Q55 88 112 124T220 116T320 126V200H0Z" fill="#A2B38A"/><path d="M0 151Q65 116 132 148T260 141T320 146V200H0Z" fill="#718D69"/>{trees}<path d="M83 155V104L124 77L178 104V155Z" fill="#D8C5A3"/><path d="M76 106L126 72L185 106L178 112L126 83L83 113Z" fill="#B96549"/><rect x="102" y="117" width="14" height="24" rx="7" fill="#755A47"/><rect x="137" y="117" width="14" height="24" rx="7" fill="#755A47"/><rect x="166" y="110" width="24" height="45" fill="#CDB895"/><path d="M163 111L178 92L193 111Z" fill="#B96549"/><rect x="171" y="121" width="7" height="10" rx="3.5" fill="#536B70"/><rect y="169" width="320" height="31" fill="#657B5D"/></>;
      break;
    case 'marbella':
      scene = <><defs><linearGradient id={id+'sky'} y2="1"><stop stopColor="#62BCE8"/><stop offset="1" stopColor="#D6F1E9"/></linearGradient></defs><rect width="320" height="200" fill={`url(#${id}sky)`}/><rect y="103" width="320" height="97" fill="#39AFC0"/><path d="M0 116Q60 108 115 118T220 115T320 118" stroke="#B5E9E2" strokeWidth="2" fill="none"/><path d="M0 157H320V200H0Z" fill="#D8C4A1"/><rect x="64" y="79" width="190" height="70" rx="4" fill="#F5F3E9"/><rect x="82" y="92" width="154" height="29" fill="#82C7CC"/><path d="M82 121h154v7H82z" fill="#D5D8D0"/><path d="M64 78h190v8H64z" fill="#FFFDF5"/><rect x="100" y="129" width="120" height="20" fill="#E4E0D3"/><rect x="28" y="158" width="265" height="25" rx="4" fill="#18A7B5"/>{Array.from({length:8},(_,i)=><path key={i} d={`M${36+i*34} 161v19`} stroke="#A9E5DB" strokeWidth="1.5" opacity=".8"/>)}<path d="M37 157V69M37 69q-25-20-23-39q18 4 23 25q3-25 24-31q-1 22-24 39q22-10 34 3q-17 13-34 3" fill="#387D55"/><path d="M280 159V77M280 77q-24-20-22-39q18 4 22 25q3-25 24-31q-1 22-24 39q22-10 34 3q-17 13-34 3" fill="#387D55"/></>;
      break;
    case 'office':
      scene = <><defs><linearGradient id={id+'sky'} y2="1"><stop stopColor="#C8D7DF"/><stop offset="1" stopColor="#EDF0E8"/></linearGradient><linearGradient id={id+'glass'} x2="1" y2="1"><stop stopColor="#8CB6C2"/><stop offset=".5" stopColor="#477C91"/><stop offset="1" stopColor="#B4D0D2"/></linearGradient></defs><rect width="320" height="200" fill={`url(#${id}sky)`}/><rect x="9" y="70" width="54" height="95" fill="#8FA7B0"/><rect x="19" y="82" width="6" height="8" fill="#D8D7C6"/><rect x="36" y="82" width="6" height="8" fill="#D8D7C6"/><rect x="73" y="91" width="48" height="74" fill="#A5B7B8"/><rect x="247" y="76" width="62" height="89" fill="#8EA8B2"/><rect x="260" y="88" width="7" height="9" fill="#E7D7A9"/><rect x="278" y="88" width="7" height="9" fill="#E7D7A9"/><rect x="133" y="36" width="69" height="129" fill={`url(#${id}glass)`}/>{Array.from({length:8},(_,i)=><path key={'v'+i} d={`M${140+i*8} 39v124`} stroke="#D1E2DE" strokeWidth="1.5" opacity=".8"/>)}{Array.from({length:14},(_,i)=><path key={'h'+i} d={`M134 ${47+i*8}h67`} stroke="#D1E2DE" strokeWidth="1.2" opacity=".7"/>)}<path d="M137 41L197 41L146 163H133Z" fill="#EAF4E8" opacity=".2"/><path d="M0 165H320V200H0Z" fill="#A8B1A9"/><path d="M0 178H320M42 165l-20 35m250-35 20 35" stroke="#D6D9D0" strokeWidth="2"/></>;
      break;
    case 'palm':
      scene = <><defs><linearGradient id={id+'sea'} y2="1"><stop stopColor="#54C8C8"/><stop offset="1" stopColor="#137C94"/></linearGradient></defs><rect width="320" height="200" fill={`url(#${id}sea)`}/>{Array.from({length:12},(_,i)=><path key={i} d={`M${i*31-4} ${38+i%3*11}q20 -4 39 0`} stroke="#C1ECE3" strokeWidth="1.2" opacity=".42" fill="none"/>)}<path d="M150 180Q142 128 155 83" stroke="#A77C4C" strokeWidth="9" fill="none" strokeLinecap="round"/><path d="M155 84Q99 24 68 51Q112 59 151 91Q110 30 116 16Q151 42 158 86Q153 31 183 15Q187 53 163 88Q205 35 237 48Q215 80 164 94Q230 74 253 103Q212 112 159 99" fill="#347B55"/><path d="M155 88Q82 66 75 92Q117 89 155 96Q96 83 91 112Q125 99 158 101Q112 105 117 132Q143 114 160 104Q174 61 199 54Q189 80 162 96" fill="#347B55"/>{Array.from({length:7},(_,i)=><g key={i} transform={`translate(${72+i*27},${125+(i%3)*9})`}><rect width="22" height="17" rx="2" fill="#F4F0E5"/><path d="M-2 2L11 -6L24 2Z" fill="#C8755E"/><rect x="8" y="7" width="5" height="10" fill="#8DB5B4"/></g>)}<path d="M0 184Q85 175 160 186T320 183V200H0Z" fill="#0F7288" opacity=".65"/></>;
      break;
    case 'lisbon':
      scene = <><defs><linearGradient id={id+'sky'} y2="1"><stop stopColor="#F4BDA6"/><stop offset="1" stopColor="#F6E0C8"/></linearGradient></defs><rect width="320" height="200" fill={`url(#${id}sky)`}/><rect y="173" width="320" height="27" fill="#3D9EAA"/><path d="M0 178q40-8 80 0t80 0t80 0t80 0" stroke="#B7E2DC" strokeWidth="2" fill="none"/>{Array.from({length:5},(_,row)=>Array.from({length:9},(_,col)=>{const x=col*37-7+row*3,y=44+row*25;const colors=['#E7C18D','#E99F83','#E8D7B6','#D2A9A0','#F0D3A4'];return <g key={row+'-'+col}><rect x={x} y={y} width="34" height="27" fill={colors[(row+col)%colors.length]}/><path d={`M${x-2} ${y+1}l19 -9l19 9Z`} fill="#C66E46"/><rect x={x+6} y={y+8} width="6" height="9" fill="#49616A"/><rect x={x+21} y={y+8} width="6" height="9" fill="#49616A"/></g>}))}<path d="M22 154h86v18H22z" fill="#E5B74C"/><rect x="30" y="149" width="69" height="15" rx="6" fill="#E8BE4C"/><rect x="39" y="153" width="10" height="7" fill="#56717A"/><rect x="57" y="153" width="10" height="7" fill="#56717A"/><rect x="75" y="153" width="10" height="7" fill="#56717A"/><circle cx="43" cy="173" r="5" fill="#344C55"/><circle cx="88" cy="173" r="5" fill="#344C55"/></>;
      break;
    case 'zurich':
      scene = <><defs><linearGradient id={id+'sky'} y2="1"><stop stopColor="#D4E4EA"/><stop offset="1" stopColor="#F3EBDD"/></linearGradient></defs><rect width="320" height="200" fill={`url(#${id}sky)`}/><path d="M0 115L56 45L83 80L128 25L183 91L221 48L277 106L320 70V145H0Z" fill="#91A9B5"/><path d="M35 72L56 45L70 65L60 60L55 68L49 61Z M108 50L128 25L149 54L134 45L126 51L120 43Z M204 70L221 48L241 76L225 67L218 73Z" fill="#F7F7F1"/><rect y="132" width="320" height="68" fill="#5C9DB0"/><path d="M0 147q80-8 160 0t160 0" stroke="#B8E1E4" strokeWidth="2" fill="none"/>{[24,116,211].map((x,i)=><g key={x}><rect x={x} y={92+i%2*8} width="75" height="53" fill={i===1?'#9D8A72':'#B39B7E'}/><path d={`M${x-5} ${94+i%2*8}l42 -26l43 26Z`} fill="#667C8D"/><rect x={x+8} y={105+i%2*8} width="59" height="3" fill="#E2D1B5"/>{[0,1,2].map(n=><g key={n}><rect x={x+10+n*19} y={112+i%2*8} width="12" height="12" fill="#79B7C8"/><path d={`M${x+7+n*19} ${111+i%2*8}h18m-18 14h18`} stroke="#E4D1B2" strokeWidth="2"/></g>)}<rect x={x+29} y={129+i%2*8} width="15" height="16" fill="#4F6873"/></g>)}</>;
      break;
    case 'mallorca':
      scene = <><defs><linearGradient id={id+'sky'} y2="1"><stop stopColor="#79C8EB"/><stop offset="1" stopColor="#D5EBD9"/></linearGradient></defs><rect width="320" height="200" fill={`url(#${id}sky)`}/><circle cx="258" cy="40" r="20" fill="#F7D27E"/><rect y="104" width="320" height="96" fill="#319FB0"/><path d="M0 118q60-8 120 0t120 0t120 0" stroke="#B8E7DB" strokeWidth="2" fill="none"/><path d="M0 160L38 128L86 118L133 135L175 122L222 142L264 126L320 143V200H0Z" fill="#C9A77A"/><path d="M66 144L105 103L198 104L235 142L225 158L79 158Z" fill="#D8C4A3"/><path d="M93 108L150 69L210 108Z" fill="#B96849"/><rect x="111" y="111" width="90" height="45" fill="#D7C7A8"/><rect x="123" y="121" width="13" height="18" fill="#526C69"/><rect x="153" y="121" width="13" height="18" fill="#526C69"/><rect x="182" y="121" width="13" height="18" fill="#526C69"/>{[34,52,253,278].map((x,i)=><g key={x}><circle cx={x} cy={130+(i%2)*10} r={pick(12,18)} fill="#47764D"/><rect x={x-2} y={143+(i%2)*10} width="4" height="13" fill="#816348"/></g>)}</>;
      break;
    case 'tower':
    default:
      scene = <><defs><linearGradient id={id+'sky'} y2="1"><stop stopColor="#162B49"/><stop offset=".64" stopColor="#8D7180"/><stop offset="1" stopColor="#F1B38F"/></linearGradient></defs><rect width="320" height="200" fill={`url(#${id}sky)`}/><circle cx="250" cy="65" r="23" fill="#F5C18E" opacity=".9"/>{bgTowers}<path d="M128 165V43L150 25L174 43V165Z" fill="#263D56"/><path d="M128 43L150 25L174 43L169 48L150 34L133 48Z" fill="#D8B46C"/><path d="M150 25V9" stroke="#E8C77B" strokeWidth="2"/><path d="M138 165V53L150 42L164 53V165Z" fill="#38536B"/>{windows(137,54,4,12,'#FFD89B')}<path d="M0 165H320V200H0Z" fill="#102C43"/>{Array.from({length:14},(_,i)=><path key={i} d={`M${i*25-5} ${177+(i%3)*5}q12 -3 24 0`} stroke="#D79E84" strokeWidth="1.4" opacity=".6" fill="none"/> )}</>;
  }
  const glintX = pick(18, 290), glintY = pick(18, 78), glintWidth = pick(9, 28);
  return <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className={className ?? 'h-full w-full'} aria-hidden="true" focusable="false">{scene}<path d={`M${glintX} ${glintY}h${glintWidth}`} stroke="#FFF8E8" strokeWidth="1.4" opacity=".2"/></svg>;
}

export function Ridge() {
  return <svg viewBox="0 0 320 110" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true"><path d="M0 93 48 46 76 68 125 20 169 65 208 38 258 78 291 51 320 73V110H0Z" fill="currentColor" opacity=".14"/><path d="m0 102 62-35 38 20 50-55 46 43 40-24 42 37 42-20v42H0Z" fill="currentColor" opacity=".24"/><path d="m0 108 71-23 37 12 48-38 53 33 48-19 63 24v13H0Z" fill="currentColor" opacity=".38"/></svg>;
}
export { FirnLogo as Logo };
export { hashSeed };
