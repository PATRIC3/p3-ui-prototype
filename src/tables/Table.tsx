import React, {useState, useEffect, useReducer, useRef, useCallback} from 'react'
import styled from 'styled-components'

import TableContainer from '@material-ui/core/TableContainer'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TablePagination from '@material-ui/core/TablePagination'
import TableRow from '@material-ui/core/TableRow'
import Tooltip from '@material-ui/core/Tooltip'

import ArrowDown from '@material-ui/icons/ArrowDropDown'
import ArrowUp from '@material-ui/icons/ArrowDropUp'
import filterIcon from '../../assets/icons/filter.svg'

import ColumnMenu from './ColumnMenu'
import Checkbox from '../forms/Checkbox'
import TableSearch from './TableSearch'
import ActionBtn from './ActionBtn'
import downloadIcon from '../../assets/icons/download.svg'

import selectedReducer from './selectedReducer'

import useClickOutside from '../hooks/useClickOutside'

/*
const exampleColumns = [
  {
    id: '123',
    label: 'foo bar',
    width: '10%'
  }, {
    id: '1234',
    label: 'test',
    width: '200px',
    type: 'number'
  }, {
    id: 'population',
    label: 'Population',
    align: 'right', // or use type: 'number'
    format: value => value.toLocaleString(),
  }
]
*/


const Cell = props =>
  <TableCell {...props}>
    {props.children}
  </TableCell>



const RowCells = ({columns, row}) =>
  <>
    {
      columns.map(col => {
        const val = row[col.id]

        return (
          <Cell
            key={col.id}
            align={col.type == 'number' ? 'right' : col.align}
            style={{width: col.width}}
          >
            {col.format ? col.format(val, row) : (val ? val : '-')}
          </Cell>
        )
      })
    }
  </>

type RowProps = {
  rows: object[]
  columns: object[]
  row: object,
  id: number,
  emptyCell: boolean,
  selected: any, //todo: type
  checkboxes: boolean,
  onSelect?: (id: number, row: object) => void
  onDoubleClick: (row: object) => void
}

const Row = (props: RowProps) => {
  const {
    columns,
    row,
    id,
    emptyCell,
    selected,
    checkboxes,
    onSelect,
    onDoubleClick,
  } = props

  const {rowID} = row

  return (
    <TableRow hover
      tabIndex={-1}
      key={id}
      onClick={() => onSelect(rowID, row)}
      onDoubleClick={() => onDoubleClick(row)}
      selected={selected.ids.includes(rowID)}
    >
      {emptyCell && <Cell></Cell>}

      {checkboxes &&
        <Cell key={id + '-checkbox'} style={{padding: 0}}>
          <Checkbox checked={selected.ids.includes(rowID)} onChange={() => onSelect(rowID, row)}/>
        </Cell>
      }

      <RowCells
        columns={columns}
        row={row}
      />
    </TableRow>
  )
}

Row.displayName = 'TableComponent-Row'


const TableRows = (props) => {
  const {
    rows,
    columns,
    checkboxes
  } = props

  return rows.map((row, i) =>
    <Row key={i} id={i}
      row={row}
      columns={columns}
      checkboxes={checkboxes}
      {...props}   /* pass on all other props else! */
    />
  )
}


const getSortArrow = (colID, sort) =>
  <SortArrow>
    {colID in sort && (sort[colID] == 'dsc' ? <ArrowDown /> : <ArrowUp />)}
  </SortArrow>

const SortArrow = styled.span`
  position: absolute;
  & svg {
    width: .9em;
    height: .9em;
  }
`


const TableHeadComponent = (props) => {
  const {
    checkboxes,
    columns,
    handleSelectAll,
    allSelected,
    enableSorting,
    sortBy,
    handleSort
  } = props

  return (
    <TableRow>
      {/* if table has checkboxes (if table has sslect all checkbox) */}
      {checkboxes &&
        <TableCell style={{padding: 0}}>
          <Checkbox checked={allSelected} onChange={handleSelectAll} />
        </TableCell>
      }

      {/* the main thead parts */}
      {columns.map(col => (
        <TableCell
          key={col.id}
          align={col.type == 'number' ? 'right' : col.align}
          style={{ width: col.width, cursor: enableSorting ? 'pointer' : '' }}
          onClick={() => handleSort(col)}
        >
          {col.label} {getSortArrow(col.id, sortBy)}
        </TableCell>
      ))}
    </TableRow>
  )
}


