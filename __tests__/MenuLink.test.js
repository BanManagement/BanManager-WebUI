import { mount } from 'enzyme'
import React from 'react'
import renderer from 'react-test-renderer'
import { Menu } from 'semantic-ui-react'
import MenuLink from '../components/MenuLink'

describe('MenuLink', () => {
  it('sets items as active on the same page', () => {
    const mockedRouter = { pathname: '/reports' }
    const link = mount(<MenuLink href='/reports' router={mockedRouter} />)
    const item = link.find(Menu.Item).first()

    expect(item.exists()).toEqual(true)
    expect(item.props().active).toEqual(true)
  })

  it('sets an item as active on a different page', () => {
    const mockedRouter = { pathname: '/foo' }
    const link = mount(<MenuLink href='/reports' router={mockedRouter} />)
    const item = link.find(Menu.Item).first()
    
    expect(item.exists()).toEqual(true)
    expect(item.props().active).toEqual(false)
  })

  it('changes route when items left clicked', () => {
    const mockedRouter = { push: jest.fn() }
    const link = mount(<MenuLink href='/reports' router={mockedRouter}/>)

    link.simulate('click', { button: 0 })

    expect(mockedRouter.push).toBeCalledWith('/reports')
  })

  it('does not change route when non-left clicked', () => { // i.e. testing it allows opening links in new tabs
    const mockedRouter = { push: jest.fn() }
    const link = mount(<MenuLink href='/reports' router={mockedRouter}/>)

    link.simulate('click', { button: 3 })

    expect(mockedRouter.push).not.toBeCalledWith('/reports')
  })
})
