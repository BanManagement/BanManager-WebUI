import dynamic from 'next/dynamic'

const Line = dynamic(() => import('@nivo/line').then(m => m.ResponsiveLine), { ssr: false })

const ResponsiveLine = ({ chartData }) => {
  return (
    <Line
      data={chartData}
      enableGridX={false}
      enableGridY={false}
      enablePoints={false}
      pointSize={10}
      pointColor={{ theme: 'background' }}
      pointBorderWidth={2}
      pointBorderColor={{ from: 'serieColor' }}
      colors={{ datum: 'color' }}
      pointLabelYOffset={-12}
      enableArea
      enableCrosshair={false}
      useMesh
      legends={[]}
      tooltip={({ point }) => {
        return (
          <div className='bg-gray-800 text-md text-gray-100 border-gray-700 border-2 rounded-md'>
            <div className=' border-gray-700 border-b-2 p-2'>{point.data.xFormatted}</div>
            <div className='flex items-center p-2'>
              <span className='block h-3 w-3 mr-3' style={{ backgroundColor: point.serieColor }} />
              <div>{point.serieId}: {point.data.yFormatted}</div>
            </div>
          </div>
        )
      }}
    />
  )
}

export default ResponsiveLine
