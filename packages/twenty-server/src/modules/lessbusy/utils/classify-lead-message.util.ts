export const classifyLeadMessage = (content: string) => {
  const message = content.slice(0, 10000).normalize('NFKC').toLowerCase().replace(/[०-९]/g, (digit) => String('०१२३४५६७८९'.indexOf(digit)));
  const contains = (phrases: string[]) => phrases.some((phrase) => message.includes(phrase));
  const sensitive = /\b(refund|fraud|stolen|suicide|self.harm|lawyer|medical|complaint|chargeback|dhamki|dhokha|shikayat)\b/.test(message) || contains(['पैसे वापस', 'धोखा', 'शिकायत', 'आत्महत्या', 'वकील', 'चोरी']);
  const negativeIntent = /\b(not|don't|do not|never|can't|cannot|nahi|nahin|mat)\b.{0,35}\b(buy|order|pay|ready|kharid|kharidna|karna)\b/.test(message) || /\b(buy|order|pay|kharidna|karna)\b.{0,25}\b(nahi|nahin)\b/.test(message) || contains(['नहीं खरीद', 'खरीदना नहीं', 'ऑर्डर नहीं', 'नहीं चाहिए', 'cancel my order', 'cancel the order', 'ऑर्डर रद्द']);
  const explicitPurchase = /\b(ready to (buy|order)|place (an?|the) order|how (do|can) i pay|send (a |the )?payment link|confirm (my |the )?order|i (want|would like) to buy|order confirm kar|payment link bhej|mujhe kharidna hai)\b/.test(message) || contains(['खरीदना चाहता', 'खरीदना चाहती', 'ऑर्डर करना है', 'ऑर्डर कन्फर्म', 'पेमेंट लिंक भेज']);
  const readyToBuy = !negativeIntent && explicitPurchase;
  const interested = /\b(price|cost|available|availability|quote|quotation|stock|interested|delivery|size|model|kitne|kitna|daam|kimat|keemat)\b/.test(message) || contains(['कीमत', 'दाम', 'उपलब्ध', 'डिलीवरी', 'साइज़', 'मॉडल', 'कितने']);
  const urgent = /\b(today|urgent|asap|immediately|tomorrow|aaj|jaldi)\b/.test(message) || contains(['आज', 'तुरंत', 'जल्दी']);
  const quantity = message.match(/(?:^|\s)(\d{1,6})\s*(?:units?|pieces?|items?|pairs?|boxes?|packs?|पीस|यूनिट|डिब्बे|जोड़ी)(?:\s|$|[.,!?])/u);
  const budget = message.match(/(?:\bbudget|\bup to|\bunder|बजट)\s*(?:(?:rs\.?|inr|usd|eur|₹|\$)\s*)?(\d[\d,.]{0,14})/u);
  const product = message.match(/\b(?:interested in|looking for|want to buy)\s+([^\n.!?]{2,150})/);
  const needsClarification = !readyToBuy || negativeIntent;
  return {
    temperature: sensitive ? 'WARM' : readyToBuy ? 'HOT' : interested ? 'WARM' : 'COLD',
    intent: sensitive ? 'Needs human review' : negativeIntent ? 'Purchase intent needs review' : readyToBuy ? 'Purchase' : interested ? 'Product enquiry' : 'Unclear',
    productInterest: product?.[1]?.trim() ?? null,
    requestedQuantity: quantity?.[1] ?? null,
    budget: budget?.[1] ?? null,
    urgency: urgent ? 'URGENT' : 'UNSPECIFIED',
    followUpRequired: true,
    recommendedAction: sensitive ? 'Hand this conversation to a person before replying.' : negativeIntent ? 'Review the customer’s intent before proposing an order or payment.' : readyToBuy ? 'Confirm the requested items and prepare a quotation or order.' : interested ? 'Answer the customer question and confirm their requirements.' : 'Ask a clarifying question about what the customer needs.',
    confidence: sensitive ? 0.95 : readyToBuy ? 0.85 : interested ? 0.65 : 0.35,
    priority: sensitive || (readyToBuy && urgent) ? 'HIGH' : 'NORMAL',
    requiresHumanReview: sensitive || needsClarification,
    classificationSource: 'RULES',
    classifierVersion: 'lessbusy-rules-v2',
    languageSupport: 'English, common Hindi and Hinglish phrases; unrecognized messages require clarification',
  };
};
