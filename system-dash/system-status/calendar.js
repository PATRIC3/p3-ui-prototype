import React, {useState, useEffect} from 'react'
import styled from 'styled-components'
import { makeStyles } from '@material-ui/core/styles'

import Subtitle from '../../src/subtitle'
import HeatmapCalendar from '../../lib/heatmap-calendar/src/HeatmapCalendar'

import Chip from '@material-ui/core/Chip'
import MenuButton from '../../lib/menu-button'
import DownloadIcon from '@material-ui/icons/CloudDownloadOutlined'
import MenuItem from '@material-ui/core/MenuItem'


import { downloadFile } from '../utils/download'


const TOTAL_TESTS = 1440

const useStyles = makeStyles(theme => ({
  root: {
  },
  dateFilter: {
    marginLeft: theme.spacing(2)
  }
}))


const getCalendarCSV = (data, type) => {
  const serviceNames = data[data.length - 1].services.map(obj => obj.name)
  const header = ['Date', 'Passed', 'Failed', 'Total', ...serviceNames]

  const rows = data.map(({date, passed, failed, total, services}) => [
    `"${date.toLocaleString()}"`,
    passed,
    failed,
    total,
    ...serviceNames.map(name => {
      const {failed, duration} = services.filter(obj => obj.name == name)[0]

      if (type == 'failed-percents')
        return [(failed / total) * 100]
      else if (type == 'failed-counts')
        return failed
      else if ('durations')
        return duration
    })
  ])

  return [
    header.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
}


const onDownload = (data, type) => {
  downloadFile(getCalendarCSV(data, type), `service-${type}.csv`)
}


const calColorMap = {
  noValue: '#f2f2f2',
  green1: '#b2dfb0',
  green2: '#8ed88b',
  green3: '#4cc948',
  green4: '#06af00',
  red1: '#ffc5c5',
  red2: '#ff8686',
  red3: '#d34848',
  red4: '#890000'
}



const Calendar = ({data, onClick, dataKey, highlightDate}) => {
  let d = new Date()
  let pastYear = d.getFullYear() - 1
  d.setFullYear(pastYear)

  return (
    <HeatmapCalendar
      data={data}
      startDate={d}
      endDate={new Date()}
      highlightDate={highlightDate ? new Date(highlightDate) : null}
      dataKey={dataKey}
      onClick={onClick}
      tooltip={({date, data}) => CalTooltip(date, data, dataKey)}
      histogram={false}
      histogramHeight={100}
      cellW={17}
      cellH={17}
      colorForValue={(val, obj) => {
        if (val == null)
          return calColorMap.noValue

        if (val <= 0)
          return calColorMap.green2
        else if (val <= 5)
          return calColorMap.red1
        else if (val <= 10)
          return calColorMap.red2
        else if (val <= 50)
          return calColorMap.red3
        else if (val > 50)
          return calColorMap.red4
      }}
    />
  )
}


const CalTooltip = (date, data, dataKey) =>
  <div>
    <TTitle>{date.toDateString()}</TTitle>
    {data &&
        <>
          <Count>{data[dataKey]} events</Count>
          {data.total !== TOTAL_TESTS &&
            <Note>
              Note: there were {data.total < TOTAL_TESTS && 'only'} {data.total.toLocaleString()} tests
              this day instead of {TOTAL_TESTS.toLocaleString()}.
            </Note>
          }
        </>
    }
  </div>


const TTitle = styled.div`
  font-size: 1.2em;
  border-bottom: 1px solid #fff;
  padding-bottom: 5px;
  margin-bottom: 5px;
`

const Count = styled.div`
  font-size: 1.2em;
`

const Note = styled.i`
  display: block;
  margin-top: 1em;
`


export default function CalendarPanel(props) {
  const styles = useStyles()

  const {data, onDayClick, highlightDate, filterBy, onDeleteDate, date} = props

  const [openDownloadMenu, setOpenDownloadMenu] = useState(false)
  const [dataKey, setDataKey] = useState('failed')

  useEffect(() => {
    setDataKey(filterBy == 'All' ? 'failed' : filterBy + '_failures')
  }, [filterBy])

  const handleDownload = (type) => {
    setOpenDownloadMenu(false)
    onDownload(data, type)
  }

  return (
    <div>
      <Subtitle noUpper inline>
        Calendar
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

      <MenuButton
        startIcon={<DownloadIcon />}
        label="Download"
        size="small"
        className="pull-right"
        open={openDownloadMenu}
      >
        <MenuItem onClick={() => handleDownload('failed-percents')}>Failure percents</MenuItem>
        <MenuItem onClick={() => handleDownload('failed-counts')}>Failure counts</MenuItem>
        <MenuItem onClick={() => handleDownload('durations')}>Durations</MenuItem>
      </MenuButton>

      {
        data &&
        <Calendar
          data={data}
          onClick={onDayClick}
          highlightDate={highlightDate}
          dataKey={dataKey}
        />
      }
    </div>
  )
}



