// Types
interface LeetDictionary {
  [key: string]: string;
}

interface LeetConfig {
  activeChars: Set<string>;
}

// Full leet dictionary with all possible conversions
const leetDictionary: LeetDictionary = {
  // Letters
  'a': '4',
  'b': '8',
  'c': '[',
  'd': '|)',
  'e': '3',
  'f': 'ph',
  'g': '6',
  'h': '|-|',
  'i': '1',
  'j': '_|',
  'k': '|<',
  'l': '|',
  'm': '|\\/|',
  'n': '|\\|',
  'o': '0',
  'p': '|>',
  'q': '9',
  'r': '|2',
  's': '$',
  't': '7',
  'u': '|_|',
  'v': '\\/',
  'w': '\\/\\/',
  'x': '><',
  'y': '`/',
  'z': '2',
  // Special characters
  '!': '1',
  '?': '¿',
  '@': '4t',
  '$': '5',
  '&': '&',
  '+': '+',
  '-': '-',
  '*': '*',
  '%': '%',
  '#': '#',
  '=': '='
}

// Level configuration
const levelConfig = {
  mild: {
    availableChars: ['a', 'e', 'i', 'o', 'u'], // Only vowels
    description: 'Basic vowel conversion'
  },
  moderate: {
    availableChars: ['a', 'e', 'i', 'o', 'u', 't', 'n', 's', 'r', 'h', 'l', 'd'], // Vowels + common consonants
    description: 'Common letters conversion'
  },
  extreme: {
    availableChars: Object.keys(leetDictionary), // All letters
    description: 'Full alphabet conversion'
  }
}

// Default active characters for each level
const defaultActiveChars = {
  mild: new Set(['a', 'e', 'i', 'o', 'u']), // All vowels active by default
  moderate: new Set(['a', 'e', 'i', 'o', 'u', 't', 's', 'r']), // Vowels + common consonants
  extreme: new Set(Object.keys(leetDictionary)) // All characters
}

// DOM Elements
const inputText = document.getElementById('inputText') as HTMLTextAreaElement
const outputText = document.getElementById('outputText') as HTMLTextAreaElement
const outputSection = document.getElementById('outputSection')!
const dictionaryContainer = document.getElementById('dictionaryContainer')!
const leetLevelLabel = document.getElementById('leetLevelLabel')!
const aboutBtn = document.getElementById('aboutBtn')!
const aboutModal = document.getElementById('aboutModal')!
const closeAboutBtn = document.getElementById('closeAboutBtn')!
const copyBtn = document.getElementById('copyBtn')!
const commandPalette = document.getElementById('commandPalette')!
const commandInput = document.getElementById('commandInput') as HTMLInputElement
const addLetterModal = document.getElementById('addLetterModal')!
const newLetterInput = document.getElementById('newLetter') as HTMLInputElement
const confirmAddLetterBtn = document.getElementById('confirmAddLetter')!
const cancelAddLetterBtn = document.getElementById('cancelAddLetter')!
const toggleLeetBtn = document.getElementById('toggleLeetBtn')!
const globalLeetToggle = document.getElementById('globalLeetToggle') as HTMLInputElement

// Level buttons
const levelButtons = {
  mild: document.getElementById('mildLevel')!,
  moderate: document.getElementById('moderateLevel')!,
  extreme: document.getElementById('extremeLevel')!
}

// Leet level mapping
const leetLevels = ['mild', 'moderate', 'extreme'] as const
type LeetLevel = typeof leetLevels[number]

// Global state
let currentLevel: LeetLevel
let currentConfig: LeetConfig
let isOutputLeet = true;
let isGlobalLeet = true;
let lastInputText = '';
let lastLeetHtml = '';
let lastLeetPlain = '';

// Load leet level from localStorage
function loadLeetLevel(): LeetLevel {
  const saved = localStorage.getItem('leetLevel')
  return (saved as LeetLevel) || 'mild'
}

// Load global leet mode from localStorage
function loadGlobalLeetMode(): boolean {
  const saved = localStorage.getItem('isGlobalLeet');
  // Default to false (ENG) if not found
  return saved !== null ? JSON.parse(saved) : false;
}

// Load dictionary from localStorage
function loadDictionary(): LeetConfig {
  const saved = localStorage.getItem('leetDictionary')
  if (saved) {
    const parsed = JSON.parse(saved)
    return {
      activeChars: new Set(parsed.activeChars || Array.from(defaultActiveChars[currentLevel]))
    }
  }
  return { activeChars: new Set(defaultActiveChars[currentLevel]) }
}