const parseSort = (str) => ({
  [str.slice(1)]: str.charAt(0) == '-' ? 'dsc' : 'asc'
})


const decodeSort = (sortObj) => {
  if (!sortObj)
    return ''

  const id = Object.keys(sortObj)[0],
    order = sortObj[id]

  return `${order == 'dsc' ? '-' : '+'}${id}`
}


// initial state of columns includes "hide", then shown columns is
// controlled by showColumns (a list of column ids)
const getVisibleColumns = (columns, activeColumns = null) => {
  if (activeColumns) {
    const activeIDs = activeColumns.map(o => o.id)
    return columns.filter(o => activeIDs.includes(o.id))
  }

  return columns.filter(o => !o.hide)
}


type Props = {
  rows: object[]
  columns: object[]
  page?: number | string  // for ajax pagination
  limit?: number          // for ajax pagination
  total?: number          // for ajax pagination
  search?: string
  sort?: object
  emptyNotice?: string
  enableTableOptions?: boolean
  pagination?: boolean
  offsetHeight?: string
  checkboxes?: boolean
  searchPlaceholder?: string
  stripes?: boolean
  onSearch?: (string) => void
  onSort?: (string) => void       // for ajax pagination
  onPage?: (number) => void       // for ajax pagination
  onSelect?: (any) => void        // todo: define
  onDoubleClick?: (any) => void
  onColumnMenuChange?: (any) => void

  openFilters?: boolean
  onOpenFilters?: () => void

  MiddleComponent?: JSX.Element
}



export default function TableComponent(props: Props) {
  const {
    pagination, offsetHeight, checkboxes, emptyNotice,
    MiddleComponent, onSearch, onSort, onSelect, onDoubleClick, onColumnMenuChange,
    enableTableOptions, stripes = true
  } = props

  if (pagination && (props.page === undefined || !props.limit)) {
    throw `Grid component must provide 'page' and 'limit' when 'pagination' is used.
      page value was: ${props.page}; limit value was: ${props.limit}.`
  }

  const tableRef = useRef(null)

  const [rows, setRows] = useState(props.rows.map((row, i) => ({...row, rowID: i})))
  const [columns, setColumns] = useState(getVisibleColumns(props.columns))
  const [page, setPage] = useState(Number(props.page))
  const [sortBy, setSortBy] = useState((props.sort && parseSort(props.sort)) || {})
  const [rowsPerPage] = useState(200)

  // keep state on shown/hidden columns
  // initial columns are defined in `columns` spec.
  const [activeColumns, setActiveColumns] = useState(null)

  // disable user-select when shift+click is happening
  const [userSelect, setUserSelect] = useState(true)

  // selected/checkbox state
  const [allSelected, setAllSelected] = useState<boolean>(false)
  const [selected, dispatch] = useReducer(selectedReducer, {
    lastSelected: null,
    ids: [],
    objs: [],
  })

  useEffect(() => {
    // todo: refactor/cleanup?
    setRows(props.rows.map((row, i) => ({...row, rowID: i})))
  }, [props.rows])


  useEffect(() => {
    setPage(Number(props.page))
  }, [props.page])


  useEffect(() => {
    if (!props.sort) return
    setSortBy(parseSort(props.sort))
  }, [props.sort])


  useEffect(() => {
    setColumns(getVisibleColumns(props.columns, activeColumns))
  }, [activeColumns, props.columns])


  useEffect(() => {
    // only call onSelect after initialization
    if (!tableRef.current) {
      tableRef.current = true
      return
    }

    if (onSelect) onSelect(selected)
  }, [selected])

  // enable/disable userSelect durring ctrl/shift+click
  const handleKeyDown = useCallback(() => {
    if (event.metaKey || event.shiftKey) {
      setUserSelect(false)
    }
  }, [setUserSelect])


  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])


  useClickOutside(tableRef, () => {
    dispatch({type: 'CLEAR' })
  })


  const onChangePage = (event, newPage) => {
    setPage(newPage)
    props.onPage(newPage)
  }

  const handleSelectAll = () => {
    alert('re-implement handleSelectAll')
    setAllSelected(prev => !prev)
  }

  const handleSelect = (rowID, obj) => {
    let type
    if (event.metaKey) {
      type = 'CTRL_SET'
    } else if (event.shiftKey) {
      type = 'SHIFT_SET'
    } else {
      type = 'SET'
    }

    dispatch({type, id: rowID, obj, rows })
    setUserSelect(true)
  }

  const handleSort = (colObj) => {
    const newState = {[colObj.id]: sortBy[colObj.id] == 'asc' ? 'dsc' : 'asc' }
    if (onSort)
      onSort(decodeSort(newState))
  }

  const onColumnChange = (activeCols) => {
    setActiveColumns(activeCols)
    onColumnMenuChange(activeCols)
  }


  return (
    <Root>
      <CtrlContainer>

        { enableTableOptions && props.openFilters &&
          <Tooltip title="Show filters">
            <ActionBtn aria-label="filter" onClick={props.onOpenFilters}>
              <img src={filterIcon} />
              <div>Filters</div>
            </ActionBtn>
          </Tooltip>
        }

        {enableTableOptions &&
          <DownloadContainer>
            <Tooltip title="download">
              <ActionBtn aria-label="download" >
                <img src={downloadIcon} />
                <div>Download</div>
              </ActionBtn>
            </Tooltip>
          </DownloadContainer>
        }

        {onSearch &&
          <TableSearch
            search={props.search}
            onSearch={onSearch}
            enableTableOptions={enableTableOptions}
            searchPlaceholder={props.searchPlaceholder}
          />
        }

        {MiddleComponent &&
          <MiddleComponent />
        }

        {pagination &&
          <Pagination
            labelRowsPerPage={''}
            rowsPerPageOptions={[rowsPerPage]}
            component="div"
            rowsPerPage={200}
            page={page}
            backIconButtonProps={{
              disableRipple: true,
              'aria-label': 'previous page',
            }}
            nextIconButtonProps={{
              disableRipple: true,
              'aria-label': 'next page',
            }}
            count={props.total || (rows && rows.length) || 0}
            onChangePage={onChangePage}
            // onChangeRowsPerPage={handleChangeRowsPerPage}
          />
        }

        {onColumnMenuChange &&
          <ColumnMenu
            columns={props.columns} // all columns
            onChange={onColumnChange}
          />
        }
      </CtrlContainer>

      <Container
        offset={offsetHeight}
        stripes={stripes.toString()}
        userselect={userSelect}
      >
        <Table stickyHeader aria-label="table" size="small" ref={tableRef}>

          <TableHead>
            <TableHeadComponent
              columns={columns}
              allSelected={allSelected}
              handleSelectAll={handleSelectAll}
              checkboxes={checkboxes}
              enableSorting
              sortBy={sortBy}
              handleSort={handleSort}
            />
          </TableHead>

          <TableBody>
            <TableRows
              rows={rows}
              columns={columns}
              checkboxes={checkboxes}
              onSelect={handleSelect}
              selected={selected}
              onDoubleClick={onDoubleClick}
            />
          </TableBody>
        </Table>

        {rows.length == 0 &&
          <NoneFoundNotice offset={offsetHeight}>
            {emptyNotice || 'No results found'}
          </NoneFoundNotice>
        }
      </Container>
    </Root>
  )
}




