const Leaf = ({ x, y, flip = false, color = '#5f806b' }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
    <rect x="0" y="4" width="8" height="8" fill="#456b57" />
    <rect x="4" y="0" width="8" height="8" fill={color} />
  </g>
)

const PotPlant = ({ stage }) => <>
  <rect x="30" y="73" width="36" height="5" fill="#82634b" /><rect x="34" y="78" width="28" height="10" fill="#9b7454" /><rect x="39" y="88" width="18" height="4" fill="#765641" /><rect x="37" y="69" width="22" height="4" fill="#5f5140" />
  {stage === 0 && <><rect x="45" y="65" width="7" height="4" fill="#50634f" /><rect x="48" y="61" width="4" height="4" fill="#80906c" /></>}
  {stage >= 1 && <><rect x="47" y="43" width="5" height="30" fill="#53705a" /><Leaf x={37} y={49} flip /><Leaf x={52} y={39} /></>}
  {stage >= 2 && <><rect x="47" y="25" width="5" height="20" fill="#48684f" /><Leaf x={36} y={31} flip color="#72906e" /><Leaf x={53} y={22} /></>}
  {stage >= 3 && <><rect x="31" y="22" width="35" height="28" fill="#6f9169" /><rect x="38" y="15" width="21" height="39" fill="#78996f" /><rect x="31" y="25" width="6" height="6" fill="#eee4bd" /><rect x="57" y="30" width="6" height="6" fill="#eee4bd" /></>}
</>

const MushroomPlant = ({ stage }) => <>
  <rect x="22" y="82" width="54" height="6" fill="#617254" /><rect x="30" y="76" width="36" height="7" fill="#87916d" />
  {stage === 0 && <><rect x="46" y="71" width="5" height="5" fill="#d7c8a7" /><rect x="40" y="77" width="4" height="3" fill="#bba783" /></>}
  {stage >= 1 && <><rect x="45" y="62" width="9" height="16" fill="#eadfc5" /><rect x="38" y="55" width="23" height="10" fill="#b95c55" /><rect x="43" y="52" width="13" height="5" fill="#ca6a60" /></>}
  {stage >= 2 && <><rect x="27" y="68" width="7" height="11" fill="#eadfc5" /><rect x="22" y="63" width="17" height="7" fill="#d17a62" /><rect x="64" y="66" width="7" height="13" fill="#eadfc5" /><rect x="59" y="60" width="17" height="8" fill="#b84e4d" /></>}
  {stage >= 3 && <><rect x="40" y="35" width="19" height="43" fill="#eee2c8" /><rect x="29" y="25" width="42" height="18" fill="#b84e4d" /><rect x="37" y="18" width="27" height="11" fill="#cf655d" /><rect x="46" y="63" width="7" height="15" fill="#725a48" /><rect x="38" y="30" width="5" height="5" fill="#f4e7ce" /><rect x="59" y="32" width="6" height="5" fill="#f4e7ce" /></>}
</>

const TreePlant = ({ stage }) => <>
  <rect x="16" y="82" width="64" height="6" fill="#71805d" /><rect x="25" y="77" width="46" height="6" fill="#91a171" />
  {stage === 0 && <><rect x="45" y="72" width="7" height="5" fill="#695848" /><rect x="54" y="75" width="8" height="4" fill="#879083" /></>}
  {stage >= 1 && <><rect x="47" y="51" width="5" height="29" fill="#69513e" /><Leaf x={37} y={55} flip /><Leaf x={52} y={45} /></>}
  {stage >= 2 && <><rect x="44" y="43" width="10" height="37" fill="#79583f" /><rect x="31" y="31" width="36" height="29" fill="#66845e" /><rect x="38" y="24" width="23" height="39" fill="#759368" /></>}
  {stage >= 3 && <><rect x="42" y="37" width="13" height="44" fill="#76533b" /><rect x="21" y="24" width="56" height="36" fill="#63835d" /><rect x="29" y="14" width="40" height="52" fill="#739568" /><rect x="39" y="9" width="21" height="55" fill="#81a06f" /><rect x="29" y="27" width="5" height="5" fill="#e9e1b7" /><rect x="63" y="35" width="5" height="5" fill="#e9e1b7" /></>}
</>

export default function PlantGrowth({ type = 'pot', stage = 0 }) {
  const label = type === 'mushroom' ? '버섯' : type === 'tree' ? '나무' : '화분 식물'
  return (
    <svg className={`plant-art plant-${type} stage-${stage}`} viewBox="0 0 96 96" role="img" aria-label={`${label} 성장 단계 ${stage}`}>
      <g shapeRendering="crispEdges">
        {type === 'pot' && <PotPlant stage={stage} />}
        {type === 'mushroom' && <MushroomPlant stage={stage} />}
        {type === 'tree' && <TreePlant stage={stage} />}
      </g>
    </svg>
  )
}
