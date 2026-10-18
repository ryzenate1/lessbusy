import { defineNavigationMenuItem, NavigationMenuItemType } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineNavigationMenuItem({ universalIdentifier: BUSINESS_IDENTIFIERS.warehouse.navigation, name: "Locations", icon: "IconBuildingWarehouse", color: 'blue', position: 102, type: NavigationMenuItemType.OBJECT, targetObjectUniversalIdentifier: BUSINESS_IDENTIFIERS.warehouse.object });
