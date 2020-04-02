import React from 'react'
import DefaultLayout from '../components/DefaultLayout'
import PageLayout from '../components/PageLayout'
import HTML from '../components/HTML'

const availableComponents = {
  HTML
}

export default function Page () {
  return (
    <DefaultLayout title='Statistics'>
      <PageLayout
        availableComponents={availableComponents}
        pathname='statistics'
      />
    </DefaultLayout>
  )
}
