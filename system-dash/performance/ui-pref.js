import React, {useState, useEffect, useCallback} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Progress from '@material-ui/core/LinearProgress';
import CheckIcon from '@material-ui/icons/CheckCircleRounded'
import WarningIcon from '@material-ui/icons/WarningRounded'
import IconButton from '@material-ui/core/IconButton'
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

import BarChart from '../../src/charts/bar';
import Table from '../../src/tables/deprecated/mui-table'
import Selector from '../../src/apps/components/Selector';
import { getUIPerfLog } from '../api/log-fetcher'
import { msToTimeStr, timeToHumanTime } from '../../src/utils/units';
import Subtitle from '../../src/subtitle';
import Dialog from '../../src/dialogs/BasicDialog';
import ErrorMsg from '../../src/ErrorMsg';

import HumanTime from '../utils/components/human-time';


const endpoint = 'https://patricbrc.org';
const columns = [
  {
    id: 'ancestorTitles',
    label: 'Test',
    format: (vals, obj) => {
      const {title} = obj
      const parts = title.split(' '),
        path = parts.shift(),
        text = parts.join(' '),
        link = endpoint + path.replace(endpoint, '')
      return (
        <>
          <a target="_blank" href={link}>
            {vals[0]}
          </a>
          <span className="muted"> > {text}</span>
        </>
      )
    }
  }, {
    id: 'last6Mean',
    label: 'Mean of Last 6',
    format: val => val && val != '-' ? msToTimeStr(val) : val
  }, {
    id: 'duration',
    label: 'Duration',
    format: val => msToTimeStr(val)
  }, {
    id: 'status',
    label: 'Status',
    format: (val, obj) => {
      if (val == 'passed')
        return <CheckIcon className="success"/>
      else if (val == 'failed')
        return <FailIcon msg={obj.suiteFailedMsg} />
      return <>??</>
    }
  }
]


const FailIcon = (props) => {
  const failMsg = props.msg
  const [msg, setMsg] = useState(null);

  return (
    <>
      <IconButton onClick={() => setMsg(failMsg)} aria-label="open error dialog" size="small">
        <WarningIcon className="failed"/>
      </IconButton>
      {
        msg &&
        <Dialog title={<><WarningIcon className="failed"/> Error Log</>}
          primaryBtnText="close"
          maxWidth="lg"
          content={<pre>{msg}</pre>}
          onClose={() => setMsg(false)}
          onPrimaryClick={() => setMsg(false)}
        />
      }
    </>
  )
}

// takes test results, returns total "passed"/"failed" times
// for each set of tests
const getPerfMetrics = (data) => {
  const perfMetrics = []
  for (const tests of data) {
    const {startTime} = tests
    const testResults = tests.testResults[0].testResults;

    let passedTime = 0,
      failedTime = 0,
      totalTime = 0
    for (const test of testResults) {
      const {status} = test;
      if (status == 'passed') passedTime += test.duration;
      else if (status == 'failed') failedTime += test.duration;
      totalTime += test.duration;
    }

    perfMetrics.push({
      passedTime,
      failedTime,
      totalTime,
      startTime
    })
  }

  return perfMetrics
}



const Chart = ({data, margin, ...props}) => {
  const [curData, setCurData] = useState(data)
  const [view, setView] = useState('counts')
  const [keys, setKeys] = useState(['passedTime', 'failedTime'])


  useEffect(() => {
    if (view == 'counts')
      setCurData(data)
    else {
      setCurData(() => getPerfMetrics(data))
    }

    if (view == 'counts')
      setKeys(['numPassedTests', 'numFailedTests'])
    else if (view == 'total')
      setKeys(['totalTime'])
    else if (view == 'duration')
      setKeys(['passedTime', 'failedTime'])

  }, [view])


  return (
    <>
      <div className="pull-right">
        <Selector label="view"
          value={view}
          options={[
            {label: 'Status & durations', value: 'duration'},
            {label: 'Status counts', value: 'counts'},
            {label: 'Total duration', value: 'total'},
          ]}
          onChange={v => setView(v)}
          className="pull-right"
        />
      </div>

      <BarChart
        data={curData}
        keys={keys}
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
    </>
  )
}



const useStyles = makeStyles(theme => ({
  root: {}
}));


export default function Tests() {
  const styles = useStyles();

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  // index for currently viewed test results
  const [idx, setIdx] = useState(null)

  // whether or not to substract network idle tiem
  const [subtract, setSubtract] = useState(true)

  const [testResults, setTestResults] = useState(null)
  const [date, setDate] = useState(null)

  // get log
  useEffect(() => {
    setIdx(null)
    getData()
  }, [subtract])

  const getData = () => {
    getUIPerfLog({subtract}).then(data => {
      // set all data
      setData(data)
      setIdx(data.length - 1)
      setLoading(false)
    }).catch(e => {
      setError(e)
      setLoading(false)
    })
  }


  // when idx changes update the current data and date
  useEffect(() => {
    if (!idx) return;

    // separate state is used for currently viewed test results
    // we store the full (suite) failure message in this state
    const curData = data[idx]
    const tests = curData.testResults[0]

    const suiteFailedMsg = tests.failureMessage
    const testResults = tests.testResults.map(test => ({...test, suiteFailedMsg}))

    setTestResults(testResults)
    setDate(curData.startTime)
  }, [idx])


  // when clicking a bar, update idx
  const onNodeClick = (node) => {
    setIdx(() => node.index)
  }

  return (
    <div className={styles.root}>
      <Grid container>

        <Grid container item xs={12} direction="column">

          <Paper className="card" style={{height: 300}}>
            <Subtitle inline noUpper>Performance History</Subtitle>
            { data &&
              <Chart data={data}
                onClick={onNodeClick}
                margin={{bottom: 90, top: 50}}
              />
            }
          </Paper>

          <Paper className="card">
            {loading && <Progress className="card-progress"/>}

            <Subtitle inline noUpper>
              Latest runs
              <small className="muted"> | {date && <HumanTime date={date}/>}</small>
            </Subtitle>

            <FormControlLabel
              className="pull-right"
              control={
                <Switch
                  checked={subtract}
                  onChange={() => setSubtract(!subtract)}
                  color="primary"
                />
              }
              label="minus 500ms"
            />

            { error && <ErrorMsg error={error} noContact /> }

            {testResults &&
              <Table
                columns={columns}
                rows={testResults}
                //expandable={subColumns}
                //expandedRowsKey="testResults"
              />
            }
          </Paper>
        </Grid>
      </Grid>
   </div>
  )
}