// Update leet level UI
function updateLeetLevelUI(level: LeetLevel) {
  // Update button states
  Object.entries(levelButtons).forEach(([buttonLevel, button]) => {
    if (buttonLevel === level) {
      button.classList.add('bg-primary', 'text-background')
      button.classList.remove('hover:bg-surface/80')
    } else {
      button.classList.remove('bg-primary', 'text-background')
      button.classList.add('hover:bg-surface/80')
    }
    // Update button text based on global mode
    const plainText = button.dataset.plain || '';
    const leetText = button.textContent || ''; // Use existing text as leet
    button.textContent = isGlobalLeet ? leetText : plainText;
  })
  
  // Update label
  const levelLabelElement = leetLevelLabel as HTMLElement;
  const plainKey = `data-${level}-plain` as keyof HTMLElement['dataset'];
  const leetKey = `data-${level}-leet` as keyof HTMLElement['dataset'];
  levelLabelElement.textContent = isGlobalLeet
    ? levelLabelElement.dataset[leetKey] || ''
    : levelLabelElement.dataset[plainKey] || '';
}

// Save dictionary to localStorage
function saveDictionary(config: LeetConfig) {
  localStorage.setItem('leetDictionary', JSON.stringify({
    activeChars: Array.from(config.activeChars)
  }))
}

// Save leet level to localStorage
function saveLeetLevel(level: string) {
  localStorage.setItem('leetLevel', level)
}

// Save global leet mode to localStorage
function saveGlobalLeetMode(isLeet: boolean) {
  localStorage.setItem('isGlobalLeet', JSON.stringify(isLeet));
}

// Convert text using current dictionary
function convertText(text: string): { html: string, plain: string } {
  const chars = text.split('')
  const converted = chars.map((char, index) => {
    const lower = char.toLowerCase()
    const leet = leetDictionary[lower]
    const isRemoved = currentConfig.activeChars.has(`-${lower}`)
    const isAvailable = !isRemoved && (
      levelConfig[currentLevel].availableChars.includes(lower) || 
      (currentConfig.activeChars.has(lower) && !currentConfig.activeChars.has(`-${lower}`))
    )
    
    if (leet && isAvailable) {
      // Show leet version with tooltip showing original
      return `<span class="leet-char" data-original="${char}" data-leet="${leet}" data-index="${index}" data-tooltip="${char}">${leet}</span>`
    } else if (leet) {
      // Show original with tooltip showing possible leet version
      return `<span class="convertible-char" data-original="${char}" data-leet="${leet}" data-index="${index}" data-tooltip="${leet}">${char}</span>`
    }
    // No leet equivalent, return as is
    return char
  })

  const html = converted.join('')
  const plain = text.split('').map(char => {
    const lower = char.toLowerCase()
    const isRemoved = currentConfig.activeChars.has(`-${lower}`)
    const isAvailable = !isRemoved && (
      levelConfig[currentLevel].availableChars.includes(lower) || 
      (currentConfig.activeChars.has(lower) && !currentConfig.activeChars.has(`-${lower}`))
    )
    return isAvailable && leetDictionary[lower] ? leetDictionary[lower] : char
  }).join('')

  return { html, plain }
}

// Auto-expand input textarea
function autoExpandInput() {
  inputText.style.height = 'auto'; // Reset height
  inputText.style.height = `${inputText.scrollHeight}px`; // Set to scroll height
}

// Update output text
function updateOutput() {
  const input = inputText.value
  lastInputText = input;

  if (input.trim()) {
    const { html, plain } = convertText(input)
    lastLeetHtml = html;
    lastLeetPlain = plain;
    
    outputText.innerHTML = isOutputLeet ? lastLeetHtml : escapeHtml(lastInputText);
    
    outputText.dataset.plain = lastLeetPlain 
    
    outputSection.classList.add('visible')
  } else {
    lastLeetHtml = '';
    lastLeetPlain = '';
    outputText.innerHTML = ''
    outputText.dataset.plain = ''
    outputSection.classList.remove('visible')
  }
  updateToggleButtonState();
}

// Toggle command palette
function toggleCommandPalette(show?: boolean) {
  const shouldShow = show ?? !commandPalette.classList.contains('flex')
  if (shouldShow) {
    commandPalette.classList.remove('hidden')
    commandPalette.classList.add('flex')
    commandInput.focus()
  } else {
    commandPalette.classList.remove('flex')
    commandPalette.classList.add('hidden')
    commandInput.value = ''
  }
}

