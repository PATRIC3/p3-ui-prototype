import React, {useEffect, useState} from 'react'
import {Link} from 'react-router-dom'
import styled from 'styled-components'

import HelpIcon from '@material-ui/icons/HelpOutlineRounded'
import CaretIcon from '@material-ui/icons/ExpandMoreRounded'
import FolderIcon  from '@material-ui/icons/FolderOutlined'
import MyIcon from '@material-ui/icons/AccountCircleRounded'
import SharedIcon from '@material-ui/icons/PeopleAltRounded'
import PublicIcon from '@material-ui/icons/PublicRounded'
import SpecialFolderIcon from '@material-ui/icons/FolderSpecialRounded'

import {getUser} from '../api/auth'

import UploadStatus from './upload/UploadStatus'


// only for testing
import config from '../config'

const menu = [
  {
    path: `/${getUser(true)}`, label: 'My Workspaces',
    icon: <MyIcon />, caret: true
  }, {
    path: `/${getUser(true)}/home`, label: 'Home',
    indent: 2, icon: <FolderIcon />, caret: true
  }, {
    path: `/${getUser(true)}/home/Genome Groups`, label: 'Genome Groups',
    indent: 3, icon: <SpecialFolderIcon />
  },{
    path: `/${getUser(true)}/home/Feature Groups`, label: 'Feature Groups',
    indent: 3, icon: <SpecialFolderIcon />
  }, {
    path: `/${getUser(true)}/home/Experiment Groups`, label: 'Experiment Groups',
    indent: 3, icon: <SpecialFolderIcon />
  }, {
    path: `/shared-with-me`,
    label: 'Shared with me',
    icon: <SharedIcon />
  }, {
    path: `/public`,
    label: 'Public Workspaces',
    icon: <PublicIcon />
  }, {
    path: `/public/PATRIC@patricbrc.org/PATRIC Workshop`,
    label: 'Sample Data',
    icon: <SpecialFolderIcon />,
    hide: viewType => viewType !== 'objectSelector'
  }
]


type Props = {
  path: string
  viewType: 'jobResult' | 'objectSelector' | 'file'
  onNavigate: (evt: MouseEvent, obj: {path?: string}) => void
}

const WSSideBar = (props: Props) => {
  const {path, viewType, onNavigate} = props

  const [activePath, setActivePath] = useState(path)

  useEffect(() => {
    setActivePath(path)
  }, [path])

  const handleNavigate = (evt, item) => {
    onNavigate(evt, item)
  }

  return (
    <SidebarRoot>
      {viewType != 'objectSelector' &&
        <Title>
          Workspaces
          <sup>
            <P3Link
              href={`${config.p3URL}/workspace/${path}`}
              target="_blank"
            >
              <HelpIcon />
            </P3Link>
          </sup>
        </Title>
      }

      <Menu>
        {menu
          .filter(item => 'hide' in item ? !item.hide(viewType) : true)
          .map(item => {
            return (
              <li key={item.label}>
                <MenuItem
                  indent={item.indent}
                  caret={item.caret ? 1 : 0}
                  className={item.path == activePath ? 'active no-style' : 'no-style hover'}
                  to={`/files${item.path}`}
                  onClick={evt => viewType == 'objectSelector' && handleNavigate(evt, item)}
                >
                  {item.caret &&
                    <Caret><CaretIcon color={item.path == activePath ? 'primary' : 'inherit'} /></Caret>
                  }
                  {item.icon &&
                    <Icon>{React.cloneElement(item.icon, {color: item.path == activePath ? 'primary' : 'inherit'})}</Icon>
                  }
                  {item.label}
                </MenuItem>
              </li>
            )
          })
        }
      </Menu>

      <UploadStatus />

    </SidebarRoot>
  )
}

const sidebarWidth = '210px'

const SidebarRoot = styled.div`
  min-width: ${sidebarWidth};
  padding: 5px 0 10px 0px;
  border-right: 1px solid #ccc;

  .MuiTab-wrapper {
    display: inline-block;
  }

  overflow-y: scroll;
`

const Title = styled.div`
  font-size: 1.2em;
  margin: 10px;
`

const Menu = styled.ul`
  position: relative;
  padding: 0;
  font-size: 1em;
  list-style: none;
`
const indention = 8

const MenuItem = styled(Link)`
  display: flex;
  padding: 5px 0 5px 5px;
  display: flex;
  align-items: center;

  &.active {
    border-right: 3px solid #2e75a3;
    background-color: #f2f2f2;
    font-weight: 900;
  }

  ${props => props.indent &&
    `padding-left: ${props.indent * indention + (!props.caret ? 21 : 0)};`}

  ${props => props.indent &&
    `font-size: .9em`}
`

const Icon = styled.div`
  margin-right: 5px;
`

const Caret = styled.div`
  width: 20px;
  svg {
    width: 20px;
  }
`


const P3Link = styled.a`
  svg { font-size: 1.25em; }
`


export {sidebarWidth}

export default WSSideBar
