```javascript
/**
 * ## Programming Challenge: Fibonacci Character Frequency Tracker
 *
 * ### Overview
 * Your task is to complete a program that processes a large block of text (provided as `LOREM`) and extracts characters whose frequency of occurrence matches a Fibonacci number. The program uses Zustand, a state management library, and includes a custom utility to check if a number is a Fibonacci number.
 *
 * ### Starting Code
 * The starting code is partially implemented. Key functions and data structures are outlined but require completion.
 *
 * ### Requirements
 * 1. **Fibonacci Number Checker (`isFibonacci`)**: Implement a function that determines if a given number is a Fibonacci number.
 *
 * 2. **Character Frequency Tracking (`onCharacterChange`)**:
 *    - Update the `characterMap` each time a character is encountered.
 *    - Check if the frequency of the current character is a Fibonacci number.
 *    - Ensure that each Fibonacci number and character is used only once.
 *
 * 3. **Alpha Character Checker (`isAlpha`)**: Implement a function to check if a character is an alphabetic letter.
 *
 * 4. **Text Processing (`processText`)**:
 *    - Split `LOREM` into individual characters.
 *    - Filter out non-alphabetic characters.
 *    - Process each character using `useCurrentCharacterStore`.
 *
 * 5. **Output**: After processing `LOREM`, output a string composed of characters whose frequencies are Fibonacci numbers.
 *
 * ### Additional Information
 * - The `fibUsedSet` and `letterUsedSet` are used to track used Fibonacci numbers and characters, respectively.
 * - The `useFibonacciStore` is a Zustand store for accumulating the output string.
 *
 * ### Evaluation Criteria
 * - Correctness: The program should correctly identify and output characters with Fibonacci frequency.
 * - Efficiency: The implementation should handle large texts efficiently.
 * - Code Quality: Code should be clean, well-commented, and follow best practices.
 *
 * ### Submission Instructions
 * Complete the functions as per the requirements and run the `run()` function to test your code. Ensure your solution is well-tested for various scenarios. Submit your completed TypeScript file.
 *
 */

const LOREM = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Nunc mi ipsum faucibus vitae aliquet nec ullamcorper sit. In cursus turpis massa tincidunt dui ut ornare. Diam vel quam elementum pulvinar. Ac odio tempor orci dapibus ultrices in iaculis nunc. Ut sem viverra aliquet eget sit amet tellus. Ut faucibus pulvinar elementum integer enim neque volutpat ac. Id leo in vitae turpis massa. Arcu ac tortor dignissim convallis aenean et tortor at risus. Et leo duis ut diam quam nulla porttitor massa. Sodales ut eu sem integer vitae justo eget magna fermentum. Convallis a cras semper auctor neque vitae tempus quam pellentesque. Sem viverra aliquet eget sit amet tellus cras. Vel fringilla est ullamcorper eget nulla facilisi. Aliquet enim tortor at auctor urna nunc id. Accumsan lacus vel facilisis volutpat. Vestibulum lorem sed risus ultricies tristique nulla. Lorem ipsum dolor sit amet consectetur adipiscing elit.
Enim ut sem viverra aliquet eget sit amet tellus cras. Et malesuada fames ac turpis egestas. Quis hendrerit dolor magna eget est lorem ipsum. Id porta nibh venenatis cras sed felis eget. Eget lorem dolor sed viverra ipsum nunc aliquet. Porttitor rhoncus dolor purus non enim praesent elementum. Blandit aliquam etiam erat velit scelerisque in dictum non consectetur. Posuere lorem ipsum dolor sit amet. Ipsum faucibus vitae aliquet nec. Molestie ac feugiat sed lectus vestibulum. Ante in nibh mauris cursus mattis.
Elementum nisi quis eleifend quam adipiscing vitae proin. Augue mauris augue neque gravida in fermentum. Hendrerit dolor magna eget est lorem ipsum dolor. Tempus egestas sed sed risus pretium quam vulputate dignissim. Nullam vehicula ipsum a arcu cursus vitae congue mauris rhoncus. Tellus integer feugiat scelerisque varius morbi enim nunc. Pellentesque eu tincidunt tortor aliquam nulla. Metus dictum at tempor commodo ullamcorper a lacus. Neque viverra justo nec ultrices dui sapien. Auctor neque vitae tempus quam pellentesque. Aenean sed adipiscing diam donec adipiscing. Nunc aliquet bibendum enim facilisis gravida. Eu consequat ac felis donec et. Aenean et tortor at risus. Malesuada fames ac turpis egestas maecenas pharetra convallis. Pretium vulputate sapien nec sagittis. Cursus vitae congue mauris rhoncus aenean vel elit scelerisque mauris.
Nibh mauris cursus mattis molestie a iaculis. Mollis nunc sed id semper risus in hendrerit gravida rutrum. Semper auctor neque vitae tempus quam pellentesque nec nam. At risus viverra adipiscing at in tellus integer. Imperdiet sed euismod nisi porta lorem mollis. Molestie a iaculis at erat pellentesque adipiscing. Nullam ac tortor vitae purus faucibus. Lorem dolor sed viverra ipsum nunc aliquet bibendum enim facilisis. Parturient montes nascetur ridiculus mus mauris vitae. Condimentum lacinia quis vel eros donec ac odio. Eu lobortis elementum nibh tellus molestie nunc. Et molestie ac feugiat sed lectus vestibulum mattis ullamcorper velit. Euismod quis viverra nibh cras pulvinar mattis nunc sed. Laoreet suspendisse interdum consectetur libero. Cursus eget nunc scelerisque viverra mauris in aliquam sem. A scelerisque purus semper eget duis at tellus at. Non blandit massa enim nec. Sit amet luctus venenatis lectus magna fringilla urna. Tincidunt lobortis feugiat vivamus at augue eget.
Amet porttitor eget dolor morbi non arcu risus quis. Faucibus vitae aliquet nec ullamcorper. Scelerisque eu ultrices vitae auctor eu. Euismod in pellentesque massa placerat. Faucibus scelerisque eleifend donec pretium. Sed libero enim sed faucibus turpis in. Quis enim lobortis scelerisque fermentum. Placerat in egestas erat imperdiet sed euismod nisi porta. Semper feugiat nibh sed pulvinar proin gravida hendrerit. Vel elit scelerisque mauris pellentesque. Cursus mattis molestie a iaculis.
`

