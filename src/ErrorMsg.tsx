import React, {useState} from 'react'
import {AxiosError} from 'axios'
import ContactDialog from './outreach/contact-dialog'
import Alert from '@material-ui/lab/Alert'


const parseConfigURL = (error) => {
  try {
    return error && 'config' in error && 'url' in error.config && `: ${error.config.url}`
  } catch(e) {
    return ''
  }
}

const parseTraceback = (res) => {
  try {
    if (res && 'data' in res)
      return <pre>{JSON.stringify(res.data, null, 4)}</pre>
  } catch(e) {
    return ''
  }
}

type Props = {
  error: AxiosError
  noContact?: boolean
}

export default function ErrorMsg(props: Props) {
  const [open, setOpen] = useState(false)
  const {error, noContact} = props

  const res = error.response


  let msg

  try {
    if (res && res.data != '' && res.data.error) {
      msg = res.data.error.message
    } else if (res && 'statusText' in res) {
      msg = res.statusText
    } else {
      msg = ''
    }
  } catch(e) {
    msg = ''
  }

  msg = msg.replaceAll('_ERROR_', '')


  return (
    <>
      <Alert severity="error" style={{wordBreak: 'break-all'}}>
        {'message' in error && error.message}
        {msg && ` - ${msg}`}


        {parseConfigURL(error)}

        {/* for data api errors */
          parseTraceback(res)
        }

        {!noContact &&
          <p>
            Please <a onClick={() => setOpen(true)}>contact us</a> to be notified when this issue is resolved.
          </p>
        }
      </Alert>

      <ContactDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}

