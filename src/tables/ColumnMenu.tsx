
import React, { useState} from 'react'
import { fade, makeStyles } from '@material-ui/core/styles'
import Popper from '@material-ui/core/Popper'
import AddIcon from '@material-ui/icons/AddCircle'
import CloseIcon from '@material-ui/icons/Close'
import DoneIcon from '@material-ui/icons/Done'
import ChevronDown from '@material-ui/icons/ExpandMoreRounded'

import Autocomplete from '@material-ui/lab/Autocomplete'
import Button from '@material-ui/core/Button'
import InputBase from '@material-ui/core/InputBase'


/* example options
const options = [
  { id: 'genus', label: 'Genus' },
  { id: 'isolation_country', label: 'Isolation Country' },
  { id: 'host_name', label: 'Host Name' },
  { id: 'isolation_site', label: 'Isolation Site' },
  { id: 'genome_quality', label: 'Genome Quality' }
]
*/

const useStyles = makeStyles((theme) => ({
  button: {
    fontSize: 13,
    width: '100%',
    textAlign: 'left',
    paddingBottom: 8,
    color: '#586069',
    fontWeight: 600,
    '&:hover,&:focus': {
      color: '#0366d6',
    },
    '& span': {
      width: '100%',
    },
    '& svg': {
      width: 16,
      height: 16,
    },
  },
  popper: {
    border: '1px solid rgba(27,31,35,.15)',
    boxShadow: '0 3px 12px rgba(27,31,35,.15)',
    borderRadius: 3,
    width: 300,
    zIndex: 100,
    fontSize: 13,
    color: '#586069',
    backgroundColor: '#f6f8fa',
  },
  header: {
    borderBottom: '1px solid #e1e4e8',
    padding: '8px 10px',
    fontWeight: 600,
  },
  inputBase: {
    padding: 10,
    width: '100%',
    borderBottom: '1px solid #dfe2e5',
    '& input': {
      borderRadius: 4,
      backgroundColor: theme.palette.common.white,
      padding: 8,
      transition: theme.transitions.create(['border-color', 'box-shadow']),
      border: '1px solid #ced4da',
      fontSize: 14,
      '&:focus': {
        boxShadow: `${fade(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`,
        borderColor: theme.palette.primary.main,
      },
    },
  },
  paper: {
    boxShadow: 'none',
    margin: 0,
    color: '#586069',
    fontSize: 13,
  },
  option: {
    minHeight: 'auto',
    alignItems: 'flex-start',
    padding: 8,
    '&[aria-selected="true"]': {
      backgroundColor: 'transparent',
    },
    '&[data-focus="true"]': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  popperDisablePortal: {
    position: 'relative',
  },
  iconSelected: {
    width: 17,
    height: 17,
    marginRight: 5,
    marginLeft: -2,
  },
  color: {
    width: 14,
    height: 14,
    flexShrink: 0,
    borderRadius: 3,
    marginRight: 8,
    marginTop: 2,
  },
  text: {
    flexGrow: 1,
  },
  close: {
    opacity: 0.6,
    width: 18,
    height: 18,
  },
}))


type Option = {
  label: string
  id?: string
  hide?: boolean
  type?: string
}

type Props = {
  options: Option[]
  onChange: (opt: Option[]) => void
}

export default function ColumnMenu(props: Props) {
  const {options, onChange} = props

  const classes = useStyles()
  const [anchorEl, setAnchorEl] = useState(null)
  const [value, setValue] = useState(options.filter(obj => !obj.hide))

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = (event, reason) => {
    if (reason === 'toggleInput') {
      return
    }

    // setValue(pendingValue)
    if (anchorEl) {
      anchorEl.focus()
    }
    setAnchorEl(null)
  }


  const open = Boolean(anchorEl)
  const id = open ? 'column-search' : undefined

  return (
    <>
      <Button
        size="small"
        variant="text"
        onClick={handleClick}
        disableRipple
      >
        <AddIcon /> <ChevronDown/>
      </Button>

      <Popper
        id={id}
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        className={classes.popper}
      >
        <div className={classes.header}>Select columns for this view</div>
        <Autocomplete
          open
          onClose={handleClose}
          multiple
          classes={{
            paper: classes.paper,
            option: classes.option,
            popperDisablePortal: classes.popperDisablePortal,
          }}
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue)
            onChange(newValue)
          }}
          disableCloseOnSelect
          disablePortal
          renderTags={() => null}
          noOptionsText="No labels"
          renderOption={(option, { selected }) => (
            <>
              <DoneIcon
                className={classes.iconSelected}
                style={{ visibility: selected ? 'visible' : 'hidden' }}
              />
              <div className={classes.text}>
                {option.label}
              </div>
              <CloseIcon
                className={classes.close}
                style={{ visibility: selected ? 'visible' : 'hidden' }}
              />
            </>
          )}
          options={[...options].sort((a, b) => {
            // Display the selected labels first.
            let ai = value.indexOf(a)
            ai = ai === -1 ? value.length + options.indexOf(a) : ai
            let bi = value.indexOf(b)
            bi = bi === -1 ? value.length + options.indexOf(b) : bi
            return ai - bi
          })}
          getOptionLabel={(option) => option.label}
          renderInput={(params) => (
            <InputBase
              ref={params.InputProps.ref}
              inputProps={params.inputProps}
              autoFocus
              className={classes.inputBase}
            />
          )}
        />
      </Popper>
    </>
  )
}



