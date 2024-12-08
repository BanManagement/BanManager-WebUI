import { Time } from '../../Time'
import { TabGroup, TabList, TabPanel } from '@headlessui/react'
import Tab from '../../Tab'
import TabPanels from '../../TabPanels'
import Badge from '../../Badge'
import clsx from 'clsx'
import AnimatedDisclosure from '../../AnimatedDisclosure'
import { TiTick } from 'react-icons/ti'
import { MdOutlineErrorOutline } from 'react-icons/md'

const HttpHeader = ({ name, value }) => (
  <div className='text-sm'>
    <span className='font-semibold'>{name}: </span>
    {value}
  </div>
)

export default function WebhookDeliveryItem ({ id, content, response, error, created }) {
  const buttonContent = (
    <div className='flex justify-between items-center'>
      <div>
        <div className='text-sm font-bold flex items-center gap-1'>
          {error ? <MdOutlineErrorOutline className='text-red-500' /> : <TiTick className='text-green-500' />}
          #{id}
        </div>
      </div>
      <div>
        <span className='text-sm'><Time timestamp={created} /></span>
      </div>
    </div>
  )
  return (
    <div className='hover:bg-gray-900 group border-b border-gray-700 py-4'>
      <AnimatedDisclosure buttonContent={buttonContent} defaultOpen={false}>
        <TabGroup>
          <TabList>
            <Tab>Request</Tab>
            <Tab>Response {response?.status && (
              <Badge className={clsx({
                'bg-green-500': response.status >= 200 && response.status < 300,
                'bg-red-500': response.status > 299
              })}
              >
                {response.status}
              </Badge>
            )}
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <div className='flex flex-col gap-2'>
                <h2 className='mt-2 text-sm font-bold'>Headers</h2>
                <div className='bg-gray-800 p-2 rounded-lg border-gray-700 border'>
                  <HttpHeader name='Accept' value='application/json' />
                  <HttpHeader name='Content-Type' value='application/json' />
                </div>
                {content && (
                  <>
                    <h2 className='mt-2 text-sm font-bold'>Payload</h2>
                    <div className='bg-gray-800 p-2 rounded-lg border-gray-700 border'>
                      <pre className='text-sm'>{JSON.stringify(JSON.parse(content), null, 2)}</pre>
                    </div>
                  </>
                )}
              </div>
            </TabPanel>
            <TabPanel>
              <div className='flex flex-col gap-2'>
                {response && (
                  <>
                    {response.headers && (
                      <>
                        <h2 className='mt-2 text-sm font-bold'>Headers</h2>
                        <div className='bg-gray-800 p-2 rounded-lg border-gray-700 border'>
                          {Object.keys(response.headers).map((name, index) => (
                            <HttpHeader key={index} name={name} value={response.headers[name]} />
                          ))}
                        </div>
                      </>
                    )}
                    {response.body && (
                      <>
                        <h2 className='mt-2 text-sm font-bold'>Body</h2>
                        <div className='bg-gray-800 p-2 rounded-lg border-gray-700 border'>
                          <pre className='text-sm'>{JSON.stringify(response.body, null, 2)}</pre>
                        </div>
                      </>
                    )}
                  </>
                )}
                {error && (
                  <>
                    <h2 className='mt-2 text-sm font-bold'>Error</h2>
                    <div className='bg-gray-800 p-2 rounded-lg border-gray-700 border'>
                      <pre className='text-sm'>{error?.cause?.message}</pre>
                    </div>
                  </>
                )}
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </AnimatedDisclosure>
    </div>
  )
}
