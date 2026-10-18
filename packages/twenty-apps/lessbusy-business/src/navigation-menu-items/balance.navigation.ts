import { defineNavigationMenuItem, NavigationMenuItemType } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineNavigationMenuItem({ universalIdentifier: BUSINESS_IDENTIFIERS.balance.navigation, name: "Inventory", icon: "IconPackages", color: 'blue', position: 103, type: NavigationMenuItemType.OBJECT, targetObjectUniversalIdentifier: BUSINESS_IDENTIFIERS.balance.object });