const Root = styled.div`
`

const CtrlContainer = styled.div`
  border-bottom: 2px solid #f2f2f2;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: left;
`

const DownloadContainer = styled.div`
  margin-right: 10px;
  padding-right: 5px;
  border-right: 2px solid #f2f2f2;
`

const Pagination = styled(TablePagination)`
  justify-self: right;
  flex: 1;

  & .MuiTablePagination-actions {
    user-select: none;
    margin: 0;
  }
`

const Container = styled(TableContainer)`
  /* remove height of control panel */
  max-height: ${props => `calc(100% - ${props.offset || '60px'})`};
  height: 100%;
  width: 100%;

  & td {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 0;
    font-size: 13px;
  }

  ${props => props.stripes != 'false' &&
    `& tr:nth-child(odd) {
      background: #fafafa;
    }`}

  & td.MuiTableCell-sizeSmall {
    padding: 6px 12px 6px 2px;
  }
  & th.MuiTableCell-sizeSmall {
    padding: 1px 15px 6px 2px;
  }

  & tr.MuiTableRow-root:hover {
    background-color: #f5f5f5;
  }

  & tr.MuiTableRow-root.Mui-selected,
  & tr.MuiTableRow-root.Mui-selected:hover {
    background-color: #ecf4fb;
  }

  ${props => !props.userselect &&
    'user-select: none;'}
`

const NoneFoundNotice = styled.div`
  height: ${props => `calc(100% - ${props.offset || '500px'})`};
  display: flex;
  justify-content: center;
  transform: translate(0%, 20%);
  color: #666;
  font-size: 1.5em;
`