import React, {useState, useEffect, useCallback} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Progress from '@material-ui/core/LinearProgress';
import CheckIcon from '@material-ui/icons/CheckCircleRounded'
import WarningIcon from '@material-ui/icons/WarningRounded'
import Chip from '@material-ui/core/Chip'

import BarChart from '../../src/charts/bar';
import Table from '../../src/tables/deprecated/mui-table'
import { getEnd2EndLog } from '../api/log-fetcher'
import { msToTimeStr, timeToHumanTime } from '../../src/utils/units';
import Subtitle from '../../src/subtitle';
import Dialog from '../../src/dialogs/BasicDialog';
import ErrorMsg from '../../src/ErrorMsg';

import HumanTime from '../utils/components/human-time';

const columns = [
  {
    id: 'testFilePath',
    label: 'File',
  }, {
    id: 'perfStats',
    label: 'Duration',
    format: obj => msToTimeStr(obj.end - obj.start)
  }, {
    id: 'numPassingTests',
    label: 'Status',
    format: (_, obj) => {
      const {numPassingTests, numFailingTests} = obj
      const total = obj.testResults.length

      if ( numPassingTests == total)
        return <PassChip count={numPassingTests} />
      else if (numFailingTests == total)
        return <FailChip count={numFailingTests} msg={obj.failureMessage}/>
      else return (
        <>
          <PassChip count={numPassingTests} />
          <FailChip count={numFailingTests} msg={obj.failureMessage}/>
        </>
      )
    }
  }
]

const subColumns = [
  {
    id: 'fullName',
    label: 'Name',
    format: (_, obj) => {
      return (
        <span className="muted">
          {obj.ancestorTitles[0]} > {obj.fullName}
        </span>
      )
    }
  }, {
    id: 'duration',
    label: 'Duration',
    format: val => msToTimeStr(val)
  }, {
    id: 'status',
    label: 'Status',
    format: val => {
      if (val == 'passed')
        return <CheckIcon className="success"/>
      else if (val == 'failed')
        return <WarningIcon className="failed"/>
      return <>??</>
    }
  }
]


const PassChip = ({count}) =>
  <Chip style={{color: '#fff', background: '#00b732'}}
    label={`${count} Passed`}
    size="small"
    icon={<CheckIcon style={{color: '#fff', fill: '#006502'}} />}
  />


const FailChip = ({count, msg}) =>
  <Chip style={{color: '#fff', background: '#ce0303'}}
    label={`${count} Failed`}
    size="small"
    icon={<WarningIcon style={{color: '#fff', fill: '#650000'}} />}
    onClick={() => {
      // open dialog when fail chips are clicked
      const event = new CustomEvent('onShowMsg', {detail: msg})
      document.dispatchEvent(event)
    }}
  />




const tickValues = (data, key) => {
  if (data.length > 30)
    return data.map(obj => obj[key]).reverse().filter((_,i) => i % 10 == 0)
  return data.map(obj => obj[key]);
}


const Chart = ({data, margin, ...props}) => {

  return (
    <BarChart
      data={data}
      keys={[ 'numPassedTests', 'numFailedTests']}
      indexBy="startTime"
      margin={{top: 10, right: 20, bottom: 80, left: 40, ...margin}}
      axisLeft={{
        label: 'milliseconds'
      }}
      padding={.5}
      colors={['rgb(77, 165, 78)', 'rgb(198, 69, 66)']}
      axisBottom={{
        tickRotation: 40,
        legendPosition: 'middle',
        legendOffset: 50,
        //tickValues: tickValues(data, 'humanTime')
      }}
      axisBottom={{
        format: v => timeToHumanTime(v)
      }}
      {...props}
    />
  )
}



const useStyles = makeStyles(theme => ({
  root: {}
}));


export default function Tests() {
  const styles = useStyles();

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [date, setDate] = useState(null)
  const [error, setError] = useState(null)

  const [msg, setMsg] = useState(null)

  // get log
  useEffect(() => {
    getEnd2EndLog().then(data => {
      setData(data)
      setDate(data[data.length -1].startTime)
      setLoading(false)
    }).catch(e => {
      setError(e)
      setLoading(false)
    })
  }, [])

  const onOpenDialog = useCallback(event => setMsg(event.detail))

  // event for error log dialog
  useEffect(() => {
    window.addEventListener('onShowMsg', onOpenDialog, true)
    return () => {
      window.removeEventListener('onShowMsg', onOpenDialog, true)
    }
  }, [onOpenDialog])


  const onNodeClick = () => {

  }

  return (
    <div className={styles.root}>
      <Grid container>

        <Grid container item xs={12} direction="column">

          <Paper className="card" style={{height: 300}}>
            <Subtitle noUpper>Test History</Subtitle>
            { data &&
              <Chart data={data}
                onClick={onNodeClick}
                margin={{bottom: 90, top: 50}}
              />
            }
          </Paper>

          <Paper className="card">
            {loading && <Progress className="card-progress"/>}

            <Subtitle noUpper>
              Latest Tests
              <small className="muted"> | {date && <HumanTime date={date}/>}</small>
            </Subtitle>

            { error && <ErrorMsg error={error} noContact /> }

            {data &&
              <Table
                columns={columns}
                rows={data[data.length - 1].testResults}
                expandable={subColumns}
                expandedRowsKey="testResults"
              />
            }
          </Paper>
        </Grid>
      </Grid>

      {msg &&
        <Dialog title={<><WarningIcon className="failed"/> Error Log</>}
          primaryBtnText="close"
          maxWidth="lg"
          content={<pre>{msg}</pre>}
          onClose={() => setMsg(false)}
          onPrimaryClick={() => setMsg(false)}
        />
      }

   </div>
  )
}

