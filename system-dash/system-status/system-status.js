import React, {useState, useEffect} from 'react'

import { makeStyles } from '@material-ui/core/styles'

import Grid from '@material-ui/core/Grid'
import Paper from '@material-ui/core/Paper'
import Chip from '@material-ui/core/Chip'
import LinearProgress from '@material-ui/core/LinearProgress'
import WarningIcon from '@material-ui/icons/WarningRounded'
import Dialog from '../../src/dialogs/BasicDialog'
import ReBrushChart from '../../src/charts/re-brush-chart'

import { getHealthReport, getCalendar, getIndexerData, getErrorLog } from '../api/log-fetcher'
import LiveStatus from './live-status'
import ErrorMsg from '../../src/ErrorMsg'
import Subtitle from '../../src/subtitle'
import FilterChips from '../../src/utils/ui/chip-filters'
import config from '../config'
import { timeToHumanTime } from '../../src/utils/units'

import CalendarPanel from './calendar'


const HOURS = 24 // number of hours to show into the past

const useStyles = makeStyles(theme => ({
  root: {
  },
  dateFilter: {
    marginLeft: theme.spacing(2)
  }
}))


const getFilters = () => {
  return [
    {type: 'All'},
    ...Object.keys(config).map(key => ({...config[key], type: config[key].label}) )
  ]
}


const BrushChart = ({data, ...props}) =>
  <ReBrushChart data={data}
    brushColor="#2e75a3"
    dataKey="value"
    xDataKey="humanTime"
    xTick={{fontSize: '.8em'}}
    yTick={{fontSize: '.8em'}}
    margin={{top: 20, right: 0, left: -15, bottom: 0}}
    {...props}
  />


const colorBy = (obj) =>
  obj.status == 'P' ? 'rgb(77, 165, 78)' : 'rgb(198, 69, 66)'


const formatData = (data, lastN = HOURS*60) => {
  data = data.map(obj => ({
    humanTime: timeToHumanTime(obj.time), // remove secs
    value: obj.duration,
    ...obj
  })).slice(-lastN)
  return data
}


export default function SystemStatus() {
  const styles = useStyles()

  // genome indexer history data
  const [indexerData, setIndexerData] = useState(null)

  // system health history data
  const [healthData, setHealthData] = useState(null)

  // system health calendar overview
  const [calData, setCalData] = useState(null)

  // the usual loading and error state
  const [loading, setLoading] = useState(false)
  const [error1, setError1] = useState(null)
  const [error2, setError2] = useState(null)
  const [error3, setError3] = useState(null)

  // currently selected service and day state
  const [service, setService] = useState('All')
  const [date, setDate] = useState()
  const [fullDate, setFullDate] = useState()

  // state for displaying error log
  const [errorLog, setErrorLog] = useState(null)

  // fetch genome indexer history
  useEffect(() => {
    getIndexerData().then(data => {
      setIndexerData(formatData(data))
    }).catch(e => setError1(e))
  }, [])


  // fetch health logs whenever service and dates change
  useEffect(() => {
    fetchLog()
  }, [service, date])


  // fetch calendar
  useEffect(() => {
    getCalendar()
      .then(data => setCalData(data))
      .catch(e => setError3(e))
  }, [])


  const fetchLog = () => {
    const serviceFilter = service != 'All' && service

    setLoading(true)
    getHealthReport({service: serviceFilter, date}).then(data => {
      setHealthData(formatData(data, 0))
      setLoading(false)
    }).catch(e => {
      setError2(e)
      setLoading(false)
    })
  }

  const getMax = (data) => Math.max(...data.map(o => o.value))

  const onDayClick = (evt) => {
    if (!evt) return

    const {date} = evt

    const [yyyy, mm, dd] = [
      date.getFullYear(),
      ('0' + (date.getMonth() + 1)).slice(-2),
      ('0' + date.getDate()).slice(-2)
    ]
    const str = `${yyyy}-${mm}-${dd}`
    setDate(str)
    setFullDate(date)
  }

  // Todo: cleanup dates
  const onDeleteDate = () => {
    setDate(null)
    setFullDate(null)
  }

  const onNodeClick = (data) => {
    if (!data) return
    const {status, time} = data.activePayload[0].payload

    // ignore anything that isn't failed status
    if (status != 'F') return

    getErrorLog(time).then(data => {
      setErrorLog(data)
    })
  }

  return (
    <div className={styles.root}>
      <Grid container>
        <Grid container>
          <Grid item xs={4}>
            <LiveStatus onClick={type => setService(type)} />
          </Grid>

          <Grid item xs={8}>
            <Paper className="card" style={{height: 290}}>
              <Subtitle noUpper>Genome Indexer</Subtitle>
              {
                indexerData &&
                <BrushChart data={indexerData}
                  color={'rgb(77, 165, 78)'}
                  units=" genome(s)"
                />
              }
              { error1 && <ErrorMsg error={error1} noContact /> }
            </Paper>
          </Grid>
        </Grid>


        <Grid container item xs={12} direction="column">
          <Grid item>
            <Paper className="card" style={{height: 370}}>
              {loading && <LinearProgress className="card-progress"/>}

              {!error2 &&
                <>
                  <Grid container direction="row" justify="space-between">
                    <Grid item>
                      <Subtitle inline noUpper>
                        Service Health
                      </Subtitle>
                      {
                        date &&
                        <Chip
                          label={date}
                          onDelete={onDeleteDate}
                          color="primary"
                          className={styles.dateFilter}
                        />
                      }
                    </Grid>

                    <Grid item>
                      <FilterChips
                        items={getFilters()}
                        filterState={service}
                        onClick={type => setService(type)}
                      />
                    </Grid>
                  </Grid>

                  {
                    healthData &&
                    <BrushChart data={healthData}
                      yMax={getMax(healthData)}
                      onClick={onNodeClick}
                      colorBy={colorBy}
                      units="ms"
                    />
                  }
                </>
              }

              { error2 && <ErrorMsg error={error2} noContact /> }
            </Paper>
          </Grid>
        </Grid>

        <Grid container>
          <Grid item xs={12}>
            <Paper className="card" style={{height: 225}}>
              <CalendarPanel
                data={calData}
                onDayClick={onDayClick}
                highlightDate={fullDate}
                date={date}
                onDeleteDate={onDeleteDate}
                filterBy={service}
              />
              { error3 && <ErrorMsg error={error3} noContact /> }
            </Paper>
          </Grid>
        </Grid>

      </Grid>

      {errorLog &&
        <Dialog title={<><WarningIcon className="failed"/> Error Log (time is in UTC)</>}
          primaryBtnText="close"
          maxWidth="lg"
          content={<pre>{errorLog}</pre>}
          onClose={() => setErrorLog(false)}
          onPrimaryClick={() => setErrorLog(false)}
        />
      }
    </div>
  )
}

