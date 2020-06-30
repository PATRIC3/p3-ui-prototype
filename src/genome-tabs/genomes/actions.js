

import React, {useState, useEffect} from 'react';
import styled from 'styled-components'

import Icon from '@material-ui/core/Icon';
import Button from '@material-ui/core/Button';
import GroupIcon from '@material-ui/icons/CollectionsBookmarkOutlined'




export default function Actions({open}) {

  const [show, setShow] = useState(open);

  useEffect(() => {
    setShow(open);
  }, [open])

  return (
    <Root >

      <Button disableRipple>
        <GroupIcon /><br/>
        Group
      </Button>
    </Root>
  )
}


const Root = styled.div`
  background: green;
  width: 80px;
  height: calc(100% - 180px); /* todo: address this by using parent */
  float: right;


  & button {
    color: #fff;
  }
`