// Filter dictionary items
function filterDictionary(query: string) {
  const items = dictionaryContainer.children
  for (const item of items) {
    if (item.classList.contains('dictionary-item')) {
      const letterSpan = item.querySelector('span')
      const letter = letterSpan?.textContent?.toLowerCase() || ''
      const shouldShow = letter.includes(query.toLowerCase())
      const element = item as HTMLElement
      element.style.display = shouldShow ? 'flex' : 'none'
    }
  }
}

// Toggle add letter modal
function toggleAddLetterModal(show: boolean) {
  if (show) {
    addLetterModal.classList.remove('hidden')
    addLetterModal.classList.add('flex')
    newLetterInput.focus()
  } else {
    addLetterModal.classList.add('hidden')
    addLetterModal.classList.remove('flex')
    newLetterInput.value = ''
    // Return focus to command palette
    toggleCommandPalette(true)
  }
}

// Add new letter to dictionary
function addNewLetter() {
  const char = newLetterInput.value
  
  if (char && leetDictionary[char]) {
    // Remove any existing removal marker
    currentConfig.activeChars.delete(`-${char}`)
    // Add the character
    currentConfig.activeChars.add(char)
    saveDictionary(currentConfig)
    updateDictionaryDisplay()
    updateOutput()
    toggleAddLetterModal(false)
  }
}

// Preview leet value as user types
newLetterInput.addEventListener('input', () => {
  const letter = newLetterInput.value.toLowerCase()
  const letterPreview = addLetterModal.querySelector('.letter-preview') as HTMLElement
  if (letterPreview) {
    const leetValue = leetDictionary[letter] || ''
    letterPreview.textContent = leetValue
  }
})

// Event Listeners
inputText.addEventListener('input', () => {
  autoExpandInput() // Call auto-expand for input
  updateOutput()
})

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
  // Load initial state
  currentLevel = loadLeetLevel();
  isGlobalLeet = loadGlobalLeetMode(); // Load global mode
  currentConfig = loadDictionary();

  // Apply global mode FIRST
  toggleGlobalLeetMode();

  // Set GitHub link from environment variable
  const githubLink = document.getElementById('githubLink') as HTMLAnchorElement;
  const repoUrl = import.meta.env.VITE_GITHUB_REPO_URL;
  if (githubLink && repoUrl) {
    githubLink.href = repoUrl;
  }

  // Then setup the rest of the UI
  updateLeetLevelUI(currentLevel);
  updateLevel(currentLevel);
  
  autoExpandInput(); // Initial expansion for input
});

// Add click handlers for level buttons
Object.entries(levelButtons).forEach(([level, button]) => {
  button.addEventListener('click', () => {
    const newLevel = level as LeetLevel
    updateLeetLevelUI(newLevel)
    saveLeetLevel(newLevel)
    updateLevel(newLevel)
  })
})

aboutBtn.addEventListener('click', () => {
  aboutModal.classList.remove('hidden')
  aboutModal.classList.add('flex')
})

closeAboutBtn.addEventListener('click', () => {
  aboutModal.classList.add('hidden')
  aboutModal.classList.remove('flex')
})

copyBtn.addEventListener('click', async () => {
  // Store the original SVG icon
  const originalIcon = copyBtn.innerHTML;
  // Always copy the leetspeek version (stored in dataset.plain)
  const textToCopy = outputText.dataset.plain || '';
  const copiedMessage = isGlobalLeet
    ? (copyBtn as HTMLElement).dataset.leetCopied || 'C0p13d!'
    : (copyBtn as HTMLElement).dataset.plainCopied || 'Copied!';
  try {
    await navigator.clipboard.writeText(textToCopy)
    // Temporarily show "Copied!" text (respecting global language)
    copyBtn.innerHTML = `<span class="text-sm">${copiedMessage}</span>`
    setTimeout(() => {
      // Restore the original SVG icon
      copyBtn.innerHTML = originalIcon;
    }, 2000)
  } catch (err) {
    console.error('Failed to copy text:', err)
    // Restore icon immediately on error
    copyBtn.innerHTML = originalIcon;
  }
})

commandInput.addEventListener('input', () => {
  const query = commandInput.value.toLowerCase()
  filterDictionary(query)
})

