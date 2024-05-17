```JavaScript
// This is a function called transform. As input you are given a hashmap where the keys are of type A and the values are another Hashmap from B to C.  Your goal is to swap the keys so that B is on the outside and the inner maps are from A to C.

// {
//   "Whole Foods": {
//       "Eggs": 4.40,
//       "Cheese": 6.00
//   }, "HEB": {
//        "Salmon": 20.00,
//        "Cheese": 3.00
//     }
// }

const before = {
  "Whole Foods": {
    Eggs: 4.4,
    Cheese: 6.0,
  },
  HEB: {
    Salmon: 20.0,
    Cheese: 3.0,
  },
};

const after = {
  Eggs: {
    "Whole Foods": 4.4,
  },
  Cheese: {
    "Whole Foods": 6.0,
    HEB: 3.0

  },
  Salmon: {
    HEB: 20.0,
  },
};


function transform(before) {
  const stores = Object.entries(before);

  console.log(stores);

  const payload = {};

  stores.forEach((s) => {
    const storeName = s[0]
    console.log('storeName', storeName)
    const storeItems = s[1]

    const storeItemEntries = Object.entries(storeItems)

    storeItemEntries.forEach(entry => {
      const payloadValue = {}

      payloadValue[storeName] = entry[1]

      if(payload[entry[0]]){
        const temp = payload[entry[0]]
        payload[entry[0]] = {
          ...payloadValue,
          ...temp
        }
      } else {
        payload[entry[0]] = payloadValue
      }
    })

  });

  console.log('payload', payload)

  return payload

}

transform(before);
```
