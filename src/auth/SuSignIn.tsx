import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'

import SignInForm from './SignInForm'
import SUSignInForm from './SuSignInForm'

import {isSignedIn} from '../api/auth'

const useStyles = makeStyles(theme => ({
  card: {
    maxWidth: 600,
    padding: theme.spacing(2),
    marginTop: theme.spacing(2)
  }
}))


export default function SUSignIn(props) {
  const styles = useStyles()

  return (
    <Grid container justify="center">
      <Paper className={styles.card}>
        {isSignedIn() ? <SUSignInForm /> : <SignInForm />}
      </Paper>
    </Grid>
  )
}