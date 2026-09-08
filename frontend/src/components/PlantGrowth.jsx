const Leaf = ({ x, y, flip = false }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
    <rect x="0" y="4" width="8" height="8" fill="#456b57" />
    <rect x="4" y="0" width="8" height="8" fill="#5f806b" />
  </g>
)

export default function PlantGrowth({ stage }) {
  return (
    <svg className={`plant-art stage-${stage}`} viewBox="0 0 96 96" role="img" aria-label="현재 성장 단계 식물">
      <g shapeRendering="crispEdges">
        <rect x="30" y="73" width="36" height="5" fill="#82634b" />
        <rect x="34" y="78" width="28" height="10" fill="#9b7454" />
        <rect x="39" y="88" width="18" height="4" fill="#765641" />
        <rect x="37" y="69" width="22" height="4" fill="#5f5140" />

        {stage === 0 && <><rect x="45" y="64" width="7" height="5" fill="#50634f" /><rect x="48" y="59" width="4" height="5" fill="#80906c" /></>}
        {stage >= 1 && <>
          <rect x="47" y="43" width="5" height="30" fill="#53705a" />
          <Leaf x={37} y={49} flip />
          <Leaf x={52} y={39} />
        </>}
        {stage >= 2 && <>
          <rect x="47" y="24" width="5" height="24" fill="#48684f" />
          <Leaf x={36} y={31} flip />
          <Leaf x={53} y={22} />
          <rect x="32" y="49" width="8" height="8" fill="#72906e" />
          <rect x="60" y="43" width="8" height="8" fill="#638562" />
        </>}
        {stage >= 3 && <>
          <rect x="28" y="24" width="40" height="28" fill="#5f805f" />
          <rect x="34" y="17" width="28" height="42" fill="#6f9169" />
          <rect x="41" y="12" width="14" height="48" fill="#78996f" />
          <rect x="30" y="31" width="6" height="6" fill="#91a979" />
          <rect x="57" y="24" width="6" height="6" fill="#91a979" />
          <rect x="45" y="18" width="5" height="5" fill="#9ab382" />
        </>}
        {stage >= 4 && <>
          <rect x="29" y="22" width="6" height="6" fill="#d9c27a" />
          <rect x="27" y="24" width="10" height="2" fill="#eee4bd" />
          <rect x="31" y="20" width="2" height="10" fill="#eee4bd" />
          <rect x="58" y="32" width="6" height="6" fill="#d9c27a" />
          <rect x="56" y="34" width="10" height="2" fill="#eee4bd" />
          <rect x="60" y="30" width="2" height="10" fill="#eee4bd" />
          <rect x="43" y="12" width="6" height="6" fill="#d9c27a" />
          <rect x="41" y="14" width="10" height="2" fill="#eee4bd" />
          <rect x="45" y="10" width="2" height="10" fill="#eee4bd" />
        </>}
      </g>
    </svg>
  )
}
