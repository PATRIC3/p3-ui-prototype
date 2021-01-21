import React, {useState, useEffect, useContext} from 'react'
import styled from 'styled-components'

import Grid from '@material-ui/core/Grid'
import LinearProgress from '@material-ui/core/LinearProgress'
import Paper from '@material-ui/core/Paper'
import { Typography } from '@material-ui/core'
import { LiveStatusProvider, LiveStatusContext } from '../live-status-context'
import CircularProgress from '@material-ui/core/CircularProgress'
import CheckIcon from '@material-ui/icons/CheckCircleRounded'
import WarningIcon from '@material-ui/icons/WarningRounded'

import config from '../config'


const LiveRows = (props) => {
  const [state, time] = useContext(LiveStatusContext)

  useEffect(() => {
    props.afterUpdate(time)
  }, [time, state])

  return (
    <>
      {Object.keys(config).map(key => (
        <tr key={key}>
          <td width="100%">
            <a onClick={() => props.onClick(config[key].label)}>
              {config[key].label}
            </a>
          </td>
          <td align="right" style={{position: 'relative'}}>
            {key in state && state[key] && <CheckIcon className="success" />}
            {key in state && !state[key] &&  <WarningIcon className="failed" />}

            {/* also indicate thereafter */}
            {
              (key in state && state[key] == 'loading') &&
              <LoadingCircle>
                <CircularProgress size={28} />
              </LoadingCircle>
            }
          </td>
        </tr>
      )
      )}
    </>
  )
}


const LoadingCircle = styled.span`
  position: absolute;
  right: 3;
  top: 2;
`

export default function LiveStatus(props) {
  const [time, setTime] = useState(null)

  return (
    <Paper className="card">
      {!time && <LinearProgress className="card-progress"/>}
      <Grid container justify="space-between" alignItems="center">
        <Grid item>
          <Typography variant="h6">
            Live Status {time && <small className="muted">| as of {time}</small>}
          </Typography>
        </Grid>
      </Grid>

      <table className="simple dense">
        <thead>
          <tr>
            <th>Service</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <LiveStatusProvider>
            <LiveRows
              afterUpdate={(time) => setTime(time)}
              onClick={type => props.onClick(type)}
            />
          </LiveStatusProvider>
        </tbody>
      </table>
    </Paper>
  )
}
