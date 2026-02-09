import React, { useState, useCallback } from 'react'
import StartPage from '../components/StartPage'
import App from '../components/App'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { useAppSelector } from '../hooks/useAppSelector'
import { updateUrl, selectUrl } from '../reducers/app'

const Root = () => {
  const dispatch = useAppDispatch()
  const currentUrl = useAppSelector(selectUrl)
  const [started, setStarted] = useState(false)

  const handleNavigate = useCallback(
    (url: string) => {
      dispatch(updateUrl(url))
      setStarted(true)
    },
    [dispatch]
  )

  if (!started && !currentUrl) {
    return <StartPage onNavigate={handleNavigate} />
  }

  return <App />
}

export default Root