confirmAddLetterBtn.addEventListener('click', addNewLetter)
cancelAddLetterBtn.addEventListener('click', () => toggleAddLetterModal(false))

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Command+K for command palette
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    if (addLetterModal.classList.contains('flex')) {
      toggleAddLetterModal(false)
    } else {
      toggleCommandPalette()
    }
  }

  // Command+/ for add letter
  if ((e.metaKey || e.ctrlKey) && e.key === '/') {
    e.preventDefault()
    toggleAddLetterModal(true)
  }

  // Command+Shift+R for reset
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
    e.preventDefault()
    resetDictionary()
  }
  
  // Escape to handle modal navigation
  if (e.key === 'Escape') {
    if (addLetterModal.classList.contains('flex')) {
      toggleAddLetterModal(false) // This will return to command palette
    } else if (commandPalette.classList.contains('flex')) {
      toggleCommandPalette(false)
    } else if (aboutModal.classList.contains('flex')) {
      aboutModal.classList.remove('flex')
      aboutModal.classList.add('hidden')
    }
  }
})

// Update dictionary display
function updateDictionaryDisplay() {
  dictionaryContainer.innerHTML = ''
  
  // Get unique characters for this level
  const uniqueChars = new Set([
    ...levelConfig[currentLevel].availableChars,
    ...Array.from(currentConfig.activeChars).filter(char => !char.startsWith('-'))
  ])
  
  // Remove characters that have been explicitly removed
  const removedChars = Array.from(currentConfig.activeChars)
    .filter(char => char.startsWith('-'))
    .map(char => char.slice(1))
  
  removedChars.forEach(char => uniqueChars.delete(char))
  
  // Show all characters from the dictionary that are available for this level
  Array.from(uniqueChars).sort().forEach((key) => {
    const value = leetDictionary[key]
    const item = document.createElement('div')
    item.className = 'dictionary-item group'
    
    item.innerHTML = `
      <div class="w-12 flex items-center gap-2">
        <span class="text-sm">${key}</span>
      </div>
      <span class="text-primary">→</span>
      <span class="flex-1 font-mono">${value}</span>
      <button class="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="${isGlobalLeet ? 'R3m0v3' : 'Remove'}">×</button>
    `

    // Add remove button handler
    const removeBtn = item.querySelector('button')!
    removeBtn.addEventListener('click', () => {
      currentConfig.activeChars.delete(key)
      if (levelConfig[currentLevel].availableChars.includes(key)) {
        // If it's a default character for this level, add it to the list of removed characters
        currentConfig.activeChars.add(`-${key}`) // Use prefix to mark as removed
      }
      saveDictionary(currentConfig)
      updateDictionaryDisplay()
      updateOutput()
    })

    dictionaryContainer.appendChild(item)
  })

  // Add level description (respecting global language)
  const description = document.createElement('div')
  description.className = 'col-span-full text-sm text-text/60 text-right js-translatable'
  description.dataset.plain = levelConfig[currentLevel].description;
  description.dataset.leet = levelConfig[currentLevel].description;
  description.textContent = isGlobalLeet ? description.dataset.leet : description.dataset.plain;
  dictionaryContainer.appendChild(description)
}

// Reset dictionary to defaults
function resetDictionary() {
  currentConfig = {
    activeChars: new Set()
  }
  saveDictionary(currentConfig)
  updateDictionaryDisplay()
  updateOutput()
}

// Update level
function updateLevel(newLevel: LeetLevel) {
  // Update current level
  currentLevel = newLevel
  
  // Load any additional characters the user has added
  const saved = localStorage.getItem('leetDictionary')
  if (saved) {
    const parsed = JSON.parse(saved)
    currentConfig = {
      activeChars: new Set(parsed.activeChars || [])
    }
  } else {
    currentConfig = {
      activeChars: new Set()
    }
  }
  
  saveDictionary(currentConfig)
  updateDictionaryDisplay()
  updateOutput()
}

// Handle character clicks in output
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement
  if (target.classList.contains('leet-char') || target.classList.contains('convertible-char')) {
    const original = target.dataset.original
    const leet = target.dataset.leet
    const isConverted = target.classList.contains('leet-char')
    
    if (isConverted) {
      // Convert back to original
      target.textContent = original ?? ''; // Provide default for undefined
      target.classList.remove('leet-char')
      target.classList.add('convertible-char')
      target.dataset.tooltip = leet ?? ''; // Provide default for undefined
    } else {
      // Convert to leet
      target.textContent = leet ?? ''; // Provide default for undefined
      target.classList.remove('convertible-char')
      target.classList.add('leet-char')
      target.dataset.tooltip = original ?? ''; // Provide default for undefined
    }
  }
})

