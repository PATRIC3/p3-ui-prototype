import styled from 'styled-components'

const indentPad = '10px' // 35px ?


const Root = styled.div`
  max-width: ${props => props.small ? '560px' : '960px'};
  background: #fff;
  margin: 50px auto;
  padding: 20px 20px 10px 20px;
  border: 1px solid #ddd;

  input::placeholder {
    font-style: italic;
    font-size: .9em;
  }
`


const Row = styled.div`
  display: flex;
  align-items: flex-end;

  /* don't pad a <Row> component if "noPad" */
  ${props => props.noPad &&
    'margin-bottom: 0px !important;'}
`


const Column = styled.div`
  display: flex;
  flex-direction: column;

  /* pad all <Row> components if "padRows" */
  > div {
    ${props => props.padRows &&
      'margin-bottom: 10px;'}
  }
`


const Section = styled.div`
  display: flex;
  padding: 0  ${props => props.noIndent ? 0 : indentPad};
  margin-bottom: 20px;

  ${props => props.column &&
    'flex-direction: column;'}

  /* pad all <Row> components if "padRows" */
  > div {
    ${props => props.padRows &&
      'margin-bottom: 10px;'}
  }

  /* spaceBetween; usefor for submit buttons */
  ${props => props.spaceBetween &&
    'justify-content: space-between;'}
`


const TableTitle = styled.h5`
  margin: 0 0 10px 0;
  color: rgba(0, 0, 0, 0.87);
  font-weight: 500;
`


export {
  Root, Row, Section, Column,
  TableTitle
}