const { create } = require('zustand')

function isFibonacci(num) {
  const isPerfectSquare = x => {
    const s = Math.floor(Math.sqrt(x))
    return s * s === x
  }
  return isPerfectSquare(5 * num * num + 4) || isPerfectSquare(5 * num * num - 4)
}

const fibUsedSet = new Set()
const letterUsedSet = new Set()
const useFibonacciStore = create(set => ({
  data: [],
  add: (char, freq) => set(state => ({ data: [...state.data, { char, freq }] })),
}))

function onCharacterChange(char) {
  if (!characterMap[char]) characterMap[char] = 0
  characterMap[char]++

  const freq = characterMap[char]
  if (isFibonacci(freq) && !fibUsedSet.has(freq) && !letterUsedSet.has(char)) {
    fibUsedSet.add(freq)
    letterUsedSet.add(char)
    useFibonacciStore.getState().add(char, freq)
  }
}

function isAlpha(char) {
  return /^[a-zA-Z]$/.test(char)
}

const characterMap = {}

function processText() {
  const text = LOREM.replace(/\s+/g, '')
  const useCurrentCharacterStore = create(set => ({
    char: '',
    setChar: newChar => set({ char: newChar }),
  }))

  useCurrentCharacterStore.subscribe(({ char }) => onCharacterChange(char))

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (isAlpha(char)) {
      useCurrentCharacterStore.getState().setChar(char)
    }
  }
}

function run() {
  processText()
  const results = useFibonacciStore.getState().data
  const outputString = results.map(item => item.char).join('')
  console.log(outputString)
}

run()
```
