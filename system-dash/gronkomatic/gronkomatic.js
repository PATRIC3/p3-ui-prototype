import React, {useState, useEffect, useRef, useMemo} from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Select from 'react-select'

import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import Slider from '@material-ui/core/Slider'
import Tooltip from '@material-ui/core/Tooltip'

import PlayIcon from '@material-ui/icons/PlayCircleOutlineRounded'
import ReplayIcon from '@material-ui/icons/ReplayRounded'
import StopIcon from '@material-ui/icons/Stop'

import Subtitle from '../../src/subtitle'
import {months} from '../../src/utils/dates'

import { Paper } from '@material-ui/core'
import { Bar } from '@nivo/bar'
import { AutoSizer } from 'react-virtualized'
import axios from 'axios'

const fieldOptions = [
  { value: 'genus', label: 'Genus' },
  { value: 'isolation_country', label: 'Isolation Country' },
  { value: 'host_name', label: 'Host Name' },
  { value: 'isolation_site', label: 'Isolation Site' },
  { value: 'genome_quality', label: 'Genome Quality' }
]


const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1
  },
  controls: {
    marginTop: theme.spacing(1)
  },
  slider: {

  },
}))

const BarComponent = props => {
  return (
    <g transform={`translate(${props.x},${props.y})`}>
      <rect x={-3} y={7} width={props.width} height={props.height} fill="rgba(0, 0, 0, .07)" />
      <rect width={props.width} height={props.height} fill={props.color} />
      <rect x={props.width - 5} width={5} height={props.height} fill={props.borderColor} fillOpacity={0.2} />
      <text
        x={props.width + 5}
        y={props.height / 2 - 8}
        textAnchor="start"
        dominantBaseline="central"
        fill="black"
        style={{
          fontWeight: 900,
          fontSize: 15,
        }}
      >
        {props.data.indexValue}
      </text>
      <text
        x={props.width + 5}
        y={props.height / 2 + 10}
        textAnchor="start"
        dominantBaseline="central"
        fill={props.borderColor}
        style={{
          fontWeight: 400,
          fontSize: 13,
        }}
      >
        {props.data.value}
      </text>
    </g>
  )
}


const getDayData = (data) => {

  let dayData = Object.keys(data).filter(k => k != 'date').map(k => {
    return {
      name: k,
      value: data[k]
    }
  })

  return dayData.sort((a,b) => a.value - b.value).slice(-15)
}

const renderDay = (date) => {
  const d = new Date(date)

  if (isNaN(d))
    console.error('*** Data sanitization issue: ', date, 'is not valid')

  const [yyyy, mm, dd] = [d.getFullYear(), months[d.getMonth()], d.getDate()]

  return (
    <Grid container>
      <Grid item style={{fontSize: '3.0em', fontWeight: 800}}>{yyyy}</Grid>
      <Grid item style={{margin: '5px 5px'}}>
        <div style={{fontSize: '1.4em'}}>{mm}</div>
        <div>{dd}</div>
      </Grid>
    </Grid>
  )
}


const Chart = (props) => {
  const {data} = props
  return (
    <AutoSizer>
      {({ height, width }) => (
        <Bar
          width={width}
          height={height}
          layout="horizontal"
          margin={{ top: 50, right: 120, bottom: 120, left: 20 }}
          data={data}
          indexBy="name"
          keys={['value']}
          colors={{ scheme: 'spectral' }}
          colorBy="indexValue"
          borderColor={{ from: 'color', modifiers: [['darker', 2.6]] }}
          enableGridX
          enableGridY={false}
          axisTop={{
            format: '~s',
          }}
          axisBottom={{
            format: '~s',
          }}
          axisLeft={null}
          padding={0.3}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.4]] }}
          isInteractive={false}
          barComponent={BarComponent}
          motionStiffness={170}
          motionDamping={26}
          animate={true}
        />
      )
      }
    </AutoSizer>
  )
}

const SliderLabelComponent = (props) => {
  const { children, open, value } = props

  const popperRef = useRef(null)
  useEffect(() => {
    if (popperRef.current) {
      popperRef.current.update()
    }
  })

  return (
    <Tooltip
      PopperProps={{
        popperRef,
      }}
      open={open}
      enterTouchDelay={0}
      placement="top"
      title={value}
    >
      {children}
    </Tooltip>
  )
}

export default function Insights() {
  const styles = useStyles()

  const [allData, setAllData] = useState(null)

  const [play, setPlay] = useState(false)
  const [lastIdx, setLastIdx] = useState(null)
  const [idx, setIdx] = useState(null)

  const [field, setField] = useState({value: 'genus', label: 'Genus'})

  // for changing time series data set
  useEffect(() => {
    axios.get(`/data/by-${field.value}.json`)
      .then(res => {
        const {data} = res
        const lastIdx = data.length - 1
        setAllData(data)
        setLastIdx(lastIdx)

        // start at last index, set to 0 first to force render
        setIdx(0)
        setIdx(lastIdx)
      })
  }, [field])


  // for idx change or if play button is clicked
  useEffect(() => {
    // stop timeout if not playing
    if (!play) return

    const timer = setTimeout(() => {
      const next = idx + 1

      if (next > lastIdx) {
        clearTimeout(timer)
        return
      }

      setIdx(next)
    }, 20)

    return () => clearTimeout(timer)
  }, [idx, play])


  const data = useMemo(() => {
    if (allData) return getDayData(allData[idx])
  }, [idx])

  const date = useMemo(() => {
    if (allData) return allData[idx].date
  }, [idx])

  const replaySim = () => {
    setIdx(0)
    setPlay(true)
  }

  return (
    <div className={styles.root}>
      <Grid container>

        <Grid item xs={8}>

          <Paper className="card" style={{height: 900}}>
            <Grid container justify="space-between">
              <Grid item>
                <Subtitle noUpper>
                  Historical View <small className="muted"> | Genomes by {field.label}</small>
                </Subtitle>
              </Grid>
              <Grid>

              </Grid>
            </Grid>

            <Grid container alignItems="center" justify="space-between" className={styles.controls}>
              <Grid item style={{width: 220}}>
                {date && renderDay(date)}
              </Grid>

              <Grid item xs={5}>
                {idx !== null &&
                  <Slider
                    className={styles.slider}
                    value={idx}
                    getAriaValueText={() => date}
                    aria-labelledby="discrete-slider"
                    onChange={(evt, idx) => setIdx(idx)}
                    min={0}
                    max={lastIdx}
                    valueLabelDisplay="auto"
                    ValueLabelComponent={SliderLabelComponent}
                    valueLabelFormat={i => new Date(allData[i].date).toLocaleDateString('sv-SE')}
                  />
                }
              </Grid>

              <Grid item>
                <Button color="primary"
                  variant="contained"
                  onClick={replaySim}
                  disableRipple
                  style={{marginRight: 5}}
                  disabled={(play && idx !== lastIdx) || idx == 0 }
                >
                  <ReplayIcon/> Replay
                </Button>
                <Button color="primary"
                  variant="contained"
                  onClick={() => setPlay(!play)}
                  disableRipple
                  style={{width: 20}}
                  disabled={lastIdx == idx}
                >
                  {play ? <StopIcon /> : <PlayIcon />}
                  {play ? ' Stop' : ' Play'}
                </Button>
              </Grid>
            </Grid>

            {data && <Chart data={data} /> }
          </Paper>
        </Grid>

        <Grid item xs={4}>
          <Paper className="card" style={{height: 900}}>
            <Select options={fieldOptions}
              value={field}
              onChange={field => setField(field)}
            />
          </Paper>
        </Grid>

      </Grid>
    </div>
  )
}

