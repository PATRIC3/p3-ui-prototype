import React, { useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import Button from '@material-ui/core/Button'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'


import ExitIcon from '@material-ui/icons/ExitToApp'
import logo from '../assets/imgs/patric-logo-88h.png'

import * as Auth from '../src/api/auth'
import SignInDialog from '../src/auth/SignInDialog'


const LogoComponent = () =>
  <Link to="/">
    <Logo src={logo} />
    <Version></Version>
  </Link>


const Logo = styled.img`
  margin-bottom: 2px;
  height: 24px;
`

const Version = styled.span`
  font-size: 50%;
  color: #e57200;
  margin-bottom: 20;
`


export function NavBar(props) {
  // const location = useLocation()
  const {isAdminApp, MenuComponent, Logo} = props

  const [openSignIn, setOpenSignIn] = useState(false)

  // accunt menu
  const [anchorEl, setAnchorEl] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchFocus, setSearchFocus] = useState(false)

  /**
   * account menu pieces
   */
  const openAccountMenu = (evt) => {
    setAnchorEl(evt.currentTarget)
    setIsMenuOpen(true)
  }

  const closeMenu = () => {
    setAnchorEl(null)
    setIsMenuOpen(false)
  }

  // used for one-off applications likee the system-status
  const adminAccount = () => (
    <AccountMenu
      anchorEl={anchorEl}
      open={isMenuOpen}
      onClose={closeMenu}
    >
      <MenuItem onClick={Auth.signOut} disableRipple>
        <ExitIcon/> Sign out
      </MenuItem>
    </AccountMenu>
  )

  return (
    <NavBarRoot className="nav-bar">
      <Toolbar variant="dense" style={{height: 38}}>

        {Logo ? <Logo /> : <LogoComponent />}

        {isAdminApp &&
          <MainNav>
            <MenuComponent />
          </MainNav>
        }

        {isAdminApp ?
          adminAccount() :
          (Auth.isSignedIn() ? userAccount() : <></>)
        }
      </Toolbar>

      <SignInDialog open={openSignIn} onClose={() => setOpenSignIn(false)}/>
    </NavBarRoot>
  )
}

const NavBarRoot = styled(AppBar)`
  background: #2e76a3; // #234d69 !important; //
  border-top: 3px solid #154e72; //#234d69;
  position: fixed;
  top: 0;

  & .brand {
    margin-right: 10px;
  }
`

const MainNav = styled.div`
  display: flex;
  margin-left: 5px;
  flex-grow: 1;
  font-size: .9em;
  margin-right: 5px;

  transition: flex cubic-bezier(.32,.77,.47,.86) 0.25s;
  ${props => !props.fullWidth &&
    'flex: 0;'}

  span {
    padding: 0px 3px;
    color: #fff
  }

  .nav-item:hover {
    color: #fff;
  }

  .nav-item.active {
    color: #fff;
    margin-top: -3px;
    border-top: 3px solid #fff;
    transition: all 100ms;
    font-weight: 500;
  }
`

const SignInBtn = styled(Button)`
  margin-bottom: 2px;
  color: #fff;
  height: 30px;

  &:hover {
    background: #157f9d;
  }
`

const AccountMenu = styled(Menu)`
  & svg {
    margin-right: 5;
  }
`


const AccountBtn = styled(Button)`
  &.MuiButtonBase-root {
    min-width: 0px;
  }
`

