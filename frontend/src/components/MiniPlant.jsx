import { memo } from 'react'

const MiniPot = ({ stage }) => <>
  <path d="M5 11h8l-1 6H6z" fill="#ad704f" />
  <rect x="4" y="10" width="10" height="2" fill="#83563f" />
  {stage === 0 && <rect x="8" y="8" width="2" height="2" fill="#72513a" />}
  {stage >= 1 && <><rect x="8" y="5" width="2" height="6" fill="#527953" /><rect x="5" y="5" width="4" height="3" fill="#78a06b" /><rect x="10" y="3" width="4" height="3" fill="#639163" /></>}
  {stage >= 2 && <><rect x="8" y="2" width="2" height="4" fill="#486f4e" /><rect x="4" y="2" width="5" height="4" fill="#80a872" /><rect x="10" y="0" width="5" height="4" fill="#6b9866" /></>}
  {stage >= 3 && <><rect x="4" y="0" width="11" height="7" fill="#6f9d69" /><rect x="7" y="0" width="6" height="9" fill="#81ab73" /></>}
</>

const MiniMushroom = ({ stage }) => <>
  {stage === 0 && <><rect x="8" y="14" width="3" height="2" fill="#a85a50" /><rect x="9" y="16" width="2" height="1" fill="#dfc9a8" /></>}
  {stage >= 1 && <><rect x="8" y="9" width="3" height="8" fill="#e8d6b8" /><path d="M5 10c1-6 8-6 10 0z" fill="#ba524e" /></>}
  {stage >= 2 && <><rect x="3" y="12" width="3" height="5" fill="#e5d2b3" /><path d="M1 13c1-4 7-4 8 0z" fill="#d3755d" /><rect x="12" y="10" width="3" height="7" fill="#e5d2b3" /><path d="M10 11c1-5 7-5 8 0z" fill="#a94847" /></>}
  {stage >= 3 && <><rect x="7" y="6" width="5" height="11" fill="#ead8b8" /><path d="M2 8c1-9 14-9 16 0z" fill="#a94746" /><rect x="6" y="4" width="2" height="2" fill="#f1dfc2" /><rect x="12" y="5" width="2" height="2" fill="#f1dfc2" /></>}
</>

const MiniSunflower = ({ stage }) => <>
  {stage === 0 && <><rect x="8" y="14" width="3" height="2" fill="#674a32" /><rect x="9" y="12" width="2" height="2" fill="#9b7949" /></>}
  {stage >= 1 && <><rect x="8" y="7" width="2" height="10" fill="#50794e" /><rect x="5" y="9" width="4" height="3" fill="#7ba468" /><rect x="10" y="7" width="4" height="3" fill="#6b985d" /></>}
  {stage >= 2 && <><rect x="8" y="5" width="2" height="12" fill="#4e784b" /><rect x="5" y="9" width="4" height="3" fill="#7da567" /><rect x="10" y="7" width="4" height="3" fill="#70a061" /><rect x="6" y="1" width="6" height="5" fill="#d1a337" /></>}
  {stage >= 3 && <><rect x="8" y="6" width="2" height="11" fill="#4c7649" /><rect x="5" y="9" width="4" height="3" fill="#80a76a" /><rect x="10" y="7" width="4" height="3" fill="#70a061" /><g fill="#f0bd3e"><rect x="6" y="0" width="6" height="3" /><rect x="6" y="5" width="6" height="3" /><rect x="3" y="2" width="5" height="4" /><rect x="10" y="2" width="5" height="4" /></g><rect x="6" y="2" width="6" height="4" fill="#80572f" /></>}
</>

function MiniPlant({ type = 'pot', stage = 0 }) {
  return (
    <svg className={`mini-plant mini-stage-${stage}`} viewBox="0 0 18 18" aria-hidden="true" shapeRendering="crispEdges">
      {type === 'pot' && <MiniPot stage={stage} />}
      {type === 'mushroom' && <MiniMushroom stage={stage} />}
      {type === 'tree' && <MiniSunflower stage={stage} />}
    </svg>
  )
}

export default memo(MiniPlant)
