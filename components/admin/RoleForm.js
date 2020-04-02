import React, { useEffect, useState } from 'react'
import { cloneDeep, find } from 'lodash-es'
import { Form, Header, Select } from 'semantic-ui-react'
import ErrorMessages from '../ErrorMessages'
import { useApi } from '../../utils'

export default function RoleForm ({ onFinished, query, parseVariables, parentRoles, resources, defaults = {} }) {
  const [loading, setLoading] = useState(false)
  const [variables, setVariables] = useState({})
  const [inputState, setInputState] = useState({
    name: defaults.name || '',
    resources: defaults.resources || resources,
    parent: defaults.parent || parentRoles[0].value
  })

  useEffect(() => setVariables(parseVariables(inputState)), [inputState])

  const { load, data, errors } = useApi({ query, variables }, {
    loadOnMount: false,
    loadOnReload: false,
    loadOnReset: false,
    reloadOnLoad: true
  })

  useEffect(() => setLoading(false), [errors])
  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => data[key] && data[key].id)) onFinished()
  }, [data])

  const onSubmit = (e) => {
    e.preventDefault()
    setLoading(true)

    load()
  }
  const handleChange = async (e, { name, value }) => {
    setInputState({ ...inputState, [name]: value })
  }
  const handlePermissionChange = (e, { name, checked, value }) => {
    // @TODO Better way to do this? React doesn't seem to like deeply nested structures...
    const resources = cloneDeep(inputState.resources)
    const resource = find(resources, { name: name.replace('[]', '') })
    const permission = find(resource.permissions, { name: value })

    permission.allowed = checked

    setInputState({ ...inputState, resources })
  }

  const resourceInputs = resources.map(resource => (
    <React.Fragment key={resource.name}>
      <Header>{resource.name}</Header>
      {resource.permissions.map(permission => (
        <Form.Checkbox
          key={`resource-${resource.name}-${permission.name}`}
          defaultChecked={permission.allowed}
          name={`${resource.name}[]`}
          value={permission.name}
          label={permission.name}
          onChange={handlePermissionChange}
        />
      ))}
    </React.Fragment>
  ))

  return (
    <Form size='large' onSubmit={onSubmit} error loading={loading}>
      <ErrorMessages { ...errors } />
      <Form.Input
        fluid
        required
        placeholder='Name'
        value={inputState.name}
        name='name'
        onChange={handleChange}
      />
      {(!defaults.id || defaults.id > 3) &&
        <Form.Field
          required
          name='parent'
          control={Select}
          options={parentRoles}
          placeholder='Parent Role'
          onChange={handleChange}
          defaultValue={inputState.parent}
        />}
      <Header>Resources</Header>
      {defaults.id === '3' &&
        <p>{inputState.name} has access to all resources</p>}
      {(!defaults.id || defaults.id !== '3') && resourceInputs}
      <Form.Button fluid primary size='large' content='Save' />
    </Form>
  )
}
