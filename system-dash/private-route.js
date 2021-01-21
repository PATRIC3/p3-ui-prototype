import React from 'react'
import {Route, Redirect} from 'react-router-dom'

import { isSignedIn } from '../src/api/auth'

export default function PrivateRoute({ component: Component, ...rest }) {
  const isAuthenticated = isSignedIn()

  return (
    <Route {...rest}
      render={props =>
        isAuthenticated ? <Component {...props} /> : <Redirect to="/sign-in" />
      }
    />
  )
}