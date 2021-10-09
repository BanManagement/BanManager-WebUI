import { useEffect, useState } from 'react'
import { GraphQLClient } from 'graphql-request'
import { useRouter } from 'next/router'
import { formatDistance, fromUnixTime } from 'date-fns'
import useSWR from 'swr'
import { toPairs } from 'lodash-es'

export const absoluteUrl = (req, localhostAddress = 'localhost:3000') => {
  let host =
    (req?.headers ? req.headers.host : window.location.host) || localhostAddress
  let protocol = /^localhost(:\d+)?$/.test(host) ? 'http:' : 'https:'

  if (
    req &&
    req.headers['x-forwarded-host'] &&
    typeof req.headers['x-forwarded-host'] === 'string'
  ) {
    host = req.headers['x-forwarded-host']
  }

  if (
    req &&
    req.headers['x-forwarded-proto'] &&
    typeof req.headers['x-forwarded-proto'] === 'string'
  ) {
    protocol = `${req.headers['x-forwarded-proto']}:`
  }

  return {
    protocol,
    host,
    origin: protocol + '//' + host
  }
}

const graphQLClient = new GraphQLClient('/graphql', {
  credentials: 'include'
})

const graphqlFetcher = (query, ...args) => {
  // Creates an object. Odd indexes are keys and even indexes are values.
  // Needs to be flat to avoid unnecessary rerendering since swr does shallow comparison.
  const variables = [...(args || [])].reduce((acc, arg, index, arr) => {
    if (index % 2 === 0) acc[arg] = arr[index + 1]
    return acc
  }, {})

  return graphQLClient.request(query, variables)
}

export const useApi = (operation) => {
  const variables = toPairs(operation.variables).flat()
  const { data, error, mutate } = useSWR([operation.query, ...variables], graphqlFetcher)
  const loading = !data && !error
  const errors = error?.response?.errors

  return { data, errors, loading, mutate }
}

export const useMutateApi = (operation) => {
  const [loading, setLoading] = useState(false)
  const [state, setState] = useState({ data: null, errors: null })
  const load = async (variables) => {
    const flatVars = toPairs(variables).flat()

    setLoading(true)

    try {
      const data = await graphqlFetcher(operation.query, ...flatVars)

      setState({ ...state, data })
    } catch (error) {
      setState({ ...state, errors: error?.response?.errors })
    }

    setLoading(false)
  }

  return { load, loading, ...state }
}

const userFetcher = () =>
  fetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      query: `{ me {
    id
    name
    hasAccount
    session {
      type
    }
    resources {
      name
      permissions {
        name
        allowed
        serversAllowed
      }
    }
  }}`
    })
  })
    .then((r) => r.json())
    .then(({ data }) => {
      return { user: data?.me || null }
    })

export const useUser = ({
  redirectTo = false,
  redirectIfFound = false
} = {}) => {
  const router = useRouter()
  const { data } = useSWR('/api/user', userFetcher)
  const user = data?.user
  const finished = Boolean(data)
  const hasUser = Boolean(user)
  const hasPermission = (resource, permission) => {
    if (!user) return false

    const foundResource = user.resources.find(r => r.name === resource)

    if (!foundResource) {
      console.warn(`Resource ${foundResource} not found`)
      return false;
    }

    const foundPermission = foundResource.permissions.find(p => p.name === permission)

    return foundPermission?.allowed || false
  }
  const hasServerPermission = (resource, permission, serverId, any = false) => {
    if (!user) return false

    const foundResource = user.resources.find(r => r.name === resource)

    if (!foundResource) {
      console.warn(`Resource ${resource} not found`)
      return false;
    }

    const foundPermission = foundResource.permissions.find(p => p.name === permission)

    if (!foundPermission) {
      console.warn(`Permission ${permission} not found in resource ${resource}`)
      return false
    }

    if (any && foundPermission.serversAllowed.length) return true

    return foundPermission.serversAllowed && foundPermission.serversAllowed.include(serverId) || false
  }

  useEffect(() => {
    if (!redirectTo || !finished) return

    if (
      // If redirectTo is set, redirect if the user was not found.
      (redirectTo && !redirectIfFound && !hasUser) ||
      // If redirectIfFound is also set, redirect if the user was found
      (redirectIfFound && hasUser)
    ) {
      router.push(redirectTo)
    }
  }, [redirectTo, redirectIfFound, finished, hasUser])

  return { user, hasPermission, hasServerPermission }
}

export const fromNow = (timestamp) => {
  try {
    return formatDistance(fromUnixTime(timestamp), new Date(), { addSuffix: true })
  } catch (e) {
    console.error(e)

    return timestamp
  }
}

export const currentVersion = () => {
  let versionStr = 'unknown'

  if (process.env.GIT_COMMIT) versionStr = process.env.GIT_COMMIT

  return versionStr
}
