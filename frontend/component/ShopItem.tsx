import * as React from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { ShopItemModel } from '../../backend/db/model';
import { SmallImageMemo } from '../../../pd-core/frontend/components/common/SmallImage';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, useTheme } from '@mui/material';
import { SOLD_OUT_IMAGE_LINK, getShoppingCurrency } from '../../backend/helper';
import { ShopCurrencyType } from '../../backend/type';

export interface ShopItemProps {
  item: ShopItemModel
  buyItem: (itemId: string) => void
}

export const ShopItem: React.FC<ShopItemProps> = (props) => {
  const {
    item,
    buyItem
  } = props

  const theme = useTheme();

  const styles = {
    button: {
      color: 'white',
      background: 'gray',
      '&:hover': {
        background: theme.palette.grey[700],
      },
      margin: 0,
      p: 1,
      ml: 1
    }
  };
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleBuyItem = () => {
    handleClose();
    buyItem(item.id);
  };

  const soldOut = !item.quantity || item.quantity < 1
  const currency = getShoppingCurrency(item.itemType)

  return (
    <Card sx={{ width: "100%", maxWidth: "300px" }}>
      <CardMedia
        component="img"
        alt="green iguana"
        height="140"
        image={!soldOut? item.imageUrl: SOLD_OUT_IMAGE_LINK}
        sx={{ objectFit: 'contain' }}
      />
      <CardContent sx={{ justifyContent: 'center' }}>
        <Typography gutterBottom variant="h5" component="div" sx={{ textAlign: 'center' }}>
          {item.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          {item.description}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          {`QTY: ${!item.disable? item.quantity || 0 : 0}`}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'center' }}>
        <Button
          sx={styles.button}
          size="small"
          onClick={handleClickOpen}
          disabled={soldOut}
        >
          {
            currency === ShopCurrencyType.USD ?
              <>{soldOut ? `Sold Out $${item.usdPrice}` : `Buy $${item.usdPrice}`} </>
              :
              <>
                {soldOut ? `Sold Out ${item.gpPrice}` : `Buy ${item.gpPrice}`}
                <SmallImageMemo src="/adventure/small_images/giftpoints_small.png" alt="gift points" />
              </>
          }
        </Button>
      </CardActions>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Confirm Purchase</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are going to spend {currency === ShopCurrencyType.USD ? `$${item.usdPrice}` : `${item.gpPrice} gift points`}{' '}
            for {item.name}.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleBuyItem}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}