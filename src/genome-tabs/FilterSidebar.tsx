import React, {useState, useEffect, useRef} from 'react'
import styled from 'styled-components'

import Tooltip from '@material-ui/core/Tooltip'
import Button from '@material-ui/core/Button'
import ArrowLeft from '@material-ui/icons/KeyboardArrowLeftRounded'

import applyIcon from '../../assets/icons/apply-perspective-filter.svg'
import plusIcon from '../../assets/icons/plus-circle.svg'

import FilterComponent from './Filter'


const getFacetFields = (state) =>
  Object.keys(state)
    .reduce((acc, k) => getFilterCount(state[k]) > 0 ? [...acc, k] : acc, [])


const getFilterCount = (obj) =>
  Object.keys(obj).filter(k => obj[k]).length


const getORStr = (state, field) =>
  ('or(' +
    Object.keys(state[field])
      .reduce((acc, name) =>
        state[field][name] ?
          [...acc, `eq(${field},"${encodeURIComponent(name.replace(/,/g, '%2C'))}")`] : acc
      , [])
      .join(',') +
  ')').replace(/,*or\(\),*/g, '')


// todo: refactor?  lists may actually be better after all.
const buildFilterString = (state) => {
  let queryStr

  // first get fields that have facet filters
  const fields = getFacetFields(state)

  // eq(field,val)
  if (fields.length == 1 && getFilterCount(state[fields[0]]) == 1) {
    const field = fields[0]
    const [query, _] = Object.entries(state[field])[0]
    queryStr = `eq(${field},"${encodeURIComponent(query.replace(/,/g, '%2C'))}")`

  // or(eq(field,val), ..., eq(field_n,val_n))
  } else if (fields.length == 1) {
    queryStr =
      fields.map(field => getORStr(state, field))
        .join(',')

  // and(or(...), ..., or(...))
  } else {
    queryStr =
      ('and(' +
        fields.map(field => getORStr(state, field))
          .join(',') +
      ')').replace(/,*and\(\),*/g, '')
  }

  return queryStr
}


type Filter = {
  id: string
  label: string
  hideSearch?: boolean
}

type Props = {
  taxonID: string
  core: string
  filters: Filter[]
  onChange: (query: object, queryStr: string) => void
  collapsed: boolean
  onCollapse: (isCollapsed: boolean) => void
  facetQueryStr: string
}


const Sidebar = (props: Props) => {
  const {
    filters,  // list of objects
    onChange,
    onCollapse
  } = props

  if (!onChange)
    throw '`onChange` is required a prop for the sidebar component'

  let didMountRef = useRef(null)

  // {fieldA: {facet1: true, facet2: false}, fieldB: {facet3, facet4}}
  const [query, setQuery] = useState({})

  // and(or(eq(...),...))
  const [queryStr, setQueryStr] = useState(props.facetQueryStr)

  const [collapsed, setCollapsed] = useState(props.collapsed)
  const [showApplyBtn, setShowApplyBtn] = useState(null)

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    const fields = getFacetFields(query)

    // only build string and do callback if necessary
    if (fields.length) {
      const qStr = buildFilterString(query)
      setQueryStr(qStr)
      onChange(query, qStr)
    }

    if (queryStr) {
      setShowApplyBtn(true)
    }
  }, [query, props.facetQueryStr])


  useEffect(() => {
    setCollapsed(props.collapsed)
  }, [props.collapsed])

  const onCheck = ({field, value}) => {
    setQuery(prev => ({
      ...prev,
      [field]: value
    }))
  }


  const onAddFilter = () => {

  }

  const onApplyFilters = () => {

  }

  const handleCollapse = () => {
    setCollapsed(!collapsed)
    onCollapse(!collapsed)
  }

  return (
    <SidebarRoot collapsed={collapsed}>
      <Options>
        <AddFilterBtn>
          <Tooltip title="Add a filter" >
            <Button onClick={onAddFilter} size="small" color="primary" disableRipple>
              <Icon src={plusIcon} /> Add Filter
            </Button>
          </Tooltip>
        </AddFilterBtn>

        {showApplyBtn &&
          <Tooltip title="Apply filters to all views" >
            <Button onClick={onApplyFilters} size="small" color="primary">
              <Icon src={applyIcon} /> Apply
            </Button>
          </Tooltip>
        }
        <CollapseBtn onClick={handleCollapse}>
          <ArrowLeft />
        </CollapseBtn>
      </Options>

      <Container>
        {
          filters.map(({id, label, hideSearch}) =>
            <FilterComponent
              key={id}
              field={id}
              label={label}
              hideSearch={hideSearch}
              onCheck={onCheck}
              facetQueryStr={queryStr}
              {...props}
            />
          )
        }
      </Container>
    </SidebarRoot>
  )
}

const sidebarWidth = '249px'
const optionsHeight = '30px'

const SidebarRoot = styled.div`
  overflow: scroll;
  background: #fff;
  width: ${sidebarWidth};
  border-right: 1px solid #e9e9e9;

  @media (max-width: 960px) {
    display: none;
  }

  ${props => props.collapsed ? 'display: none' : ''}
`

const Container = styled.div`
  margin-top: calc(20px + ${optionsHeight});
`

const Options = styled.div`
  position: fixed;
  height: ${optionsHeight};
  width: ${sidebarWidth};
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  background-image: linear-gradient(to right, rgba(240,240,240,1), rgba(255,255,255,1));
  z-index: 100;
`

const CollapseBtn = styled.a`
  margin-top: 5px;
  color: #444;
`

const AddFilterBtn = styled.div`
  margin-left: 5px;
`

const Icon = styled.img`
  height: 18px;
  margin-right: 5px;
`
export default Sidebar