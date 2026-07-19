export function getInterpolatedAnswers(language, telemetry) {
  const gatesData = telemetry.gates || [];
  const facilitiesData = telemetry.facilities || [];
  const parkingData = telemetry.parking || [];
  
  const gateA = gatesData.find(g => g.id === 'gate-a') || { name: 'Gate A', waitTime: 3, queueLength: 45 };
  const gateB = gatesData.find(g => g.id === 'gate-b') || { name: 'Gate B', waitTime: 22, queueLength: 330 };
  const restroomN = facilitiesData.find(f => f.id === 'restroom-n') || { name: 'Restroom North', waitTime: 2, status: 'clean' };
  const restroomE = facilitiesData.find(f => f.id === 'restroom-e') || { name: 'Restroom East', waitTime: 15, status: 'cleaning' };
  const foodBazaar = facilitiesData.find(f => f.id === 'food-bazaar') || { name: 'Grand Food Bazaar', waitTime: 18 };
  const cafeExpress = facilitiesData.find(f => f.id === 'cafe-express') || { name: 'Arena Express Cafe', waitTime: 4 };
  
  const parkA = parkingData.find(p => p.id === 'park-a') || { name: 'Parking Zone A', capacity: 1000, occupancy: 860 };
  const parkB = parkingData.find(p => p.id === 'park-b') || { name: 'Parking Zone B', capacity: 1500, occupancy: 750 };
  const parkC = parkingData.find(p => p.id === 'park-c') || { name: 'Parking Zone C', capacity: 800, occupancy: 784 };
  
  const parkACapPct = parkA.capacity ? Math.round((parkA.occupancy / parkA.capacity) * 100) : 86;
  const parkBCapPct = parkB.capacity ? Math.round((parkB.occupancy / parkB.capacity) * 100) : 50;
  const parkCCapPct = parkC.capacity ? Math.round((parkC.occupancy / parkC.capacity) * 100) : 98;

  if (language === 'telugu') {
    return {
      gate: `గేట్ A ఖాళీగా ఉంది (${gateA.waitTime} నిమిషాల నిరీక్షణ). గేట్ B లో భారీ రద్దీ ఉంది (${gateB.waitTime} నిమిషాలు).\n- **కారణం**: గేట్ B అనేది పార్కింగ్ జోన్ B నుండి వచ్చే ప్రధాన ప్రవేశ ద్వారం, దీనివల్ల తనిఖీలలో ఆలస్యం జరుగుతోంది.\n- **విశ్వాసం**: 95%\n- **సిఫార్సు చేసిన చర్య**: గేట్ B ని నివారించండి. తక్షణ ప్రవేశం కోసం గేట్ A లేదా గేట్ D కి వెళ్ళండి.\n- **అంచనా వేసిన ప్రభావం**: క్యూ నిరీక్షణ సమయాన్ని ${Math.max(1, gateB.waitTime - gateA.waitTime)} నిమిషాలు తగ్గిస్తుంది.`,
      seat: "సీట్ A-120 చేరుకోవడానికి: గేట్ A గుండా ప్రవేశించి, లోయర్ టైర్ 1, సెక్షన్ A, వరుస 12 కి వెళ్ళండి.\n- **కారణం**: గేట్ A సెక్షన్ A కి అత్యంత దగ్గరగా ఉంటుంది, ఇది నడక దూరాన్ని తగ్గిస్తుంది.\n- **విశ్వాసం**: 99%\n- **సిఫార్సు చేసిన చర్య**: నేలపై ఉన్న ఆకుపచ్చ గుర్తులను అనుసరించండి.\n- **అంచనా వేసిన ప్రభావం**: దారి వెతుక్కోవడంలో గందరగోళాన్ని తగ్గిస్తుంది.",
      parking: `మేము పార్కింగ్ జోన్ B (తూర్పు) ను సిఫార్సు చేస్తున్నాము.\n- **కారణం**: జోన్ A ${parkACapPct}% మరియు జోన్ C ${parkCCapPct}% నిండి ఉంది, ప్రవేశం ఆలస్యం అవుతోంది.\n- **విశ్వాసం**: 92%\n- **సిఫార్సు చేసిన చర్య**: జోన్ B కి వెళ్ళండి, ఇది ${parkBCapPct}% ఖాళీగా ఉంది.\n- **అంచనా వేసిన ప్రభావం**: వాహన రద్దీని నివారిస్తుంది.`,
      food: `అత్యంత వేగవంతమైన ఎంపిక అరీనా ఎక్స్‌ప్రెస్ కేఫ్ (తూర్పు) (${cafeExpress.waitTime} నిమిషాల నిరీక్షణ).\n- **కారణం**: గ్రాండ్ ఫుడ్ బజార్ (పడమర) లో ఆర్డర్లు ఎక్కువగా ఉన్నాయి (${foodBazaar.waitTime} నిమిషాల నిరీక్షణ).\n- **విశ్వాసం**: 88%\n- **సిఫార్సు చేసిన చర్య**: తూర్పు కాన్‌కోర్స్‌కి వెళ్ళండి.\n- **అంచనా వేసిన ప్రభావం**: క్యూ సమయాన్ని ${Math.max(1, foodBazaar.waitTime - cafeExpress.waitTime)} నిమిషాలు ఆదా చేస్తుంది.`,
      washroom: `సమీపంలోని వాష్‌రూమ్: ${restroomN.name} (టైర్ 1).\n- **కారణం**: ${restroomE.name} (టైర్ 2) శుభ్రత కోసం మూసివేయబడింది (సమయం: ${restroomE.waitTime} నిమిషాలు).\n- **విశ్వాసం**: 94%\n- **సిఫార్సు చేసిన చర్య**: నార్త్ కాన్‌కోర్స్ వాష్‌రూమ్‌ని ఉపయోగించండి (${restroomN.waitTime} నిమిషాల నిరీక్షణ).\n- **అంచనా వేసిన ప్రభావం**: వేగంగా వాష్‌రూమ్ సదుపాయాన్ని అందిస్తుంది.`,
      exit: "ఎగ్జిట్ C చేరుకోవడానికి: సౌత్ టైర్ కారిడార్ గుండా వెళ్ళండి.\n- **కారణం**: ఈ మార్గం స్పష్టంగా ఉంది మరియు వీల్‌చైర్ ర్యాంపులను కలిగి ఉంది.\n- **విశ్వాసం**: 97%\n- **సిఫార్సు చేసిన చర్య**: ఎగ్జిట్ బాణాలను అనుసరించండి.\n- **అంచనా వేసిన ప్రభావం**: ప్రధాన మార్గంలో ఇరుక్కుపోకుండా రక్షిస్తుంది.",
      default: "నేను అరీనామైండ్ AI స్టేడియం సహాయకుడిని.\n- **కారణం**: మీకు మార్గదర్శకత్వం చేయడానికి నేను లైవ్ సెన్సార్లను ఉపయోగిస్తాను.\n- **విశ్వాసం**: 95%\n- **సిఫార్సు చేసిన చర్య**: గేట్లు, పార్కింగ్, వాష్ రూములు, ఆహారం లేదా నిష్క్రమణల గురించి నన్ను అడగండి.\n- **అంచనా వేసిన ప్రభావం**: వేగవంతమైన నిర్ణయాలను ఇస్తుంది."
    };
  }
  
  if (language === 'hindi') {
    return {
      gate: `गेट A खाली है (${gateA.waitTime} मिनट का इंतजार)। गेट B में भारी भीड़ है (${gateB.waitTime} मिनट का इंतजार)।\n- **कारण**: गेट B पार्किंग क्षेत्र B का मुख्य प्रवेश बिंदु है जहां वर्तमान में 90% क्षमता है, जिससे जांच में देरी हो रही है।\n- **विश्वास**: 95%\n- **अनुशंसित कार्रवाई**: गेट B से बचें। तत्काल प्रवेश के लिए गेट A (उत्तर) या गेट D (पश्चिम) पर जाएं।\n- **अपेक्षित प्रभाव**: दर्शकों की कतार के प्रतीक्षा समय को ${Math.max(1, gateB.waitTime - gateA.waitTime)} मिनट तक कम करता है।`,
      seat: "सीट A-120 तक पहुंचने के लिए: गेट A से प्रवेश करें, लोअर टियर 1, सेक्शन A, रो 12 पर जाएं।\n- **कारण**: गेट A सेक्शन A के सबसे नजदीक का प्रवेश द्वार है, जो पैदल चलने की दूरी को कम करता है।\n- **विश्वास**: 99%\n- **अनुशंसित कार्रवाई**: हरे रंग के संकेतों का पालन करें और सेक्शन A, रो 12 पर जाएं।\n- **अपेक्षित प्रभाव**: सीधे मार्ग खोजने में मदद करता है।",
      parking: `हम पार्किंग जोन B (पूर्व) की सिफारिश करते हैं।\n- **कारण**: जोन A ${parkACapPct}% क्षमता पर है और जोन C ${parkCCapPct}% क्षमता पर है, जिससे वाहनों के प्रवेश में देरी हो रही है।\n- **विश्वास**: 92%\n- **अनुशंसित कार्रवाई**: जोन B की तरफ जाएं जो ${100 - parkBCapPct}% खाली है।\n- **अपेक्षित प्रभाव**: मुख्य प्रवेश द्वारों पर वाहनों की भीड़ को रोकता है।`,
      food: `सबसे तेज़ विकल्प एरिना एक्सप्रेस कैफे (पूर्व) है जहां ${cafeExpress.waitTime} मिनट का इंतजार है।\n- **कारण**: ग्रैंड फूड बाजार (पश्चिम) में आदेशों की मात्रा अधिक है (${foodBazaar.waitTime} मिनट का इंतजार)।\n- **विश्वास**: 88%\n- **अनुशंसित कार्रवाई**: त्वरित स्नैक्स के लिए पूर्व कॉन्कोर्स पर जाएं।\n- **अपेक्षित प्रभाव**: कतार में लगने वाले समय को ${Math.max(1, foodBazaar.waitTime - cafeExpress.waitTime)} मिनट बचाता है।`,
      washroom: `निकटतम शौचालय: ${restroomN.name} (टियर 1)।\n- **कारण**: ${restroomE.name} (टियर 2) निर्धारित सफाई के लिए बंद है (${restroomE.waitTime} मिनट का समय)।\n- **विश्वास**: 94%\n- **अनुशंसित कार्रवाई**: उत्तर कॉन्कोर्स शौचालय पर जाएं (${restroomN.waitTime} मिनट का इंतजार)।\n- **अपेक्षित प्रभाव**: सफाई की कमी को दूर करता है।`,
      exit: "एक्जिट C तक पहुंचने के लिए: दक्षिण टियर कॉरिडोर से जाएं.\n- **कारण**: यह मार्ग भीड़भाड़ से मुक्त है और व्हीलचेयर के अनुकूल है।\n- **विश्वास**: 97%\n- **अनुशंसित कार्रवाई**: एक्जिट C की ओर बढ़ते हुए हरे तीरों का पालन करें।\n- **अपेक्षित प्रभाव**: मुख्य निकास मार्ग पर भीड़भाड़ से बचाता है।",
      default: "मैं एरिनामैंड AI स्टेडियम सहायक हूँ।\n- **कारण**: मैं दर्शकों के मार्गदर्शन के लिए लाइव सेंसर डेटा का विश्लेषण करता हूँ।\n- **विश्वास**: 95%\n- **अनुशंसित कार्रवाई**: मुझसे गेट, पार्किंग, शौचालय, भोजन, या निकासी के बारे में पूछें।\n- **अपेक्षित प्रभाव**: तत्काल निर्णय प्रदान करता है।"
    };
  }

  // Default to English, Tamil, Kannada
  return {
    gate: `${gateA.name} is clear (${gateA.waitTime}m wait). ${gateB.name} has heavy congestion (${gateB.waitTime}m wait).\n- **Reasoning**: Gate B is the main entry point for Parking Zone B which is currently at ${parkBCapPct}% capacity, leading to check bottlenecks.\n- **Confidence**: 95%\n- **Recommended Action**: Avoid Gate B. Proceed to ${gateA.name} or Gate D for immediate entry.\n- **Expected Impact**: Reduces spectator queue wait time by ${Math.max(1, gateB.waitTime - gateA.waitTime)} minutes, balancing flow rates across stadium arches.`,
    seat: "To reach Seat A-120: Enter through Gate A, go to Lower Tier 1, Section A, Row 12.\n- **Reasoning**: Gate A is the closest entry point to Section A, minimizing indoor navigation distance and walking steps.\n- **Confidence**: 99%\n- **Recommended Action**: Follow the green floor signs and walk to Section A, Row 12.\n- **Expected Impact**: Enables direct path finding, reducing wayfinding confusion and unnecessary detour distance.",
    parking: `We recommend Parking Zone B (East).\n- **Reasoning**: Zone A (North) is at ${parkACapPct}% capacity and Zone C is at ${parkCCapPct}% capacity, causing vehicle entry queues.\n- **Confidence**: 92%\n- **Recommended Action**: Drive to Zone B, which is only ${parkBCapPct}% occupied with an 8-minute walk to concourse gates.\n- **Expected Impact**: Prevents vehicle congestion at main entries, saving approximately 12 minutes of parking search time.`,
    food: `Fastest option is ${cafeExpress.name} (East) with a ${cafeExpress.waitTime}-minute wait.\n- **Reasoning**: ${foodBazaar.name} (West) is experiencing a peak order volume (${foodBazaar.waitTime}-minute wait).\n- **Confidence**: 88%\n- **Recommended Action**: Go to the East concourse for quick concessions at ${cafeExpress.name}.\n- **Expected Impact**: Saves ${Math.max(1, foodBazaar.waitTime - cafeExpress.waitTime)} minutes in line, distributing food service demand evenly across vendors.`,
    washroom: `Nearest restroom: ${restroomN.name} (Tier 1).\n- **Reasoning**: ${restroomE.name} (Tier 2) is closed for scheduled cleaning (wait: ${restroomE.waitTime}m).\n- **Confidence**: 94%\n- **Recommended Action**: Proceed to the North concourse washroom (${restroomN.waitTime}m wait).\n- **Expected Impact**: Restores sanitation access quickly without waiting at congested queues.`,
    exit: "To reach Exit C: Proceed through the south tier corridor.\n- **Reasoning**: This pathway is clear of congestion and is fully wheelchair-accessible.\n- **Confidence**: 97%\n- **Recommended Action**: Follow the green exit arrows toward Exit C.\n- **Expected Impact**: Avoids main concourse bottlenecks, allowing a safe and accessible exit flow.",
    default: "I am ArenaMind AI, your Stadium Assistant.\n- **Reasoning**: I analyze live sensor data to guide spectators.\n- **Confidence**: 95%\n- **Recommended Action**: Ask me about gates, parking, restrooms, food, exits, or seat coordinates.\n- **Expected Impact**: Delivers immediate AI-optimized decisions to improve stadium logistics."
  };
}