// Helper function to escape HTML special characters for displaying plain text
function escapeHtml(unsafe: string): string {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Update toggle button icon and title based on state
function updateToggleButtonState() {
  const plainTitle = toggleLeetBtn.dataset.plainTitle || "Show Plain Text";
  const leetTitle = toggleLeetBtn.dataset.leetTitle || "Show Pl41n T3xt";
  const plainTitleAlt = toggleLeetBtn.dataset.plainTitleAlt || "Show LeetSpeek";
  const leetTitleAlt = toggleLeetBtn.dataset.leetTitleAlt || "Show L33tSp34k";

  if (isOutputLeet) {
    toggleLeetBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg> <!-- Icon suggesting "view plain" -->
    `;
    // Title depends on global setting
    toggleLeetBtn.title = isGlobalLeet ? leetTitle : plainTitle;
  } else {
    toggleLeetBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg> <!-- Icon suggesting "view leet" -->
    `;
    // Title depends on global setting
    toggleLeetBtn.title = isGlobalLeet ? leetTitleAlt : plainTitleAlt;
  }
}

// Add listener for the new toggle button
toggleLeetBtn.addEventListener('click', () => {
  isOutputLeet = !isOutputLeet;
  // Update the display immediately without reconverting
  outputText.innerHTML = isOutputLeet ? lastLeetHtml : escapeHtml(lastInputText);
  updateToggleButtonState();
});

// Add listener for the GLOBAL toggle switch
globalLeetToggle.addEventListener('change', () => {
  isGlobalLeet = globalLeetToggle.checked;
  saveGlobalLeetMode(isGlobalLeet);
  toggleGlobalLeetMode(); // Apply changes across the UI
});

// Function to toggle all UI text based on global state
function toggleGlobalLeetMode() {
  const elements = document.querySelectorAll('.js-translatable');

  elements.forEach(el => {
    const element = el as HTMLElement;
    const plainText = element.dataset.plain;
    let leetText = '';

    // For elements where plain text is stored, we need the original leet text
    // Store leet text in a new attribute if it's not already there
    if (!element.dataset.leet) {
        // Special handling for title/meta as they don't have textContent
        if (element.tagName === 'TITLE') {
            element.dataset.leet = element.textContent ?? ''; // Use textContent for <title>
        } else if (element.tagName === 'META' && element.hasAttribute('content')) {
             element.dataset.leet = element.getAttribute('content') || '';
        } else if (element.tagName === 'BUTTON' && element.id === 'copyBtn') {
             // Skip copy button text content, handle title separately below
        } else if (element.tagName === 'P' && element.closest('#aboutModal')) {
             // For About modal P, store original innerHTML as leet
             element.dataset.leet = element.innerHTML.trim(); 
        } else if (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA') {
           element.dataset.leet = element.textContent?.trim() || '';
        }
    }
    // Use stored leet text. For About P, it includes HTML.
    leetText = element.dataset.leet || ''; 

    // Handle different element types
    if ((element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) && (element.hasAttribute('data-plain-placeholder') || element.hasAttribute('data-leet-placeholder'))) {
        const plainPlaceholder = element.dataset.plainPlaceholder || '';
        const leetPlaceholder = element.dataset.leetPlaceholder || '';
        element.placeholder = isGlobalLeet ? leetPlaceholder : plainPlaceholder;
    } else if (element instanceof HTMLButtonElement && element.id === 'copyBtn') {
        const plainTitle = element.dataset.plain || '';
        const leetTitle = element.dataset.leet || element.title; // Fallback to existing title
        if (!element.dataset.leet) element.dataset.leet = leetTitle; // Store leet title
        element.title = isGlobalLeet ? leetTitle : plainTitle;
    } else if (element.tagName === 'TITLE') {
        element.textContent = isGlobalLeet ? leetText : plainText || ''; // Use textContent for <title>
    } else if (element.tagName === 'META' && element.hasAttribute('name') && element.getAttribute('name') === 'description') {
        element.setAttribute('content', isGlobalLeet ? leetText : plainText || '');
    } else if (element.tagName === 'P' && element.closest('#aboutModal')) {
        // Use innerHTML for the About modal paragraph to render <br> and <kbd>
        element.innerHTML = isGlobalLeet ? leetText : plainText || ''; 
    } else if (plainText !== undefined && element.id !== 'leetLevelLabel') { // Avoid overwriting dynamically set label here
      // Swap text content for most other elements
      element.textContent = isGlobalLeet ? leetText : plainText;
    }
  });

  // Update dynamic elements like level label and dictionary description
  updateLeetLevelUI(currentLevel); // Re-run to update level text
  updateDictionaryDisplay(); // Re-run to update dictionary text (if open)
  updateToggleButtonState(); // Update output toggle button title

  // Update global toggle checkbox state visually
  globalLeetToggle.checked = isGlobalLeet;
} 