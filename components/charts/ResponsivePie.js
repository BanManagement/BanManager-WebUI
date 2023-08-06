import { createContext, useState } from 'react'
import dynamic from 'next/dynamic'

const Pie = dynamic(() => import('@nivo/pie').then(m => m.ResponsivePie), { ssr: false })

export const PieContext = createContext({
  selectedLabel: null,
  setSelectedLabel: () => {}
})

const CenteredMetric = (props) => {
  const { dataWithArc, centerX, centerY } = props

  return (
    <PieContext.Consumer>
      {({ selectedLabel }) => {
        const datum = dataWithArc.find(datum => datum.label === selectedLabel)

        if (!datum) return null

        return (
          <text
            x={centerX}
            y={centerY}
            textAnchor='middle'
            dominantBaseline='central'
            className='text-white fill-current w-1'
          >
            <tspan x={centerX} y={centerY} dy='-0.5em' className='text-2xl font-bold'>{datum.value}</tspan>
            <tspan x={centerX} y={centerY} dy='0.5em' className='text-sm'>{datum.label}</tspan>
          </text>
        )
      }}
    </PieContext.Consumer>
  )
}

const ResponsivePie = ({ children, chartData, selectedLabel: value }) => {
  const [selectedLabel, setSelectedLabel] = useState(value)

  return (
    <PieContext.Provider value={{ selectedLabel, setSelectedLabel }}>
      <div className='h-64'>
        <Pie
          data={chartData}
          margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
          innerRadius={0.8}
          padAngle={4}
          cornerRadius={12}
          activeOuterRadiusOffset={8}
          colors={{ datum: 'data.color' }}
          enableArcLinkLabels={false}
          enableArcLabels={false}
          legends={[]}
          tooltip={() => (<></>)}
          layers={['arcs', CenteredMetric]}
          onClick={({ label }) => setSelectedLabel(label)}
          onMouseEnter={({ label }) => setSelectedLabel(label)}
        />
      </div>
      {children}
    </PieContext.Provider>
  )
}

export default ResponsivePie
