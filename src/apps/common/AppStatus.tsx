import React, {useState, useEffect} from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import Alert from '@material-ui/lab/Alert'
import AlertTitle from '@material-ui/lab/AlertTitle'



const getErrorMsg = (errorObj) => {
  const res = errorObj.response
  if (res && res.data != '') {
    return res.data.error.message
  } else if (res && 'statusText' in res) {
    return res.statusText
  }
  return null
}


type Props = {
  name: string;
  status: string | {error: object};
}


const AppStatus = ({name, status} : Props) => {
  const [state, setState] = useState(status)

  useEffect(() => {
    // only update if success or error
    if (status != 'success' && !(status instanceof Error))
      return

    setState(status)
  }, [status])


  return (
    <Root>
      {state == 'success' &&
        <Alert severity="success" onClose={() => setState(null)}>
          Your {name} job has been submitted.<br/>
          Check the <Link to="/jobs">Job Status</Link> view for the status.
        </Alert>
      }

      {state instanceof Error &&
        <Alert severity="error" onClose={() => setState(null)}>
          <AlertTitle>Error - There was an issue submitting your job</AlertTitle>
          {getErrorMsg(state)}
        </Alert>
      }
    </Root>
  )
}

const Root = styled.div`

`

export default AppStatus
