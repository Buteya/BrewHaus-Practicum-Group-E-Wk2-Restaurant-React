import { useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import About from './components/About'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Header />
      <Hero />
      <About />
    </>
  )
}

export default App
