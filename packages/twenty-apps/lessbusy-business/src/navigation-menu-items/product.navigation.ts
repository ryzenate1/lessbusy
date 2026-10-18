import { defineNavigationMenuItem, NavigationMenuItemType } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineNavigationMenuItem({ universalIdentifier: BUSINESS_IDENTIFIERS.product.navigation, name: "Products", icon: "IconBox", color: 'blue', position: 100, type: NavigationMenuItemType.OBJECT, targetObjectUniversalIdentifier: BUSINESS_IDENTIFIERS.product.object });
