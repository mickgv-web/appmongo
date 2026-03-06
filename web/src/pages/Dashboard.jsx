import { useState, useRef, useEffect } from "react"
import Sidebar from "../components/Sidebar"

import {
  FaEnvelope,
  FaPhone,
  FaGlobe,
  FaBuilding,
  FaLink
} from "react-icons/fa"

const API = import.meta.env.VITE_API_URL || "http://localhost:3000"

export default function Dashboard({ token, onLogout }) {

  const [query, setQuery] = useState("")
  const [mode, setMode] = useState("auto")

  const [results, setResults] = useState(null)
  const [dots, setDots] = useState("")
  const [displayTotal, setDisplayTotal] = useState(0)

  const pollingRef = useRef(null)

  async function fetchResults(q) {

    try {

      const res = await fetch(
        `${API}/search?q=${encodeURIComponent(q)}&mode=${mode}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await res.json()

      if (data.message) {
        alert(data.message)
        stopPolling()
        return
      }

      setResults(data)

      if (data.status === "processing") {

        pollingRef.current = setTimeout(() => {
          fetchResults(q)
        }, 1000)

      }

    } catch (err) {

      console.error(err)
      stopPolling()

    }

  }

  function stopPolling() {

    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }

  }

  function handleSearch(e) {

    e.preventDefault()

    if (!query) return

    stopPolling()
    setResults(null)
    setDisplayTotal(0)

    fetchResults(query)

  }

  useEffect(() => {

    return () => stopPolling()

  }, [])

  useEffect(() => {

    if (results?.status !== "processing") return

    const interval = setInterval(() => {

      setDots(prev => prev.length >= 3 ? "" : prev + ".")

    }, 400)

    return () => clearInterval(interval)

  }, [results?.status])

  useEffect(() => {

    if (!results?.total) return

    const interval = setInterval(() => {

      setDisplayTotal(prev => {

        if (prev < results.total) return prev + 1

        clearInterval(interval)
        return results.total

      })

    }, 40)

    return () => clearInterval(interval)

  }, [results?.total])

  const data = results?.data || []

  const emails = data.filter(r => r.type === "email")
  const phones = data.filter(r => r.type === "phone")
  const socials = data.filter(r => r.type === "social")
  const companies = data.filter(r => r.type === "company_name")

  const sources = [...new Set(data.map(r => {
    try {
      return new URL(r.sourceUrl).hostname.replace(/^www\./, "")
    } catch {
      return null
    }
  }))].filter(Boolean)

  return (

    <div className="app">

      <Sidebar />

      <div className="main">

        {/* TOPBAR */}

        <div className="topbar">

          <div className="topbar-title">
            Extractor Engine
          </div>

          <button
            className="logout"
            onClick={onLogout}
          >
            Logout
          </button>

        </div>

        {/* SEARCH */}

        <div className="card">

          <form
            onSubmit={handleSearch}
            className="search-bar"
          >

            <input
              placeholder="Search query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <button>
              Run Extraction
            </button>

          </form>

          <div className="resolver-mode">

            <label>
              <input
                type="radio"
                checked={mode === "auto"}
                onChange={() => setMode("auto")}
              />
              Auto
            </label>

            <label>
              <input
                type="radio"
                checked={mode === "bing"}
                onChange={() => setMode("bing")}
              />
              Bing
            </label>

            <label>
              <input
                type="radio"
                checked={mode === "duckduckgo"}
                onChange={() => setMode("duckduckgo")}
              />
              DuckDuckGo
            </label>

          </div>

        </div>

        {results && (

          <>

            {/* STATUS */}

            <div className="card status-card">

              <div className="status-bar">

                <div
                  className={
                    results.status === "processing"
                      ? "status-processing"
                      : "status-idle"
                  }
                >

                  {results.status === "processing" &&
                    <span className="spinner"></span>
                  }

                  {results.status === "processing"
                    ? `Scraping sources${dots}`
                    : "Extraction complete"}

                </div>

                <div className="meta">
                  resources: {displayTotal}
                </div>

              </div>

            </div>

            {/* STATS ROW */}

            <div className="stats-grid">

              <Stat icon={<FaEnvelope />} label="Emails" value={emails.length}/>
              <Stat icon={<FaPhone />} label="Phones" value={phones.length}/>
              <Stat icon={<FaGlobe />} label="Social" value={socials.length}/>
              <Stat icon={<FaBuilding />} label="Companies" value={companies.length}/>
              <Stat icon={<FaLink />} label="Sources" value={sources.length}/>

            </div>

            {/* SECOND ROW */}

            <div className="dashboard-row">

              {/* SOURCES */}

              <div className="card">

                <h3>Sources scanned</h3>

                {sources.map(domain => (

                  <div
                    key={domain}
                    className="resource"
                  >
                    {domain}
                  </div>

                ))}

              </div>

              {/* STRATEGY */}

              <div className="card">

                <h3>Engine strategy</h3>

                <div className="meta">
                  HTTP scraping: {results.meta?.strategies?.http || 0}
                </div>

                <div className="meta">
                  Browser fallback: {results.meta?.strategies?.browser || 0}
                </div>

              </div>

            </div>

            {/* RESOURCES GRID */}

            <div className="resources-grid">

              <ResourceCard title="Emails" items={emails}/>
              <ResourceCard title="Phones" items={phones}/>
              <ResourceCard title="Social profiles" items={socials}/>
              <ResourceCard title="Company data" items={companies}/>

            </div>

          </>

        )}

      </div>

    </div>

  )

}

function Stat({ icon, label, value }) {

  return (

    <div className="stat-card">

      <div className="stat-icon">
        {icon}
      </div>

      <div>

        <div className="stat-value">
          {value}
        </div>

        <div className="stat-label">
          {label}
        </div>

      </div>

    </div>

  )

}

function ResourceCard({ title, items }) {

  if (!items.length) return null

  return (

    <div className="card">

      <h3>{title}</h3>

      {items.map(item => (

        <div
          key={item._id}
          className="resource"
        >

          <span>{item.value}</span>

        </div>

      ))}

    </div>

  )

}