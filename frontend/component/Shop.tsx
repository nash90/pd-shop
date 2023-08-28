import { Box, Container, Divider, Grid, Paper, Toolbar, Typography } from "@mui/material"
import { HeadTagMeta } from "../../../pd-core/frontend/components/layouts/CommonHeadTag"
import PCLayout from "../../../pd-core/frontend/components/layouts/PCLayout"
import { getUserInfoAndGameSettings, useEffectAuth } from "../../../pd-auth/utils/AuthHelpers"
import { useWallet } from "@solana/wallet-adapter-react"
import { useContext, useEffect, useState } from "react"
import { CommonContext } from "../../../pd-core/frontend/contexts/CommonContextProvider"

import { ErrorDialog } from "../../../pd-core/frontend/components/common/ErrorDialog"
import { SmallImageMemo } from "../../../pd-core/frontend/components/common/SmallImage"
import { UserModel } from "../../../pd-core/backend/db/UserModel"
import { buyItemApi, getShopItemsApi } from "../api/ShopApi"
import { ResShop } from "../../backend/type"
import { ShopItemModel } from "../../backend/db/model"
import { ShopItem } from "./ShopItem"
import { handleErrorMessageAlert } from "../../../pd-core/error/errorHelpers"
import { APP_GLOBAL_NAME } from "../../../pd-core/type/constants"

interface ShopPageProps {
  meta: HeadTagMeta
}

const ShopPage: React.FC<ShopPageProps> = (props) => {
  const {
    meta
  } = props 

  const {commonStore, dispatch} = useContext(CommonContext);
  const signwallet = useWallet(); // for signing custom message
  useEffectAuth(signwallet, dispatch)
  const [shopItems, setShopItems] = useState([] as ShopItemModel[])
  // const [abilitySettings, setAbilitySettings] = useState(undefined as unknown as AbilitySettingsModel)

  const [openError, setOpenError] = useState(false)
  const [errorMessages, setErrorMessages] = useState([] as string[])

  useEffect(() => {
    // console.log("auth token got", commonStore.token)
    if(!commonStore.token) {
      return
    }
    updateGameState()
    getShopItems()
    
  }, [commonStore?.token])


  const updateGameState = () => {
    if (signwallet.publicKey) {
      getUserInfoAndGameSettings(signwallet.publicKey.toString(), dispatch)
    }
  }

  const getShopItems = () => {
    const pubKey = signwallet.publicKey
    if (!pubKey) {
      return
    }

    return getShopItemsApi(pubKey.toString()).then((res: ResShop) => {
      setShopItems(res.data || [])
    }).catch((err: Error) => {
      console.log("Error getShopItems", err)
      handleErrorMessageAlert(err, "Unexpected error", setOpenError, setErrorMessages)
    });
  }

  const buyItem = (itemId: string) => {
    const pubKey = signwallet.publicKey
    if (!pubKey) {
      return
    }

    return buyItemApi(pubKey.toString(), itemId).then(() => {
      updateGameState()
      getShopItems()
    }).catch((err: Error) => {
      console.log("Error buyItem", err)
      handleErrorMessageAlert(err, "Unexpected error", setOpenError, setErrorMessages)
    });
  }

  const PlayerInfo: React.FC<{ user: UserModel}> = (props) => {
    const {
      user
    } = props;

    const inlineInfoStyles = {
      display: 'flex',
      alignItems: 'center',
      p: 0.5
    };

    return (
      <>
        <Grid>
          <Paper>
            <Grid sx={inlineInfoStyles}>
              <Typography>Gift Points Balance: &nbsp;&nbsp;{`${user.giftPoints?.toFixed(2) || 0}`}</Typography>
              <SmallImageMemo src="/adventure/small_images/giftpoints_small.png" alt="gift points" />
            </Grid>
            <Grid sx={inlineInfoStyles}>
              <Typography>USD Balance: &nbsp;&nbsp;{`${user.usdBalance?.toFixed(2) || 0}`}</Typography>
            </Grid>
            {/* <Grid sx={inlineInfoStyles}>
              <Typography>Whitelist: &nbsp;&nbsp;{`${user.whitelistBalance || 0}`}</Typography>
            </Grid> */}
            <Divider></Divider>
          </Paper>
        </Grid>
      </>
    )
  }
  
  // const theme = useTheme();
  const styles = {
    shop_container: {
      mt: 2,
    },
  };

  return (
    <PCLayout 
      meta={meta}
      logoText={APP_GLOBAL_NAME}
    >
      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === "light"
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
          height: "100vh",
          overflow: "auto",
        }}
      >
        <Toolbar />
        <ErrorDialog
          openError={openError}
          setOpenError={setOpenError}
          errorMessages={errorMessages}
        />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" component="div" sx={{ mt: 2, mb: 2 }} >Shop</Typography>
          <Paper sx={{ p: 2, mt: 2 }}>
          {commonStore.user && <PlayerInfo user={commonStore.user}/>}
          <Grid sx={styles.shop_container} container spacing={2}>
            {shopItems.length > 0 &&
              shopItems.map((item: ShopItemModel) => (
                <Grid item 
                  xs={12}
                  sm={shopItems.length > 1 ? 6 : 12}
                  md={shopItems.length > 2 ? 4: shopItems.length > 1 ? 6 : 12}
                  key={item.id}
                  sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >
                  <ShopItem item={item} buyItem={buyItem} />
                </Grid>
              ))}
          </Grid>
          </Paper>
        </Container>
      </Box>
    </PCLayout>
  )
}

export default ShopPage