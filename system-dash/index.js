

import React from 'react'
import { BrowserRouter, Switch, Route, NavLink, Redirect, Link} from 'react-router-dom'
import { render } from 'react-dom'

import { NavBar } from './DashNavBar'

import { makeStyles } from '@material-ui/core/styles'
import { createMuiTheme } from '@material-ui/core/styles'
import { ThemeProvider } from '@material-ui/styles'
import Grid from '@material-ui/core/Grid'
import Paper from '@material-ui/core/Paper'
import Button from '@material-ui/core/Button'

import { isSignedIn } from '../src/api/auth'
import AdminSignInForm from '../src/auth/AdminSignIn'
import PrivateRoute from './private-route'

// views
import SystemStatus from './system-status/system-status'
import Performance from './performance/ui-pref'
import Tests from './end2end/tests'
import Gronkomatic from './gronkomatic/gronkomatic'
import NotFound404 from '../src/404'

import '../src/styles/styles.scss'
import './nav-bar.scss'


const colors = {
  primary: '#2e75a3',
  secondary: '#FFA750'
}

const theme = createMuiTheme({
  palette: {
    primary: {
      main: colors.primary
    },
    secondary: {
      main: colors.secondary,
      contrastText: '#dc7216'
    }
  }
})

const useStyles = makeStyles(theme => ({
  root: {
  },
  content: {
    marginTop: 40,
    paddingTop: 10,
    margin: theme.spacing(1)
  },
  card: {
    maxWidth: 600,
    padding: theme.spacing(2),
    marginTop: theme.spacing(2)
  }
}))


const HasAuth = props => isSignedIn() ? [props.children] : <></>

const SystemMenu = () => {
  return (
    <HasAuth>

      <NavLink to="/system-status" className="nav-item" activeClassName="active">
        System Status
      </NavLink>
      <NavLink to="/performance" className="nav-item">
        Performance
      </NavLink>
      <NavLink to="/tests" className="nav-item">
        Tests
      </NavLink>
      {/*<NavLink to="/gronkomatic" className="nav-item">
        Gronkomatic
      </NavLink>*/}
    </HasAuth>
  )
}

const SignIn = () => {
  const styles = useStyles()
  return (
    <Grid container justify="center">
      <Paper className={styles.card}>
        <AdminSignInForm />
      </Paper>
    </Grid>
  )
}

const App = () => {
  const styles = useStyles()

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>

        <NavBar isAdminApp MenuComponent={SystemMenu}/>

        <div className={styles.content}>
          <Switch>
            <Route path="/" exact>
              <Redirect to="/system-status" />
            </Route>
            <Route path="/sign-in" exact component={SignIn} />
            <PrivateRoute path="/system-status" exact component={SystemStatus} />
            <PrivateRoute path="/Performance" exact component={Performance} />
            <PrivateRoute path="/tests" exact component={Tests} />
            <PrivateRoute path="/gronkomatic" exact component={Gronkomatic} />
            <Route path="*" component={NotFound404} />
          </Switch>
        </div>

      </ThemeProvider>
    </BrowserRouter>
  )
}

render(<App />, document.getElementById('app'))


