const Leaf = ({ x, y, flip = false, color = '#5f806b' }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
    <rect x="0" y="4" width="8" height="8" fill="#456b57" />
    <rect x="4" y="0" width="8" height="8" fill={color} />
  </g>
)

const PotPlant = ({ stage }) => <>
  <rect x="26" y="69" width="44" height="7" rx="2" fill="#9b6344" />
  <path d="M31 76h34l-5 16H36z" fill="#bd7952" />
  <rect x="38" y="88" width="20" height="4" fill="#8e573e" />
  <rect x="31" y="65" width="34" height="5" fill="#584b3a" />
  {stage === 0 && <><rect x="46" y="61" width="6" height="4" fill="#775840" /><rect x="49" y="57" width="3" height="4" fill="#a3aa72" /></>}
  {stage >= 1 && <><rect x="47" y="46" width="4" height="20" fill="#4d7553" /><Leaf x={37} y={48} flip color="#7fa46f" /><Leaf x={51} y={42} color="#6e9665" /></>}
  {stage >= 2 && <><rect x="47" y="29" width="5" height="19" fill="#476d4d" /><Leaf x={35} y={32} flip color="#779d6d" /><Leaf x={52} y={25} color="#628c60" /><Leaf x={38} y={20} flip color="#8aad72" /></>}
  {stage >= 3 && <><rect x="28" y="24" width="20" height="18" fill="#709a68" /><rect x="45" y="17" width="22" height="23" fill="#5f8d5d" /><rect x="35" y="10" width="22" height="23" fill="#80aa70" /><rect x="30" y="27" width="5" height="5" fill="#f5e9bd" /><rect x="56" y="22" width="5" height="5" fill="#f7d989" /><rect x="43" y="13" width="5" height="5" fill="#f4eccb" /></>}
</>

const MushroomPlant = ({ stage }) => <>
  <rect x="18" y="82" width="62" height="6" fill="#657858" /><rect x="27" y="77" width="43" height="6" fill="#91a276" />
  {stage === 0 && <><rect x="45" y="73" width="6" height="5" rx="2" fill="#cbb78f" /><rect x="53" y="76" width="4" height="3" fill="#876c52" /></>}
  {stage >= 1 && <><rect x="44" y="61" width="10" height="18" rx="3" fill="#eee1c5" /><path d="M36 63c2-12 25-12 27 0z" fill="#c65f55" /><rect x="44" y="56" width="5" height="4" fill="#f7dfc7" /></>}
  {stage >= 2 && <><rect x="25" y="65" width="8" height="15" rx="2" fill="#eadbbd" /><path d="M18 67c2-10 22-10 24 0z" fill="#d88465" /><rect x="64" y="62" width="9" height="18" rx="2" fill="#eadbbd" /><path d="M57 64c2-12 23-12 25 0z" fill="#a94d4c" /><rect x="61" y="58" width="5" height="4" fill="#f3ddc3" /></>}
  {stage >= 3 && <><rect x="40" y="38" width="18" height="42" rx="4" fill="#f0e1c2" /><path d="M24 42c2-25 47-25 50 0z" fill="#ae4748" /><path d="M34 31c7-12 24-12 31 0z" fill="#d66258" /><rect x="35" y="34" width="6" height="6" fill="#f6e5ca" /><rect x="55" y="28" width="6" height="6" fill="#f8e8cf" /><rect x="62" y="37" width="5" height="5" fill="#f3dec2" /></>}
</>

const SunflowerPlant = ({ stage }) => <>
  <rect x="17" y="83" width="63" height="5" fill="#71805c" /><rect x="28" y="78" width="42" height="6" fill="#9ba778" />
  {stage === 0 && <><ellipse cx="49" cy="75" rx="6" ry="3" fill="#5d4935" /><rect x="47" y="69" width="4" height="5" fill="#8c714d" /><rect x="54" y="75" width="4" height="3" fill="#c5ac75" /></>}
  {stage >= 1 && <><rect x="47" y="55" width="5" height="25" fill="#548052" /><Leaf x={37} y={58} flip color="#79a068" /><Leaf x={51} y={51} color="#6b965e" /></>}
  {stage >= 2 && <><rect x="46" y="32" width="6" height="48" fill="#4f7b4d" /><Leaf x={35} y={59} flip color="#83a96d" /><Leaf x={52} y={48} color="#75a064" /><Leaf x={34} y={38} flip color="#78a265" /><rect x="40" y="24" width="18" height="14" rx="7" fill="#728a46" /><rect x="44" y="20" width="10" height="8" rx="4" fill="#d5a83a" /></>}
  {stage >= 3 && <><rect x="45" y="28" width="7" height="52" fill="#4c784a" /><Leaf x={33} y={61} flip color="#86aa6e" /><Leaf x={52} y={49} color="#78a367" /><Leaf x={32} y={38} flip color="#7da568" /><g fill="#f5cb55"><rect x="43" y="3" width="12" height="13" /><rect x="32" y="7" width="12" height="12" /><rect x="54" y="7" width="12" height="12" /><rect x="26" y="16" width="14" height="11" /><rect x="58" y="16" width="14" height="11" /><rect x="25" y="27" width="15" height="10" /><rect x="58" y="27" width="15" height="10" /><rect x="32" y="35" width="12" height="10" /><rect x="54" y="35" width="12" height="10" /><rect x="43" y="38" width="12" height="9" /></g><g fill="#efb937"><rect x="38" y="9" width="11" height="13" /><rect x="49" y="9" width="11" height="13" /><rect x="31" y="20" width="13" height="12" /><rect x="54" y="20" width="13" height="12" /><rect x="38" y="30" width="11" height="11" /><rect x="49" y="30" width="11" height="11" /></g><rect x="39" y="17" width="20" height="17" fill="#76502d" /><rect x="43" y="20" width="12" height="11" fill="#946733" /><rect x="47" y="23" width="5" height="5" fill="#b4863e" /></>}
</>

export default function PlantGrowth({ type = 'pot', stage = 0 }) {
  const label = type === 'mushroom' ? '숲버섯' : type === 'tree' ? '해바라기' : '새싹 화분'
  return (
    <svg className={`plant-art plant-${type} stage-${stage}`} viewBox="0 0 96 96" role="img" aria-label={`${label} 성장 단계 ${stage}`}>
      <g shapeRendering="crispEdges">
        {type === 'pot' && <PotPlant stage={stage} />}
        {type === 'mushroom' && <MushroomPlant stage={stage} />}
        {type === 'tree' && <SunflowerPlant stage={stage} />}
      </g>
    </svg>
  )
}
