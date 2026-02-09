import React from 'react'
import ReactDOM from 'react-dom'
import Root from './containers/Root'
import theme from './theme'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import store from './store'
import { Provider } from 'react-redux'

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <Provider store={store}>
      <CssBaseline />
      <Root />
    </Provider>
  </ThemeProvider>,
  document.getElementById('RESPONSIVE-VIEWER-ROOT')
)
