import { mount, shallow } from 'enzyme'
import React from 'react'
import { MockedProvider } from 'react-apollo/test-utils'
import { ApolloProvider } from 'react-apollo'
import { createWaitForElement } from 'enzyme-wait'
import { Search } from 'semantic-ui-react'
import PlayerSearch from '../components/PlayerSearch'

// @TODO Relook at testing withApollo components, currently difficult/impossible
describe.skip('PlayerSearch', () => {
  it('queries players', async () => {
    const mock =
      { request:
        { variables:
            { name: 'conf'
            , limit: 5
            }
        , query: PlayerSearch.query
        , operationName: 'searchPlayers'
        }
      , result:
        { data:
          { searchPlayers:
            [
              { id: 'ae51c849-3f2a-4a37-986d-55ed5b02307f'
              , name: 'confuser'
              , __typename: 'Player'
              }
            ]
          }
        }
      }
    const client = new MockedProvider({ mocks: [ mock ], removeTypename: true })
    const wrapper = shallow(
      <ApolloProvider client={client}>
        <PlayerSearch />
      </ApolloProvider>
    )
    const component = wrapper.dive(PlayerSearch)

    // searchComponent.simulate('change', { target: { value: 'conf' } })
    console.log(component.instance())
    await component.instance().handleSearchChange(null, { value: 'conf' })

    // const waitFor = createWaitForElement('.results')

    // await waitFor(searchComponent)


    // expect(loading).toEqual(false)
    // expect(results.length).toEqual(1)
  })

  it.skip('triggers handleResultSelect', () => {
    const component = mount(<PlayerSearch />)
  })
})
