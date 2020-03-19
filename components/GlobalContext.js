import React, { useState, useContext } from 'react'

const globalStore = (init) => {
  const store = {}

  Object.entries(init).forEach(prop => {
    const [key, value] = prop
    const hook = useState(value)

    store[key] = { get: hook[0], set: hook[1] }
  })

  const get = (path) => {
    try {
      return store[path].get
    } catch {
      console.log(`Invalid path for get(): "${path}"`)
    }
  }
  const set = (path, value) => {
    try {
      return store[path].set(value)
    } catch {
      console.log(`Invalid path for set(): "${path}"`)
    }
  }

  return { get, set }
}

const AppContext = React.createContext({})

export const GlobalStoreProvider = ({ initValues, children }) => (
  <AppContext.Provider value={globalStore(initValues)}>
    {children}
  </AppContext.Provider>
)

export const GlobalStore = () => useContext(AppContext)
