import { defineNavigationMenuItem, NavigationMenuItemType } from 'twenty-sdk/define';
import { BUSINESS_IDENTIFIERS } from 'src/constants/universal-identifiers';
export default defineNavigationMenuItem({ universalIdentifier: BUSINESS_IDENTIFIERS.quotation.navigation, name: "Quotations", icon: "IconFileText", color: 'blue', position: 106, type: NavigationMenuItemType.OBJECT, targetObjectUniversalIdentifier: BUSINESS_IDENTIFIERS.quotation.object });
