export default function Header({ onLogout }) {
  return (
    <header className="header">

      <div className="brand">
        Extractor Engine
        <span className="tagline">smart scraping platform</span>
      </div>

      <button className="logout" onClick={onLogout}>
        Logout
      </button>

    </header>
  )
}