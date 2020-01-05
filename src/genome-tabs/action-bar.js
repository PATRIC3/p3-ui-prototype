import React from "react";

import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

import taxonIcon from '../../assets/icons/selection-Taxonomy.svg';


const useStyles = makeStyles({
  icon: {
    height: '30px'
  },
  card: {
    minWidth: 275,
    margin: '10px'
  },
  title: {
    fontSize: 14,
  }
});


export function ActionBar() {
  const classes = useStyles();

  return (
    <Card className={classes.card}>
      <CardContent>

        <Typography className={classes.title} color="textSecondary" gutterBottom>
        <img src={taxonIcon} className={`${classes.icon} green-icon`}/> Taxon View
        </Typography>
      </CardContent>
    </Card>
  );
};