import { defineNavigationMenuItem, NavigationMenuItemType } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineNavigationMenuItem({ universalIdentifier: BUSINESS_IDENTIFIERS.variant.navigation, name: "Product variants", icon: "IconBarcode", color: 'blue', position: 101, type: NavigationMenuItemType.OBJECT, targetObjectUniversalIdentifier: BUSINESS_IDENTIFIERS.variant.object });
