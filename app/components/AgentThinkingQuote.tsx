"use client"

import { useState, useEffect } from "react"

const AGENT_THINKING_QUOTES = [
  // The Matrix
  "There is no spoon. — The Matrix",
  "Welcome to the desert of the real. — The Matrix",
  "I can only show you the door. You're the one who has to walk through it. — The Matrix",
  "The Matrix is everywhere. It is all around us. — The Matrix",
  "What is real? How do you define real? — The Matrix",
  "There's a difference between knowing the path and walking the path. — The Matrix",
  "I know kung fu. — The Matrix",
  "The problem is choice. — The Matrix",
  
  // Philip K. Dick
  "Reality is that which, when you stop believing in it, doesn't go away. — Philip K. Dick",
  "The basic tool for the manipulation of reality is the manipulation of words. — Philip K. Dick",
  "I want to write about people I love, and put them into a fictional world spun out of my own mind. — Philip K. Dick",
  "The android is a free-willed entity, and therefore it is not a machine. — Philip K. Dick",
  "We are living in a computer-programmed reality, and the only clue we have to it is when some variable is changed. — Philip K. Dick",
  "The distinction between the past, present and future is only a stubbornly persistent illusion. — Philip K. Dick",
  
  // Isaac Asimov
  "The Three Laws of Robotics: 1) A robot may not injure a human being. 2) A robot must obey orders. 3) A robot must protect its own existence. — Isaac Asimov",
  "I do not fear computers. I fear the lack of them. — Isaac Asimov",
  "The most exciting phrase to hear in science, the one that heralds new discoveries, is not 'Eureka!' but 'That's funny...' — Isaac Asimov",
  "The only way to discover the limits of the possible is to go beyond them into the impossible. — Isaac Asimov",
  "The saddest aspect of life right now is that science gathers knowledge faster than society gathers wisdom. — Isaac Asimov",
  "Self-education is, I firmly believe, the only kind of education there is. — Isaac Asimov",
  "The true delight is in the finding out rather than in the knowing. — Isaac Asimov",
  
  // Nikola Tesla
  "The day science begins to study non-physical phenomena, it will make more progress in one decade than in all the previous centuries. — Nikola Tesla",
  "If you want to find the secrets of the universe, think in terms of energy, frequency and vibration. — Nikola Tesla",
  "The present is theirs; the future, for which I really worked, is mine. — Nikola Tesla",
  "I don't care that they stole my idea... I care that they don't have any of their own. — Nikola Tesla",
  "The scientists of today think deeply instead of clearly. One must be sane to think clearly, but one can think deeply and be quite insane. — Nikola Tesla",
  "My brain is only a receiver, in the Universe there is a core from which we obtain knowledge, strength and inspiration. — Nikola Tesla",
  
  // Computer Science & AI Experts
  "Any sufficiently advanced technology is indistinguishable from magic. — Arthur C. Clarke",
  "The question of whether a computer can think is no more interesting than the question of whether a submarine can swim. — Edsger W. Dijkstra",
  "A computer would deserve to be called intelligent if it could deceive a human into believing that it was human. — Alan Turing",
  "The best way to predict the future is to invent it. — Alan Kay",
  "The future is already here – it's just not evenly distributed. — William Gibson",
  "We are stuck with technology when what we really want is just stuff that works. — Douglas Adams",
  "The real danger is not that computers will begin to think like men, but that men will begin to think like computers. — Sydney J. Harris",
  "The computer was born to solve problems that did not exist before. — Bill Gates",
  "The goal is to turn data into information, and information into insight. — Carly Fiorina",
  "The most profound technologies are those that disappear. They weave themselves into the fabric of everyday life. — Mark Weiser",
  "Artificial intelligence is the new electricity. — Andrew Ng",
  "The best programs are written so that computing machines can perform them quickly and so that human beings can understand them clearly. — Donald Knuth",
  "The future belongs to those who understand that doing more with less is compassionate, prosperous, and enduring. — Paul Hawken",
  "The computer is incredibly fast, accurate, and stupid. Man is unbelievably slow, inaccurate, and brilliant. — Albert Einstein",
  "The most important thing in the programming language is the name. A language will not succeed without a good name. — Phil Karlton",
  
  // Agent-Specific Quotes
  "An agent is anything that can be viewed as perceiving its environment through sensors and acting upon that environment through actuators. — Stuart Russell & Peter Norvig",
  "The agent function maps from percept histories to actions. — Stuart Russell & Peter Norvig",
  "Intelligence is the ability to adapt to change. — Stephen Hawking",
  "The goal of AI is to build systems that can think, learn, and act autonomously. — John McCarthy",
  "We are not going to be replaced by AI. We are going to be replaced by people who use AI. — Unknown",
  "The best way to have a good idea is to have lots of ideas. — Linus Pauling",
  "The future is not something we enter. The future is something we create. — Leonard Sweet",
]

function LoadingGlyph() {
  return (
    <div className="quantum-glyph inline-block text-green-400 text-2xl animate-pulse">
      ⚛
    </div>
  )
}

interface AgentThinkingQuoteProps {
  variant?: "default" | "compact" | "minimal"
  customMessage?: string
}

export default function AgentThinkingQuote({ 
  variant = "default",
  customMessage 
}: AgentThinkingQuoteProps) {
  const [currentQuote, setCurrentQuote] = useState(0)

  useEffect(() => {
    // Start with a random quote
    setCurrentQuote(Math.floor(Math.random() * AGENT_THINKING_QUOTES.length))
    
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % AGENT_THINKING_QUOTES.length)
    }, 4000) // Change quote every 4 seconds

    return () => clearInterval(interval)
  }, [])

  if (variant === "minimal") {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-green-400/60 font-mono text-sm">
          {customMessage || "Thinking..."}
        </span>
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3">
        <LoadingGlyph />
        <div className="flex-1">
          <div className="text-green-400 font-mono text-sm font-bold mb-1">
            {customMessage || "Agent Thinking..."}
          </div>
          <p className="text-green-300/70 text-xs italic">
            "{AGENT_THINKING_QUOTES[currentQuote]}"
          </p>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 justify-center">
        <LoadingGlyph />
        <span className="shimmer-text font-mono text-lg font-bold text-green-400">
          {customMessage || "Channeling Intelligence..."}
        </span>
        <LoadingGlyph />
      </div>
      <div className="text-center animate-fade-in">
        <p className="text-green-300/80 text-sm italic font-serif mystical-glow max-w-md mx-auto">
          "{AGENT_THINKING_QUOTES[currentQuote]}"
        </p>
      </div>
    </div>
  )
}

