import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000'
})


const attemptFetch = path =>
  api.get(path).catch(e => false)


const getToday = () => new Date().toISOString().split('T')[0]

const getDayBefore = (date) => {
  const d = new Date(date)
  const dUTC = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()-1,
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds())
  const dayBefore = new Date(dUTC).toISOString().split('T')[0]

  return dayBefore
}

const parseHealthLog = (data, service = null) => {
  const rows = data.trim().split('\n')
  const objs = rows.map(row => JSON.parse(row))

  const records = objs.map(({time, tests}) => {

    // filter by service if requested
    if (service) {
      tests = tests.filter(test => test.name == service)
    }

    return {
      time,
      tests,
      status: tests.filter(test => test.status == 'F').length ? 'F' : 'P',
      duration: tests.reduce((total, test) => test.duration + total, 0)
    }
  })

  return records
}


/**
 * Log API
 */
export function getHealthReport ({service = null, date = null}) {
  date = date || getToday()

  // we'll need to get the day before as well since times are in UTC
  const dayBefore = getDayBefore(date)

  const path = `/results/health`
  const [file1, file2] = [`${path}/health_${dayBefore}.txt`, `${path}/health_${date}.txt`]

  return axios.all([api.get(file1), api.get(file2)])
    .then(([prevDay, day]) => {
      const prevDayLog = parseHealthLog(prevDay.data, service)
      const log = parseHealthLog(day.data, service)

      // concat and take the last 24 hours
      return [...prevDayLog, ...log].slice(-24*60)
    })
}


export function getCalendar() {
  return api.get(`/results/health-calendar.txt`)
    .then(res => {
      let objs
      if (typeof data === 'object') {
        objs = data
      }else {
        const data = res.data.trim()
        const rows = data.split('\n')
        objs = rows.map(row => JSON.parse(row))
      }

      objs = objs.map(obj => {
        const passed = obj.services.map(s => s.passed).reduce((acc, val) => acc + val, 0)
        const failed = obj.services.map(s => s.failed).reduce((acc, val) => acc + val, 0)

        // include service failed count at top level of objs
        let byService = {}
        obj.services.forEach(s => {
          byService[`${s.name}_failures`] = s.failed
        })

        let date = new Date(obj.date)
        date.setDate(date.getDate() + 1)

        return {
          ...obj,
          date,
          passed,
          failed,
          ...byService
        }
      })

      return objs
    })
}


export function getIndexerData() {
  return api.get(`/results/indexer/indexer-status.txt`)
    .then(res => {
      const data = res.data.trim()
      const rows = data.split('\n')
      let objs = rows.map(row => JSON.parse(row))
      objs = objs.map(obj => ({value: obj.genomesInQueue, ...obj}))

      return objs
    })
}


export function getErrorLog(utcTime) {
  const date = utcTime.split('T')[0]
  const year = date.slice(0, date.indexOf('-'))

  return api.get(`/results/health/health-errors_${date}.txt`)
    .then(res => {
      const data = res.data

      // parse out matching error
      const re = new RegExp(`\\[${year}\\-`, 'g')
      const errors = data.split(re)
        .map(err =>`[${year}-${err}`)
        .filter(err => err.includes(utcTime))

      return errors
    })
}


const parseFullTestLog = (data) => {
  if (typeof data === 'object') return [data]
  if (!data) return []

  const rows = data.trim().split('\n')
  const objs = rows.map(row => JSON.parse(row))
  return objs
}


// includes method of getting performance mean
const aggregatePerfLog = ({objs, avgN = 6, subtract = true}) => {
  const avgKey = `last${avgN}Mean`

  // for each set of tests
  let i = objs.length
  while(i--) {
    let testResults = objs[i].testResults[0].testResults

    // if can't compute the average of last N, mark as 'N/A'
    if (i < avgN) {
      testResults = testResults.map(test => ({...test, [avgKey]: '-'}))

    // otherwise add average to each test result
    } else {
      // for each test result
      for (const test of testResults) {
        const title = test.ancestorTitles[0]

        // compute and save average of previous N
        let totalDuration = 0
        let canNotCompute = false
        let k = avgN
        while (k--) {
          const results = objs[i - k].testResults[0].testResults

          const matches = results.filter(t => t.ancestorTitles[0] == title)
          if (!matches.length || matches[0].status !== 'passed') {
            canNotCompute = true
            test[avgKey] = '-'
            break
          }

          totalDuration += matches[0].duration
        }

        if (canNotCompute) continue
        test[avgKey] = totalDuration / avgN - (subtract ? 500 : 0)
      }
    }

    // also subtract idle time if needed
    if (subtract) {
      for (const test of testResults) {
        test.duration = test.duration - (subtract ? 500 : 0)
      }
    }

    objs[i].testResults[0].testResults = testResults
  }

  return objs
}



export function getEnd2EndLog(date = null) {
  date = date || getToday()

  const dayBefore = getDayBefore(date)

  const path = `/results/end2end`
  const [file1, file2] = [`${path}/end2end_${dayBefore}.txt`, `${path}/end2end_${date}.txt`]

  return axios.all([
    attemptFetch(file1),
    attemptFetch(file2)
  ]).then(([prevFile, file]) => {
    const prevData = parseFullTestLog(prevFile.data),
      data = parseFullTestLog(file.data)

    return [...prevData, ...data].slice(-24)
  })
}


export function getUIPerfLog({date = null, subtract = true}) {
  date = date || getToday()

  const dayBefore = getDayBefore(date)

  const path = `/results/performance`
  const [file1, file2] = [`${path}/performance_${dayBefore}.txt`, `${path}/performance_${date}.txt`]

  return axios.all([
    attemptFetch(file1),
    attemptFetch(file2),
  ]).then(([prevFile, file]) => {
    const prevData = parseFullTestLog(prevFile.data),
      data = parseFullTestLog(file.data)

    return aggregatePerfLog({
      objs: [...prevData, ...data].slice(-24),
      subtract
    })
  })
}


export function downloadAllStatus(start, end) {

}
