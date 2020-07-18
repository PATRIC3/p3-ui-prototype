import React, {useState, memo, useEffect} from 'react'
import styled from 'styled-components'

import TableContainer from '@material-ui/core/TableContainer'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TablePagination from '@material-ui/core/TablePagination'
import TableRow from '@material-ui/core/TableRow'

import Checkbox from './checkbox'
import IconButton from '@material-ui/core/IconButton'
import ArrowDown from '@material-ui/icons/ArrowDropDown'
import ArrowRight from '@material-ui/icons/ArrowRight'

import TableSearch from './grid-search'

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


const Cell = props => {
  const {children} = props

  return (
    <TableCell {...props}>
      {children}
    </TableCell>
  )
}


const ExpandCell = ({caret, onCaret}) =>
  <Cell style={{padding: 0}}>
    <IconButton
      onClick={() => onCaret(id)}
      style={{padding: 0}}
      aria-label="expand"
    >
      {caret ? <ArrowDown /> : <ArrowRight />}
    </IconButton>
  </Cell>


const RowCells = ({columns, row}) => {
  return (
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
              {col.format ? col.format(val, row) : val}
            </Cell>
          )
        })
      }
    </>
  )
}


const Row = memo(props => {
  const {
    row,
    columns,
    id,
    expandable,
    onExpand,
    emptyCell,
    checkboxes,
    onCheck,
    checked,
    onDoubleClick
  } = props

  const {rowID} = row
  const [caret, setCaret] = useState(false)

  const onCaret = (id) => {
    setCaret(cur => !cur)
    onExpand(id)
  }

  return (
    <>
      <TableRow hover tabIndex={-1} key={id} onClick={() => onCheck(rowID)} onDoubleClick={onDoubleClick}>
        {emptyCell && <Cell></Cell>}

        {expandable && <ExpandCell caret={caret} onCaret={onCaret} />}

        {checkboxes &&
          <Cell key={id + '-checkbox'} style={{padding: 0}}>
            <Checkbox checked={checked[rowID]} onChange={() => onCheck(rowID)} />
          </Cell>
        }

        <RowCells {...props}/>
      </TableRow>
    </>
  )
}, (prev, next) =>
  prev.row.rowID == next.row.rowID &&
  prev.checked[prev.row.rowID] == next.checked[next.row.rowID]
)


const TableRows = (props) => {
  const {
    rows,
    columns,
    expandable,
    expandedRowsKey,
    checkboxes
  } = props

  const [expanded, setExpanded] = useState({})

  const onExpand = (id) => {
    setExpanded(prev => ({
        ...prev,
        [id]: !(id in prev)
      })
    )
  }

  return (
    <>
      {
        rows.map((row, i) => {

          let subRows = []
          if (expandable && i in expanded) {
            subRows = row[expandedRowsKey].map((row, i) => {
              const k = i+rows.length + 1
              return <Row key={k} row={row} columns={expandable} id={k} emptyCell/>
            })
          }

          return [
            <Row key={i} id={i}
              row={row}
              columns={columns}
              expandable={expandable}
              checkboxes={checkboxes}
              onExpand={onExpand}
              {...props}   /* pass on all other props else! */
            />,
            ...subRows
          ]
        })
      }
    </>
  )
}

const TableHeadComponent = (props) => {
  const {
    expandable,
    checkboxes,
    columns,
    handleSelectAll,
    allSelected
  } = props

  return (
    <TableRow>
      {expandable && <TableCell style={{padding: 0}} />}

      {checkboxes &&
        <TableCell style={{padding: 0}}>
          <Checkbox checked={allSelected} onChange={handleSelectAll} />
        </TableCell>
      }

      {columns.map((col, i) => (
        <TableCell
          key={col.label}
          align={col.type == 'number' ? 'right' : col.align}
          style={{ width: col.width }}
        >
          {col.label}
        </TableCell>
      ))}
    </TableRow>
  )
}

export default function TableComponent(props) {
  const {
    onSearch, pagination, offsetHeight, onClick, onDoubleClick,
    expandable, expandedRowsKey, checkboxes, limit = 200
  } = props

  if (expandable && !expandedRowsKey) {
    throw `Grid component must have prop 'expandedRowsKey' when 'expandable is provided`
  }

  if (pagination && (props.page === undefined || !props.limit)) {
    throw `Grid component must provide 'page' and 'limit' when 'pagination' is used.
      page value was: ${props.page}; limit value was: ${props.limit}.`
  }


  const [rows, setRows] = useState(props.rows)
  const [columns, setColumns] = useState(props.columns)
  const [page, setPage] = useState(props.page)
  const [rowsPerPage, setRowsPerPage] = useState(200)

  // checkbox states
  const [allSelected, setAllSelected] = useState(false)
  const [checkedRows, setCheckedRows] = useState({})


  useEffect(() => {
    setRows(props.rows.map((row, i) => ({...row, rowID: page * limit + i})))
  }, [props.rows])


  const onChangePage = (event, newPage) => {
    setPage(newPage)

    const start = newPage * limit + 1
    props.onPage({page: newPage, start, limit})
  }


  const handleSelectAll = () => {
    rows.forEach(row => {
      setCheckedRows(prev => ({...prev, [row.rowID]: !allSelected}) )
    })

    setAllSelected(prev => !prev)
  }

  const onCheck = (rowID) => {
    if (onClick) onClick(rowID)

    setCheckedRows(prev => ({
      ...prev,
      [rowID]: !(rowID in checkedRows && checkedRows[rowID])
    }))
  }


  return (
    <Root>
      <CtrlContainer>
        <SearchContainer>
          {onSearch &&
            <TableSearch onSearch={onSearch} />
          }
        </SearchContainer>

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
      </CtrlContainer>

      <Container offset={offsetHeight}>
        <Table stickyHeader aria-label="table" size="small">

          <TableHead style={{width: '100%'}}>
            <TableHeadComponent
              handleSelectAll={handleSelectAll}
              allSelected={allSelected}
              {...props}
            />
          </TableHead>

          <TableBody>
            <TableRows
              rows={rows}
              columns={columns}
              checkboxes={checkboxes}
              onCheck={onCheck}
              checked={checkedRows}
              onDoubleClick={onDoubleClick}
              expandable={expandable}
              expandedRowsKey={expandedRowsKey}
            />
          </TableBody>
        </Table>

        {rows.length == 0 &&
          <NoneFoundNotice offset={offsetHeight}>
            No results found.
          </NoneFoundNotice>
        }
      </Container>
    </Root>
  )
}



const Root = styled.div`

`

const CtrlContainer = styled.div`
  margin: 5px 10px;
  display: flex;
  justify-content: space-between;
`

const SearchContainer = styled.div`
  width: 100%;
`

const Pagination = styled(TablePagination)`
  width: 500px;

  & .MuiTablePagination-actions {
    user-select: none;
  }
`

const Container = styled(TableContainer)`
  max-height: ${props => `calc(100% - ${props.offset || '250px'})`};
  width: 100%;

  & td {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 0;
    font-size: .85em;
  }

  & tr:nth-child(odd) {
    background: #fafafa;
  }

  & .MuiTableCell-sizeSmall {
    padding: 6px 24px 6px 2px;
  }
`

const NoneFoundNotice = styled.div`
  height: ${props => `calc(100% - ${props.offset || '500px'})`};
  display: flex;
  justify-content: center;
  align-items: center;
  color: #666;
  font-size: 2.0em;
`
